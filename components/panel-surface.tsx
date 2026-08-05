"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useContextBridge } from "its-fine";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { ROOMS, approachPose } from "@/lib/story";
import { usePanelStore } from "@/lib/panel-store";
import { useStoryStore } from "@/lib/story-store";
import { panelSignal, setPanelExit, clearPanelSignal } from "@/lib/panel-signal";
import { PanelEyebrow } from "@/components/panel-anchor";
import { sound } from "@/lib/sound";

/**
 * How far past the last line you must scroll (in px) to dismiss the panel.
 * Full viewport — the surface rides 1:1 with the wheel until it's off-screen.
 */
function exitDistancePx(windowEl: HTMLElement | null): number {
  const h = windowEl?.offsetHeight ?? 0;
  return Math.max(h, Math.round(window.innerHeight * 0.92));
}

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
const PANEL_MAX_PX = 2000;
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
 * close to full-frame. 0.93 leaves ~3.5% on each side: at 0.955 the 2% margin
 * could not absorb the idle drift, the pointer parallax and the overscroll
 * lift together, and /contact clipped at 2560x1440. This is the largest value
 * measured clean across 20 viewport/route combinations.
 */
const FILL = 0.93;

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
const RECENTRE_Y = -0.26;

export function PanelSurface() {
  const panel = usePanelStore((s) => s.panel);
  const closing = usePanelStore((s) => s.closing);
  const clear = usePanelStore((s) => s.clear);
  const group = useRef<THREE.Group>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
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
   * Ways back out that aren't a button: Escape, a click on the world outside
   * the plane, or scrolling the surface fully off-screen past its last line.
   * Escape / click play the same fly-up so every exit shares one motion.
   */
  useEffect(() => {
    if (!panel) return;
    let left = false;
    let raf = 0;

    const leave = () => {
      if (left || usePanelStore.getState().closing) return;
      left = true;
      useStoryStore.getState().markReturnBeat(panel.beat);
      sound.enter();
      router.push("/");
    };

    const flyOutThenLeave = () => {
      if (left || usePanelStore.getState().closing) return;
      const windowEl = scrollRef.current?.closest(
        ".scene-window",
      ) as HTMLElement | null;
      const dist = exitDistancePx(windowEl);
      const fromY = panelSignal.exit * dist;
      const t0 = performance.now();
      const dur = 520;

      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const y = fromY + (dist - fromY) * eased;
        const t = y / dist;
        setPanelExit(t);
        if (windowEl) {
          windowEl.style.transition = "none";
          windowEl.style.transform = `translate3d(0, ${-y}px, 0)`;
          windowEl.style.opacity = String(Math.max(0, 1 - t));
        }
        if (p < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          raf = 0;
          leave();
        }
      };
      raf = requestAnimationFrame(tick);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      flyOutThenLeave();
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
      if (moved < 6 && e.timeStamp - downAt < 600) flyOutThenLeave();
    };

    window.addEventListener("keydown", onKey);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [panel, router, gl]);

  /**
   * Scroll past the bottom → ride the floating window up 1:1 with the wheel.
   * Past ~halfway, a quiet moment commits the rest of the exit; below that
   * it stays where it is. Wheel is listened on the window so the panel can
   * be scrolled away even when the pointer isn't over it.
   */
  useEffect(() => {
    if (!panel || !opened) return;
    const scroller = scrollRef.current;
    if (!scroller) return;
    const windowEl = scroller.closest(".scene-window") as HTMLElement | null;

    /** Commit the exit once the window is this far gone. */
    const COMMIT = 0.48;
    const SETTLE_MS = 120;

    let overflow = 0;
    let left = false;
    let settling = false;
    let settleTimer = 0;
    let animRaf = 0;

    const leave = () => {
      if (left || usePanelStore.getState().closing) return;
      left = true;
      useStoryStore.getState().markReturnBeat(panel.beat);
      sound.enter();
      router.push("/");
    };

    const atBottom = () =>
      scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;

    const paint = (px: number) => {
      const dist = exitDistancePx(windowEl);
      overflow = Math.min(dist, Math.max(0, px));
      const t = dist > 0 ? overflow / dist : 0;
      setPanelExit(t);
      if (windowEl) {
        windowEl.style.transition = "none";
        windowEl.style.transform = `translate3d(0, ${-overflow}px, 0)`;
        windowEl.style.opacity = String(Math.max(0, 1 - t * 0.95));
      }
      return t;
    };

    const clearExit = () => {
      overflow = 0;
      clearPanelSignal();
      if (windowEl) {
        windowEl.style.transition = "";
        windowEl.style.transform = "";
        windowEl.style.opacity = "";
      }
    };

    const cancelAnim = () => {
      if (animRaf) cancelAnimationFrame(animRaf);
      animRaf = 0;
      settling = false;
    };

    const animateTo = (targetPx: number, then?: () => void) => {
      cancelAnim();
      settling = true;
      const from = overflow;
      const t0 = performance.now();
      const dur = 420;
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        paint(from + (targetPx - from) * eased);
        if (p < 1) {
          animRaf = requestAnimationFrame(tick);
        } else {
          animRaf = 0;
          settling = false;
          if (targetPx <= 0) clearExit();
          then?.();
        }
      };
      animRaf = requestAnimationFrame(tick);
    };

    const onSettle = () => {
      settleTimer = 0;
      if (left || settling) return;
      const dist = exitDistancePx(windowEl);
      if (dist <= 0 || overflow <= 0) return;
      const t = overflow / dist;
      // Past halfway: finish the fly-out. Below that, leave it where the
      // visitor parked it — no snap-back.
      if (t >= COMMIT) animateTo(dist, leave);
    };

    const bumpSettle = () => {
      if (settleTimer) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(onSettle, SETTLE_MS);
    };

    const driveExit = (delta: number) => {
      cancelAnim();
      const t = paint(overflow + delta);
      if (t <= 0) {
        clearExit();
        if (settleTimer) window.clearTimeout(settleTimer);
        settleTimer = 0;
        return;
      }
      if (t >= 1) {
        leave();
        return;
      }
      bumpSettle();
    };

    const onWheel = (e: WheelEvent) => {
      // Already dismissing — wheel anywhere owns the motion.
      if (overflow > 0) {
        e.preventDefault();
        driveExit(e.deltaY);
        return;
      }
      // At the end of the reading surface: further downward scroll (anywhere
      // on the page) starts lifting the window off-screen.
      if (e.deltaY > 0 && atBottom()) {
        e.preventDefault();
        driveExit(e.deltaY);
      }
      // Otherwise leave the event alone so in-panel reading still scrolls.
    };

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? touchY;
      const dy = touchY - y;
      touchY = y;
      if (overflow > 0 || (dy > 0 && atBottom())) {
        driveExit(dy);
      }
    };
    const onTouchEnd = () => {
      if (overflow > 0) bumpSettle();
    };

    // Window-level wheel so the pointer doesn't have to sit on the panel.
    window.addEventListener("wheel", onWheel, { passive: false });
    // Touch still starts on the panel / page; window covers the drag after.
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      if (settleTimer) window.clearTimeout(settleTimer);
      cancelAnim();
      if (!left) clearExit();
    };
  }, [panel, opened, router]);

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
            style={{ width: panelW, height: maxH }}
            data-open={opened ? "1" : "0"}
          >
            {/* In-world framing: the window announces itself as a surface. */}
            <div className="scene-window-bar">
              <PanelEyebrow sub={panel.sub} beat={panel.beat} />
              <span className="scene-window-hint">esc</span>
            </div>

            <div className="scene-window-scroll" ref={scrollRef}>
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
