"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useContextBridge } from "its-fine";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { ROOMS, approachPose } from "@/lib/story";
import { usePanelStore } from "@/lib/panel-store";
import { panelSignal } from "@/lib/panel-signal";
import { PanelEyebrow } from "@/components/panel-anchor";
import { sound } from "@/lib/sound";

/**
 * The reading surface as an object in the world.
 *
 * The panel is a plane standing in its chapter's room, between the artifact and
 * the camera's hero position and turned to face it. It is placed once in world
 * space and never billboards — so when the camera parallaxes or dollies, the
 * panel yaws and grows exactly as a physical screen would. That is the point:
 * the perspective is the real camera's, not a CSS effect.
 *
 * Arriving and leaving are continuous. The plane rises out of the artifact —
 * scaling up from the room centre as it fades in — and collapses back into it
 * on the way out, so entering a chapter reads as moving closer to a thing you
 * were already looking at rather than a page swap.
 *
 * Context: drei's <Html> mounts its children in a SEPARATE React root
 * (ReactDOM.createRoot), so no React context crosses into it — usePathname
 * returns null and next/link has no router. its-fine's useContextBridge
 * re-provides the surrounding context inside that root, which is what keeps
 * client-side navigation and the router hooks working on the plane.
 */

/**
 * CSS width of the window — the layout width authors work in.
 *
 * Tracks the viewport's aspect so the plane's shape roughly matches the frame's.
 * Fixed at 1080 the height bound first on wide screens and the surface only
 * reached 71% of the width at 1920x1080; matching the aspect lets both axes hit
 * the fit target together. Clamped so the reading column never gets silly —
 * the content's own max-widths keep the text column narrow inside it.
 */
const PANEL_MIN_PX = 940;
const PANEL_MAX_PX = 1500;
/**
 * Base px→world mapping. The final size is NOT this — see FILL below.
 * drei maps CSS pixels to world units at `px * distanceFactor / 400`.
 */
const DISTANCE_FACTOR = 1.94;
const PX_TO_WORLD = DISTANCE_FACTOR / 400;

/**
 * Fraction of the frame the surface fills, in the tighter axis.
 *
 * A fixed distanceFactor cannot hold this: rooms use different camera
 * distances (beat 10 sits at 10 units, others at 12), so one constant measured
 * 86% of the frame on /work/tack and 116% on /contact — clipped. Instead the
 * scale is solved each frame from the real camera distance and FOV, so every
 * chapter fills the same share of the frame at every viewport size.
 *
 * Solved against the plane's four PROJECTED corners, not an on-axis estimate:
 * a keystoned quad's screen bounds are larger than its nominal height, which
 * is why an analytic fit still overflowed the bottom by up to 190px at
 * 1920x1080. Measuring the corners makes the guarantee exact, so this can sit
 * close to full-frame — 0.9 keeps a 5% margin on every side.
 */
const FILL = 0.9;

/** Local-space corner signs of the plane, for the fit solve. */
const CORNERS = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
] as const;
/** Where the panel sits between artifact (0) and hero camera (1). */
const STANDOFF = 0.52;
/**
 * The camera leans down by PANEL_LEAN in the rig, which lifts anything on the
 * view axis toward the top of the frame and was clipping the title bar. Drop
 * the plane by this much (world units) to re-centre it.
 */
const RECENTRE_Y = -0.42;

