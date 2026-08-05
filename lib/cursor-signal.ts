"use client";

/**
 * The cursor → scene bridge.
 *
 * Before this, the cloud only moved when the page scrolled. Between scrolls it
 * was a still image with a little idle drift, which made a world you can look
 * into feel like a poster of one. The pointer now displaces fragments it
 * passes over: dust parts around it and curls back, and the fragments it
 * touches brighten toward accent.
 *
 * Two design decisions worth keeping:
 *
 *  1. **Influence is measured against the pointer's RAY, not a point in space.**
 *     A point probe can only ever stir one depth — you'd pick the plane of the
 *     current artifact and the dust parked behind it would stay dead. Measuring
 *     perpendicular distance to the camera ray means whatever sits under the
 *     cursor on screen reacts, near or far, and the influence radius grows with
 *     depth so it stays a constant size on screen. The background cloud is the
 *     thing most worth stirring: it's most of what's on screen.
 *
 *  2. **Resolved artifacts resist; dust yields.** The push is scaled down hard
 *     where a fragment has resolved into its silhouette (see uCursor* in
 *     lab-cloud.tsx). The whole piece rests on those shapes being legible at
 *     their waypoint, so the cursor is not allowed to smear one. It ruffles
 *     the edges and rearranges the room around it.
 *
 * Same shape and reasoning as `entranceSignal` in lib/entrance.ts and
 * `panelSignal` in lib/panel-signal.ts — a module singleton of continuous
 * per-frame values, deliberately NOT React state. The rig and the cloud live
 * inside the <Canvas> tree and read this from useFrame, so it must never
 * cause a re-render.
 */

export const cursorSignal = {
  /** Pointer position in NDC, -1..1, y up. */
  x: 0,
  y: 0,
  /**
   * 0..1 — how present the pointer is. A hovering mouse is 1; it falls to 0
   * when the pointer leaves the window. Touch never raises it: on a phone the
   * same gesture is already driving the camera, and having it also blow a hole
   * in the cloud reads as a bug rather than a response.
   */
  presence: 0,
  /**
   * 0..1 — how hard it is moving right now, integrated and decayed per frame.
   * A slow hover parts the dust gently; a flick throws a wake through it.
   */
  energy: 0,
  /**
   * 0..1 — sustained interest while the pointer rests on a tablet gate.
   * Eased in stepCursor. Keeps the cloud awake under a still hover and lets
   * the rig lean the camera a touch closer — the dormant tablet waking.
   */
  focus: 0,
};

/** NDC distance accumulated since the last frame, drained by stepCursor. */
let impulse = 0;
let lastX = 0;
let lastY = 0;
let seen = false;
/** Target presence, so leaving the window eases out instead of snapping. */
let presenceTarget = 0;
/** Target focus from tablet-gate hover handlers. */
let focusTarget = 0;

/** How much a unit of NDC travel per frame is worth in energy. */
const IMPULSE_GAIN = 6;
/** Energy remaining after one second of no movement. */
const ENERGY_RETENTION = 0.02;
/** Presence remaining after one second of easing. */
const PRESENCE_RETENTION = 0.001;
/** Focus remaining after one second of easing — snappier than presence. */
const FOCUS_RETENTION = 0.0001;
/** Floor on cursor energy while a gate is held, so still hover still stirs. */
const FOCUS_ENERGY_FLOOR = 0.55;

/**
 * Tablet gates call this on enter/leave. Not React state — the cloud and rig
 * read `cursorSignal.focus` from useFrame.
 */
export function setCursorFocus(on: boolean): void {
  focusTarget = on ? 1 : 0;
}

function track(e: PointerEvent): void {
  // Touch is excluded on purpose — see `presence` above.
  if (e.pointerType === "touch") {
    presenceTarget = 0;
    return;
  }
  const nx = (e.clientX / window.innerWidth) * 2 - 1;
  const ny = -((e.clientY / window.innerHeight) * 2 - 1);
  if (seen) impulse += Math.hypot(nx - lastX, ny - lastY);
  lastX = nx;
  lastY = ny;
  seen = true;
  cursorSignal.x = nx;
  cursorSignal.y = ny;
  presenceTarget = 1;
}

/**
 * Window-level rather than canvas-level: the canvas sits behind fixed
 * overlays (captions, the chapter rail, the header), and a pointer crossing
 * those should still stir the world underneath them.
 */
export function attachCursorTracking(): () => void {
  const leave = () => {
    presenceTarget = 0;
  };
  window.addEventListener("pointermove", track, { passive: true });
  window.addEventListener("pointerdown", track, { passive: true });
  window.addEventListener("pointerleave", leave);
  window.addEventListener("blur", leave);
  return () => {
    window.removeEventListener("pointermove", track);
    window.removeEventListener("pointerdown", track);
    window.removeEventListener("pointerleave", leave);
    window.removeEventListener("blur", leave);
  };
}

/**
 * Per-frame integration. Called once by the rig, before the cloud reads the
 * signal. `enabled` is false during the entrance and under reduced motion —
 * in both cases presence collapses so the cursor has no authority at all.
 *
 * Decay is expressed as "fraction remaining after one second" and raised to
 * the frame delta, so the feel is identical at 30fps and 144fps.
 */
export function stepCursor(delta: number, enabled: boolean): void {
  const dt = Math.min(Math.max(delta, 0.001), 0.1);

  cursorSignal.energy = Math.min(
    cursorSignal.energy * Math.pow(ENERGY_RETENTION, dt) + impulse * IMPULSE_GAIN,
    1,
  );
  impulse = 0;

  const target = enabled ? presenceTarget : 0;
  cursorSignal.presence += (target - cursorSignal.presence) * (1 - Math.pow(PRESENCE_RETENTION, dt));

  const focusWant = enabled ? focusTarget : 0;
  cursorSignal.focus += (focusWant - cursorSignal.focus) * (1 - Math.pow(FOCUS_RETENTION, dt));
  // A still hover on a gate has no impulse — floor energy so the wake stays lit.
  if (cursorSignal.focus > 0.02) {
    cursorSignal.energy = Math.max(
      cursorSignal.energy,
      cursorSignal.focus * FOCUS_ENERGY_FLOOR,
    );
  }
}

/** Drop all authority immediately — used when the entrance takes the camera. */
export function clearCursor(): void {
  cursorSignal.presence = 0;
  cursorSignal.energy = 0;
  cursorSignal.focus = 0;
  focusTarget = 0;
  impulse = 0;
}
