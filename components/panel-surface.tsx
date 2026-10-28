"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useContextBridge } from "its-fine";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { BEAT_COUNT, ROOMS, approachPose } from "@/lib/story";
import { usePanelStore } from "@/lib/panel-store";
import { useStoryStore } from "@/lib/story-store";
import { panelSignal, setPanelExit, clearPanelSignal } from "@/lib/panel-signal";
import { PanelEyebrow } from "@/components/panel-anchor";
import { SceneNext } from "@/components/scene-next";
import { sound } from "@/lib/sound";
import {
  advanceHandoff,
  clearHandoff,
  completeHandoff,
  getHandoff,
  getHandoffServer,
  subscribeHandoff,
} from "@/lib/panel-handoff";

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
 *
 * Opened from the cloud, the window doesn't rise out of the artifact: it is
 * posed square to the camera at the size and place of the cursor's preview
 * card, verified corner by corner, then unfolds from that card to its reading
 * pose (see lib/panel-handoff.ts).
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

/** Viewport width below which the window goes phone-shaped. */
const NARROW_PX = 700;

/** The torn-paper outline the preview card is cut to; the window starts as it. */
const RIFT_CLIP =
  "polygon(4% 7%,22% 3%,31% 7%,47% 2%,57% 6%,76% 3%,96% 7%,99% 20%,97% 35%,100% 51%,97% 65%,99% 89%,94% 96%,77% 93%,67% 99%,52% 94%,40% 98%,26% 92%,5% 97%,1% 86%,4% 65%,0% 50%,4% 32%)";
/** The same vertices pushed to the edges, so the clip can tween to a full rect. */
const FULL_CLIP =
  "polygon(0% 0%,22% 0%,31% 0%,47% 0%,57% 0%,76% 0%,100% 0%,100% 20%,100% 35%,100% 51%,100% 65%,100% 89%,100% 100%,77% 100%,67% 100%,52% 100%,40% 100%,26% 100%,0% 100%,0% 86%,0% 65%,0% 50%,0% 32%)";
/** Preview card content box the adoption preview is laid out at, px. */
const CARD_W = 210;
const CARD_H = 110;
/** Corner mismatch (px) past which the hand-off is abandoned for a plain rise. */
const CLAIM_TOLERANCE = 2;
/** Hold on the card before it unfolds, so the swap underneath is invisible. */
const CLAIM_HOLD_MS = 320;
const ADOPT_MS = 780;