export function PanelSurface() {
  const panel = usePanelStore((s) => s.panel);
  const closing = usePanelStore((s) => s.closing);
  const clear = usePanelStore((s) => s.clear);
  const group = useRef<THREE.Group>(null);
  const ContextBridge = useContextBridge();
  const router = useRouter();
  const { gl, camera, size } = useThree();

  /** Eased 0..1 arrival, driving both the world scale and the CSS fade. */
  const open = useRef(0);
  const [opened, setOpened] = useState(false);
  /**
   * The window's CSS box, computed rather than measured.
   *
   * Measuring it was wrong: .scene-window is rendered inside drei's separate
   * React root, so the ref is still null when a normal effect runs and the
   * cached height stayed at its default while the real box was 74vh — the fit
   * solve was then sizing a quad a third smaller than reality and the bottom
   * edge ran off screen. Deriving the height from the viewport makes the CSS
   * and the solve share one number, and it's an upper bound, so short content
   * can only ever leave MORE margin.
   */
  const maxH = Math.round(size.height * (panel?.wide ? 0.78 : 0.74));
  const panelW = Math.round(
    THREE.MathUtils.clamp(
      maxH * (size.width / size.height) * 0.95,
      PANEL_MIN_PX,
      PANEL_MAX_PX,
    ),
  );
  const box = useRef({ w: panelW, h: maxH });
  box.current = { w: panelW, h: maxH };
  /** Eased scale from the corner-projection fit solve. */
  const fit = useRef(1);
  /** Scratch vector, so the per-frame solve allocates nothing. */
  const corner = useMemo(() => new THREE.Vector3(), []);

  // The flat path gets its pointer from ReadingLight, which isn't mounted
  // here — without this the rig's parallax and the plane's lean sit dead.
  useEffect(() => {
    if (!panel) return;
    const move = (e: PointerEvent) => {
      panelSignal.px = (e.clientX / window.innerWidth) * 2 - 1;
      panelSignal.py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [panel]);

  /**
   * Ways back out that aren't a button: Escape, or a click on the world
   * outside the plane. A click is only an exit if it wasn't a drag — the rig
   * uses the same gesture to orbit, and stealing it would make the scene feel
   * like it was fighting you.
   */
  useEffect(() => {
    if (!panel) return;
    const leave = () => {
      sound.enter();
      router.push("/");
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Don't hijack Escape while the reader is inside a field or a menu.
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      leave();
    };

    const el = gl.domElement;
    let downX = 0;
    let downY = 0;
    let downAt = 0;
    const down = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      downAt = e.timeStamp;
    };
    const up = (e: PointerEvent) => {
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      // A deliberate tap on empty space, not the tail of an orbit drag.
      if (moved < 6 && e.timeStamp - downAt < 600) leave();
    };

    window.addEventListener("keydown", onKey);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
    };
  }, [panel, router, gl]);

  // World placement for this chapter's room. Recomputed only when the beat
  // changes — this is static geometry, the camera is what moves.
  const placement = useMemo(() => {
    if (!panel) return null;
    const room = ROOMS[panel.beat]!;
    const hero = approachPose(panel.beat);
    const c = new THREE.Vector3(...room.center);
    const p = new THREE.Vector3(hero.x, hero.y, hero.z);
    const pos = c.clone().lerp(p, STANDOFF);
    pos.y += RECENTRE_Y;

    // Face the hero pose. A Group's default forward is -Z, so looking at the
    // camera position orients the plane's front toward the approach.
    const m = new THREE.Matrix4().lookAt(p, pos, new THREE.Vector3(0, 1, 0));
    const quat = new THREE.Quaternion().setFromRotationMatrix(m);
    return { pos, artifact: c, quat };
  }, [panel]);

  /**
   * Snap to the artifact whenever the room changes, so each chapter gets its
   * own rise. Imperative rather than a JSX `position` prop: this component
   * re-renders when `opened` flips, and R3F would re-apply that prop and yank
   * the plane back to the start mid-animation.
   */
  useEffect(() => {
    const g = group.current;
    if (!g || !placement) return;
    g.position.copy(placement.artifact);
    open.current = 0;
    setOpened(false);
  }, [placement]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g || !placement) return;
    const k = 1 - Math.pow(0.05, delta);
    const kOpen = 1 - Math.pow(0.004, delta);

    // Toward 1 on arrival, back toward 0 once the route has gone.
    open.current += ((closing ? 0 : 1) - open.current) * kOpen;
    if (!closing && !opened && open.current > 0.5) setOpened(true);
    if (closing && opened && open.current < 0.5) setOpened(false);
    // Outro finished — release the content and let the plane unmount.
    if (closing && open.current < 0.02) {
      clear();
      return;
    }

    // Rise out of the artifact: at open=0 the plane sits at the room centre,
    // at 1 it stands at its reading position, full size. Reversing this is
    // what makes leaving feel like stepping back rather than a page closing.
    const e = open.current;
    const t = state.clock.elapsedTime;
    const driftY = Math.sin(t * 0.24) * 0.035;
    const driftX = Math.cos(t * 0.19) * 0.02;
    const targetX = placement.pos.x + driftX + panelSignal.px * 0.06;
    const targetY = placement.pos.y + driftY - panelSignal.py * 0.06;

    g.position.x += (THREE.MathUtils.lerp(placement.artifact.x, targetX, e) - g.position.x) * k;
    g.position.y += (THREE.MathUtils.lerp(placement.artifact.y, targetY, e) - g.position.y) * k;
    g.position.z = THREE.MathUtils.lerp(placement.artifact.z, placement.pos.z, e);

    /*
     * Fit solve: project the plane's four corners and shrink until the worst
     * one sits inside FILL of the frame. A proportional controller rather than
     * a closed form — the projection isn't linear in scale, and the camera
     * moves slowly enough that this converges in a few frames and then holds.
     * Exact under keystone, drift, parallax and any room's camera distance.
     */
    g.updateWorldMatrix(true, false);
    const hw = (box.current.w * PX_TO_WORLD) / 2;
    const hh = (box.current.h * PX_TO_WORLD) / 2;
    let worst = 0;
    for (const [sx, sy] of CORNERS) {
      corner.set(sx * hw, sy * hh, 0).applyMatrix4(g.matrixWorld).project(camera);
      worst = Math.max(worst, Math.abs(corner.x), Math.abs(corner.y));
    }
    if (worst > 0.0001) {
      const want = fit.current * (FILL / worst);
      fit.current += (want - fit.current) * (1 - Math.pow(0.02, delta));
      fit.current = THREE.MathUtils.clamp(fit.current, 0.02, 40);
    }
    g.scale.setScalar(Math.max(0.0001, fit.current * (0.82 + e * 0.18)));
  });

  if (!panel || !placement) return null;

  return (
    <group ref={group} quaternion={placement.quat}>
      {/*
        No `occlude`. drei's "blending" mode sets pointerEvents:none AND a
        z-index on the canvas itself (Html.js), which kills R3F raycasting —
        so the in-world gate rings stop being clickable and a click on empty
        space can't reach the canvas to close the panel. It also buys nothing
        here: LabCloud renders additively with depthWrite off, so there is no
        depth for an occlusion test to read. Fragments therefore draw behind
        this plane, never in front of it.
      */}
      <Html
        transform
        distanceFactor={DISTANCE_FACTOR}
        pointerEvents="auto"
        wrapperClass="scene-window-wrap"
      >
        <ContextBridge>
          <div
            className={`scene-window ${panel.wide ? "scene-window-wide" : ""}`}
            style={{ width: panelW, maxHeight: maxH }}
            data-open={opened ? "1" : "0"}
          >
            {/* In-world framing: the window announces itself as a surface. */}
            <div className="scene-window-bar">
              <PanelEyebrow sub={panel.sub} beat={panel.beat} />
              <span className="scene-window-hint">esc</span>
            </div>

            <div className="scene-window-scroll">
              <h1 className="panel-title font-display text-4xl font-black leading-[0.95] tracking-tight text-type">
                {panel.title}
              </h1>
              <div className="panel-threshold mt-6" aria-hidden="true" />
              <div className="mt-8">{panel.body}</div>
            </div>
          </div>
        </ContextBridge>
      </Html>
    </group>
  );
}