/** Ease-in-out cubic. */
function easeInOutCubic(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

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
  const windowRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** The Escape/close fly-out, so the close button can trigger it. */
  const closeRef = useRef<(() => void) | null>(null);
  const ContextBridge = useContextBridge();
  const router = useRouter();
  const { gl, camera, size } = useThree();
  const handoff = useSyncExternalStore(subscribeHandoff, getHandoff, getHandoffServer);
  // The beat being shown — from the panel, or from a hand-off whose route
  // hasn't mounted its panel yet.
  const beat = panel?.beat ?? handoff?.beat ?? null;
  const adopting = !!(
    handoff &&
    panel?.handoffToken === handoff.token &&
    panel.beat === handoff.beat
  );

  /** Eased 0..1 arrival, driving both the world scale and the CSS fade. */
  const open = useRef(0);
  /** Set while the hand-off owns the plane's pose and scale. */
  const posed = useRef(false);
  /** Camera-facing orientation the hand-off starts from. */
  const adoptFrom = useRef<THREE.Quaternion | null>(null);
  /** 0..1 progress of the turn from the camera-facing pose to the room's. */
  const adoptTurn = useRef(0);
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
  const narrow = size.width < NARROW_PX;
  const maxH = Math.round(size.height * (narrow ? 0.72 : panel?.wide ? 0.78 : 0.74));
  // The minimum never exceeds the screen — on a phone 940px was wider than
  // the frame and the fit solve shrank the whole window to unreadable.
  const minW = Math.min(PANEL_MIN_PX, Math.round(size.width * 0.94));
  const panelW = narrow
    ? Math.round(size.width * 0.94)
    : Math.round(
        THREE.MathUtils.clamp(maxH * (size.width / size.height) * 0.95, minW, PANEL_MAX_PX),
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
    if (!panel || !opened) return;
    const move = (e: PointerEvent) => {
      panelSignal.px = (e.clientX / window.innerWidth) * 2 - 1;
      panelSignal.py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [panel, opened]);

  /**
   * Ways back out that aren't a button: Escape, a click on the world outside
   * the plane, or scrolling the surface fully off-screen past its last line.
   * Escape / click play the same fly-up so every exit shares one motion.
   */
  useEffect(() => {
    if (!panel || !opened) return;
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
      const dur = 980;

      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const y = fromY + (dist - fromY) * easeInOutCubic(p);
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
    closeRef.current = flyOutThenLeave;

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
      closeRef.current = null;
      window.removeEventListener("keydown", onKey);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [panel, opened, router, gl]);

  /**
   * Scroll past the bottom → ride the floating window up 1:1 with the wheel.
   * The last chapter has nowhere further to go, so there it's reversed:
   * scrolling back up past the top is what returns to the journey.
   * Past ~halfway, a quiet moment commits the rest of the exit; below that
   * it stays where it is. Wheel is listened on the window so the panel can
   * be scrolled away even when the pointer isn't over it.
   */
  useEffect(() => {
    if (!panel || !opened) return;
    const scroller = scrollRef.current;
    if (!scroller) return;
    const windowEl = scroller.closest(".scene-window") as HTMLElement | null;
    const reverse = panel.beat === BEAT_COUNT - 1;

    /** Commit the exit once the window is this far gone. */
    const COMMIT = 0.48;
    const SETTLE_MS = 40;

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

    const atEdge = () =>
      reverse
        ? scroller.scrollTop <= 1
        : scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;

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
      const dur = 1100;
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        paint(from + (targetPx - from) * easeInOutCubic(p));
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
      const t = paint(overflow + (reverse ? -delta : delta));
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
      // At the end of the reading surface: further scroll the same way
      // (anywhere on the page) starts lifting the window off-screen.
      if ((reverse ? e.deltaY < 0 : e.deltaY > 0) && atEdge()) {
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
      const outward = reverse ? dy < 0 : dy > 0;
      if (overflow > 0 || (outward && atEdge())) {
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
    if (beat === null) return null;
    const room = ROOMS[beat]!;
    const hero = approachPose(beat);
    const c = new THREE.Vector3(...room.center);
    const p = new THREE.Vector3(hero.x, hero.y, hero.z);
    const pos = c.clone().lerp(p, STANDOFF);
    pos.y += RECENTRE_Y;

    // Face the hero pose. A Group's default forward is -Z, so looking at the
    // camera position orients the plane's front toward the approach.
    const m = new THREE.Matrix4().lookAt(p, pos, new THREE.Vector3(0, 1, 0));
    const quat = new THREE.Quaternion().setFromRotationMatrix(m);
    return { pos, artifact: c, quat };
  }, [beat]);

  /**
   * Snap to the artifact whenever the room changes, so each chapter gets its
   * own rise. Imperative rather than a JSX `position` prop: this component
   * re-renders when `opened` flips, and R3F would re-apply that prop and yank
   * the plane back to the start mid-animation.
   */
  useEffect(() => {
    const g = group.current;
    if (!g || !placement) return;
    // A hand-off starts already at the reading position — it grows from
    // the card, not from the artifact.
    const h = getHandoff();
    if (h && h.beat === beat) {
      g.position.copy(placement.pos);
      open.current = 1;
    } else {
      g.position.copy(placement.artifact);
      open.current = 0;
    }
    setOpened(false);
  }, [placement, beat]);

  /**
   * Adopt the cursor's preview card. Pose the plane square to the camera at
   * its reading position, solve its scale to fill the frame, then lay the DOM
   * window over the card's rect with a CSS transform and the card's torn
   * clip. Verify the corners actually landed on the card (drei's projection
   * isn't exactly ours); if they did, hold, then unfold to the full window
   * while the plane turns to face the room. Any mismatch abandons the hand-off
   * and the window rises the ordinary way.
   */
  useEffect(() => {
    if (!panel || !adopting || !placement) return;
    const token = panel.handoffToken!;
    const h0 = getHandoff();
    if (!h0 || h0.token !== token || h0.phase !== "pending") return;
    const win = windowRef.current;
    const g = group.current;
    if (!win || !g) return;

    let raf = 0;
    let holdTimer = 0;
    let cancelled = false;
    let anim: Animation | null = null;

    if (!advanceHandoff(token, "pending", "preflight")) return;

    g.position.copy(placement.pos);
    const faceCam = new THREE.Matrix4().lookAt(camera.position, g.position, camera.up);
    const camQuat = new THREE.Quaternion().setFromRotationMatrix(faceCam);
    const c = new THREE.Vector3();
    g.quaternion.copy(placement.quat);
    for (let i = 0; i < 24; i++) {
      g.scale.setScalar(fit.current);
      g.updateWorldMatrix(true, false);
      const hw = (box.current.w * PX_TO_WORLD) / 2;
      const hh = (box.current.h * PX_TO_WORLD) / 2;
      let worst = 0;
      for (const [sx, sy] of CORNERS) {
        c.set(sx * hw, sy * hh, 0).applyMatrix4(g.matrixWorld).project(camera);
        worst = Math.max(worst, Math.abs(c.x), Math.abs(c.y));
      }
      if (worst <= 0.0001) break;
      const next = THREE.MathUtils.clamp(fit.current * (FILL / worst), 0.02, 40);
      const settled = Math.abs(next - fit.current) < 0.0001;
      fit.current = next;
      if (settled) break;
    }
    g.scale.setScalar(fit.current);
    g.quaternion.copy(camQuat);
    adoptFrom.current = camQuat.clone();
    adoptTurn.current = 0;
    g.updateMatrixWorld(true);
    posed.current = true;
    open.current = 1;

    const place = () => {
      if (cancelled) return;
      const h = getHandoff();
      if (!h || h.token !== token) return;
      const r = win.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) {
        raf = requestAnimationFrame(place);
        return;
      }
      // Map the window onto the card: scale in screen space, offset in the
      // window's own CSS pixels (its on-screen box is the CSS box scaled).
      let sx = h.sourceRect.width / r.width;
      let sy = h.sourceRect.height / r.height;
      const pxX = r.width / panelW;
      const pxY = r.height / maxH;
      let dx = (h.sourceRect.left - r.left) / Math.max(pxX, 0.001);
      let dy = (h.sourceRect.top - r.top) / Math.max(pxY, 0.001);
      let from = `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`;
      win.style.transformOrigin = "0 0";
      win.style.transform = from;
      win.style.setProperty("--adoption-content-scale-x", String(panelW / CARD_W));
      win.style.setProperty("--adoption-content-scale-y", String(maxH / CARD_H));
      win.style.clipPath = RIFT_CLIP;

      const corners = () =>
        Array.from(win.querySelectorAll(".scene-window-adoption-probe")).map((el) => {
          const b = el.getBoundingClientRect();
          return { x: b.left, y: b.top };
        });

      const verify = () => {
        const want = [
          [h.sourceRect.left, h.sourceRect.top],
          [h.sourceRect.left + h.sourceRect.width, h.sourceRect.top],
          [h.sourceRect.left, h.sourceRect.top + h.sourceRect.height],
          [h.sourceRect.left + h.sourceRect.width, h.sourceRect.top + h.sourceRect.height],
        ] as const;
        const got = corners();
        const error = got.reduce((m, p, i) => {
          const [wx, wy] = want[i]!;
          return Math.max(m, Math.hypot(p.x - wx, p.y - wy));
        }, 0);
        // Left on the element for the hand-off checks in scripts/.
        win.dataset.claimCornerError = error.toFixed(2);
        win.dataset.claimCornerDeltas = got
          .map((p, i) => {
            const [wx, wy] = want[i]!;
            return `${(p.x - wx).toFixed(2)}:${(p.y - wy).toFixed(2)}`;
          })
          .join(",");
        if (error > CLAIM_TOLERANCE) {
          win.style.transform = "";
          win.style.transformOrigin = "";
          win.style.clipPath = "";
          clearHandoff(token);
          return;
        }
        win.style.opacity = "1";
        if (cancelled || !advanceHandoff(token, "preflight", "claimed")) return;
        holdTimer = window.setTimeout(() => {
          if (cancelled || !advanceHandoff(token, "claimed", "adopting")) return;
          anim = win.animate(
            [
              { transform: from, clipPath: RIFT_CLIP },
              { transform: "none", clipPath: FULL_CLIP },
            ],
            { duration: ADOPT_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
          );
          anim.addEventListener(
            "finish",
            () => {
              if (cancelled || getHandoff()?.token !== token) return;
              win.style.transform = "";
              win.style.transformOrigin = "";
              win.style.clipPath = "";
              win.style.removeProperty("--adoption-content-scale-x");
              win.style.removeProperty("--adoption-content-scale-y");
              g.quaternion.copy(placement.quat);
              g.updateWorldMatrix(true, false);
              adoptFrom.current = null;
              posed.current = false;
              win.style.opacity = "1";
              completeHandoff(token);
              setOpened(true);
              requestAnimationFrame(() => win.style.removeProperty("opacity"));
            },
            { once: true },
          );
        }, CLAIM_HOLD_MS);
      };

      // One frame for the transform to land, then correct for drei's own
      // rounding using the measured corners, then verify.
      raf = requestAnimationFrame(() => {
        const got = corners();
        if (got.length === 4) {
          const [tl, tr, bl, br] = got as [
            { x: number; y: number },
            { x: number; y: number },
            { x: number; y: number },
            { x: number; y: number },
          ];
          const w = (tr.x - tl.x + (br.x - bl.x)) / 2;
          const hgt = (bl.y - tl.y + (br.y - tr.y)) / 2;
          const left = (tl.x + bl.x) / 2;
          const top = (tl.y + tr.y) / 2;
          sx *= h.sourceRect.width / Math.max(w, 0.001);
          sy *= h.sourceRect.height / Math.max(hgt, 0.001);
          dx += (h.sourceRect.left - left) / Math.max(pxX, 0.001);
          dy += (h.sourceRect.top - top) / Math.max(pxY, 0.001);
          from = `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy})`;
          win.style.transform = from;
        }
        raf = requestAnimationFrame(verify);
      });
    };

    // Two frames: drei's root has to mount and lay the window out first.
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(place);
    });

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      if (holdTimer) window.clearTimeout(holdTimer);
      anim?.cancel();
      posed.current = false;
      adoptFrom.current = null;
      win.style.removeProperty("opacity");
      win.style.removeProperty("transform");
      win.style.removeProperty("transform-origin");
      win.style.removeProperty("clip-path");
      win.style.removeProperty("--adoption-content-scale-x");
      win.style.removeProperty("--adoption-content-scale-y");
      const h = getHandoff();
      if (h?.token !== token || h.phase === "ready") return;
      if (h.phase === "claimed" || h.phase === "adopting") {
        advanceHandoff(token, h.phase, "pending");
        requestAnimationFrame(() => clearHandoff(token));
      } else {
        clearHandoff(token);
      }
    };
  }, [panel, adopting, placement, panelW, maxH, camera]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g || !placement) return;
    const k = 1 - Math.pow(0.05, delta);
    const kOpen = 1 - Math.pow(0.004, delta);
    const h = getHandoff();
    const held = h !== null && !opened;

    // Toward 1 on arrival, back toward 0 once the route has gone. A hand-off
    // holds it open — the card is already full size.
    if (held) open.current = 1;
    else open.current += ((closing ? 0 : 1) - open.current) * kOpen;
    if (!held && !closing && !opened && open.current > 0.5) setOpened(true);
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
    if (held) {
      // The hand-off owns the pose: hold the reading position and turn from
      // camera-facing to the room's orientation as the card unfolds.
      g.position.copy(placement.pos);
      if (adoptFrom.current) {
        if (h.phase === "adopting") {
          adoptTurn.current = Math.min(1, adoptTurn.current + delta / (ADOPT_MS / 1000));
          const s = 1 - Math.pow(1 - adoptTurn.current, 3);
          g.quaternion.slerpQuaternions(adoptFrom.current, placement.quat, s);
        } else {
          g.quaternion.copy(adoptFrom.current);
        }
      }
    } else {
      const targetX = placement.pos.x + driftX + panelSignal.px * 0.06;
      const targetY = placement.pos.y + driftY - panelSignal.py * 0.06;
      g.position.x += (THREE.MathUtils.lerp(placement.artifact.x, targetX, e) - g.position.x) * k;
      g.position.y += (THREE.MathUtils.lerp(placement.artifact.y, targetY, e) - g.position.y) * k;
      g.position.z = THREE.MathUtils.lerp(placement.artifact.z, placement.pos.z, e);
    }

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
    if (!posed.current && worst > 0.0001) {
      const want = fit.current * (FILL / worst);
      fit.current += (want - fit.current) * (1 - Math.pow(0.02, delta));
      fit.current = THREE.MathUtils.clamp(fit.current, 0.02, 40);
    }
    g.scale.setScalar(Math.max(0.0001, fit.current * (0.82 + e * 0.18)));
  });

  if ((!panel && !handoff) || !placement) return null;

  const title = panel?.title ?? handoff?.preview.title ?? "";
  const sub = panel?.sub ?? handoff?.preview.label;
  const shownBeat = panel?.beat ?? handoff!.beat;
  const live = getHandoff();
  const token = panel?.handoffToken ?? live?.token;
  const preview = panel?.handoffPreview ?? live?.preview;

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
        pointerEvents={opened ? "auto" : "none"}
        wrapperClass="scene-window-wrap"
      >
        <ContextBridge>
          <div
            ref={windowRef}
            className={`scene-window ${panel?.wide ? "scene-window-wide" : ""}`}
            style={{ width: panelW, height: maxH }}
            data-open={opened ? "1" : "0"}
            data-narrow={narrow ? "1" : "0"}
            data-handoff-token={token}
            inert={!opened}
            aria-hidden={!opened}
          >
            {/* Zero-size markers at the corners — the hand-off measures them. */}
            <span className="scene-window-adoption-probe" data-corner="tl" />
            <span className="scene-window-adoption-probe" data-corner="tr" />
            <span className="scene-window-adoption-probe" data-corner="bl" />
            <span className="scene-window-adoption-probe" data-corner="br" />

            {/* The card's own content, scaled up to the window, released as
                the real content resolves in underneath. */}
            {preview && !opened && (
              <div className="scene-window-adoption-preview" aria-hidden="true">
                <span className="site-cursor-preview-code">
                  {`// chapter ${preview.code} — ${preview.label.toLowerCase()}`}
                </span>
                <span className="site-cursor-preview-body">
                  <span className="site-cursor-preview-title">{preview.title}</span>
                  <span className="site-cursor-preview-excerpt">{preview.excerpt}</span>
                  <span className="site-cursor-preview-rule" />
                </span>
              </div>
            )}

            <div className="scene-window-content">
              {/* In-world framing: the window announces itself as a surface. */}
              <div className="scene-window-bar">
                <PanelEyebrow sub={sub} beat={shownBeat} />
                <button
                  type="button"
                  onClick={() => closeRef.current?.()}
                  className="focus-ring scene-window-hint"
                  aria-label="Close and return to the journey"
                >
                  <span className="scene-window-hint-key">esc</span>
                  <span className="scene-window-hint-x" aria-hidden="true">
                    ✕
                  </span>
                </button>
              </div>

              <div className="scene-window-scroll" ref={scrollRef} data-lenis-prevent>
                <h1 className="panel-title font-display text-3xl font-black leading-[0.95] tracking-tight text-type sm:text-4xl">
                  {title}
                </h1>
                <div className="panel-threshold mt-6" aria-hidden="true" />
                <div className="mt-8">{panel?.body}</div>
                {/* Phones scroll the dock with the copy; it would cover too much pinned. */}
                {narrow && (
                  <div className="scene-next-dock scene-next-dock-flat">
                    <SceneNext beat={shownBeat} />
                  </div>
                )}
              </div>
              {!narrow && (
                <div className="scene-next-dock">
                  <SceneNext beat={shownBeat} />
                </div>
              )}
            </div>
          </div>
        </ContextBridge>
      </Html>
    </group>
  );
}
