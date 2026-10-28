"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePathname, useRouter } from "next/navigation";
import {
  BEATS,
  beatForRoute,
  beatT,
  framingFor,
  pathLook,
  pathPose,
  storyPosition,
  resolveAmount,
} from "@/lib/story";
import { useStoryStore } from "@/lib/story-store";
import { entranceSignal, WRONG_ANGLE } from "@/lib/entrance";
import { panelSignal } from "@/lib/panel-signal";
import { attachCursorTracking, clearCursor, cursorSignal, stepCursor } from "@/lib/cursor-signal";
import { sound } from "@/lib/sound";
import { CLOUD_HOT_EVENT, cloudSignal } from "@/lib/cloud-signal";
import { trailSignal } from "@/lib/trail-signal";
import { beginHandoff, getHandoff } from "@/lib/panel-handoff";

interface LabRigProps {
  /** Continuous journey position 0..1, written per frame for the shader. */
  storyTRef: { current: number };
  /**
   * The journey position the camera is actually at this frame — undamped,
   * and held at a chapter while a content route is open. storyTRef lags it
   * on purpose (the cloud wants the lag); the track does not, because its
   * lit head has to sit exactly under the viewer.
   */
  walkTRef: { current: number };
  /** Proximity resolve 0..1 (1 at a waypoint), written per frame. Drives
   *  the caption crossfade timing and the chromatic aberration. */
  resolveRef: { current: number };
  /** Per-beat resolve pins for the shader; -1 = let uStoryT decide. */
  overrideRef: { current: number[] };
  dimRef: { current: number };
  motionScaleRef: { current: number };
  reducedMotion: boolean;
}

/** Radians of free-look per pixel of pointer drag. */
const DRAG_SPEED = 0.005;
/** Clamp so you can't flip fully over the poles. */
const EL_LIMIT = 1.2;
/** How far the camera closes in when a content route opens. */
const PANEL_DOLLY = 0.15;
/** Radians the camera settles by on a content route — a slight lean in. */
const PANEL_LEAN = 0.06;
/** How far the cloud recedes behind a reading surface (drives uDim). */
const PANEL_DIM = 0.85;
/** Fraction of that recession given back when a row is addressed. */
const PANEL_SURGE_LIFT = 0.5;
/** Extra dolly on a surge — the scene presses toward the reader. */
const PANEL_SURGE_DOLLY = 0.06;
/** Radians of pointer parallax across the full width of a panel. */
const PANEL_PARALLAX = 0.05;
/**
 * Radians of pointer parallax on the journey itself. Larger than the panel's,
 * because on the journey there is no type competing with it — a still frame
 * that only moves on scroll reads as a screenshot of a world rather than a
 * world. Small enough that it never fights the authored beat angle.
 */
const JOURNEY_PARALLAX = 0.075;
/** How far hovering a tablet leans the camera in. */
const FOCUS_DOLLY = 0.02;

/**
 * The walk rig — pointer-driven, no OrbitControls.
 *
 * Scroll drives storyT → the path pose (position) and look target (room
 * centres). A pointer drag adds an az/el free-look offset on top of that
 * pose, orbiting the current look target. On release the offset springs
 * back to zero, so the camera returns to the authored angle at the
 * current scroll position (option A).
 *
 * A pointer that isn't dragging still counts: it leans the camera by a few
 * hundredths of a radian and it displaces the cloud (see lib/cursor-signal.ts,
 * integrated here so both the lean and the cloud read one value per frame).
 */
export function LabRig({
  storyTRef,
  walkTRef,
  resolveRef,
  overrideRef,
  dimRef,
  motionScaleRef,
  reducedMotion,
}: LabRigProps) {
  const { camera, gl } = useThree();
  const router = useRouter();
  const pathname = usePathname();

  const storyT = useStoryStore((s) => s.storyT);
  const setBeat = useStoryStore((s) => s.setBeat);

  /** Which beat a content route holds, or null on the journey. */
  const panelBeat = beatForRoute(pathname);
  const onPanel = panelBeat !== null;

  /** Eased 0..1: how far into a content route the camera has settled. */
  const panelEase = useRef(0);
  /** Eased 0..1: how much the reader is engaging with the panel's rows. */
  const panelInterest = useRef(0);
  /** Whether the current silhouette has already played its lock chord. */
  const locked = useRef(true);

  // Free-look offset (radians) on top of the path pose.
  const offset = useRef({ az: 0, el: 0 });
  const target = useRef({ az: 0, el: 0 });
  /** Smoothed pointer position driving the parallax lean, -1..1. */
  const lean = useRef({ x: 0, y: 0 });
  const drag = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0,
  });
  const lastBeat = useRef(-1);

  // Opening a content route pauses the journey — remember the chapter's
  // beat position (not raw storyT), so returning lands on that silhouette
  // even if the visitor opened the panel from a mid-dissolve scroll.
  useEffect(() => {
    if (onPanel && panelBeat !== null) {
      useStoryStore.getState().markReturnBeat(panelBeat);
    }
  }, [onPanel, panelBeat]);

  // Park the camera at the first room on mount.
  useEffect(() => {
    const t = useStoryStore.getState().storyT;
    const p = pathPose(t);
    const l = pathLook(t);
    camera.position.set(p.x, p.y, p.z);
    camera.lookAt(l.x, l.y, l.z);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  // Pointer handlers on the canvas → free-look target.
  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      // Touch scrolls; and on the track a press is a click, not a drag.
      if (e.pointerType === "touch" || trailSignal.hot) return;
      drag.current.active = true;
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag.current.active) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
      target.current.az -= dx * DRAG_SPEED;
      target.current.el = THREE.MathUtils.clamp(
        target.current.el + dy * DRAG_SPEED,
        -EL_LIMIT,
        EL_LIMIT,
      );
    };
    const up = (e: PointerEvent) => {
      if (!drag.current.active) return;
      drag.current.active = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
      sound.tick();
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  // Cursor tracking for the cloud's pointer displacement and the camera lean.
  // Window-level rather than canvas-level, so the world still reacts under the
  // fixed overlays — see lib/cursor-signal.ts.
  useEffect(() => attachCursorTracking(), []);

  // SiteCursor draws the pointer over the scene.
  useEffect(() => {
    const el = gl.domElement;
    el.style.cursor = "none";
    return () => {
      el.style.cursor = "";
    };
  }, [gl]);

  useFrame((state, delta) => {
    // Frame-rate independent damping. k is the responsive one (~0.15s) for
    // free-look; kSlow (~0.33s) reads as an authored camera move.
    const k = 1 - Math.pow(0.001, delta);
    const kSlow = 1 - Math.pow(0.05, delta);
    // Small or narrow viewports pull the camera back so the artifact clears
    // the chrome, and phones lift it above the caption band.
    const framing = framingFor(state.size.width, state.size.height);
    const pull = framing.pull;

    // Integrate the pointer once per frame, for both the cloud and the lean
    // below. Reduced motion and the entrance both strip its authority.
    stepCursor(delta, entranceSignal.authority === 0 && !reducedMotion);

    // COLD START owns the camera until it hands over. Its pose is authored
    // per-frame from entranceSignal.snap, so there's no damping here — the
    // easing is already in the signal. Room 0 sits at the origin, so the
    // wrong-angle maths is unchanged from the morph world.
    if (entranceSignal.authority > 0) {
      clearCursor();
      lean.current.x = 0;
      lean.current.y = 0;
      const s = entranceSignal.snap;
      const az = THREE.MathUtils.lerp(
        (WRONG_ANGLE.azimuthDeg * Math.PI) / 180,
        (BEATS[0]!.azimuthDeg * Math.PI) / 180,
        s,
      );
      const el = THREE.MathUtils.lerp(
        (WRONG_ANGLE.elevationDeg * Math.PI) / 180,
        (BEATS[0]!.elevationDeg * Math.PI) / 180,
        s,
      );
      const r = THREE.MathUtils.lerp(WRONG_ANGLE.distance, BEATS[0]!.distance, s) * pull;
      // A slow drift while held at the wrong angle so the void never freezes.
      const wander = reducedMotion ? 0 : (1 - s) * Math.sin(state.clock.elapsedTime * 0.28) * 0.03;
      camera.position.set(
        r * Math.cos(el) * Math.sin(az + wander),
        r * Math.sin(el),
        r * Math.cos(el) * Math.cos(az + wander),
      );
      camera.lookAt(0, 0, 0);

      // Written straight through — LabCloud reads the signal itself for the
      // shader, so these only keep the refs coherent for the handover.
      storyTRef.current = 0;
      walkTRef.current = 0;
      resolveRef.current = entranceSignal.resolve;
      dimRef.current = 0;
      motionScaleRef.current = reducedMotion ? 0 : 1;
      lastBeat.current = 0;
      locked.current = true;
      return;
    }

    // On a content route the journey holds: the camera flies to that room's
    // approach pose and its artifact stays fully resolved behind the panel.
    const heldT = panelBeat !== null ? beatT(panelBeat) : storyT;
    walkTRef.current = heldT;
    const pose = pathPose(heldT);
    const look = pathLook(heldT);
    const { from, to, mix } = storyPosition(heldT);
    const resolve = reducedMotion || onPanel ? 1 : resolveAmount(heldT);

    // Held while a hand-off is in flight: the window is still growing out of
    // the cursor's card, and the camera mustn't dolly under it.
    if (getHandoff() === null) {
      panelEase.current += ((onPanel ? 1 : 0) - panelEase.current) * kSlow;
    }

    // Reading the panel disturbs the world. Addressing a row surges the cloud
    // back toward full brightness and eases the camera a touch closer; the
    // pointer adds a slight parallax lean. Eased here rather than in the DOM
    // so a flick across several rows reads as one swell.
    const interest = onPanel ? panelSignal.energy : 0;
    panelInterest.current += (interest - panelInterest.current) * kSlow;
    const surge = panelInterest.current;

    // Smooth offset toward target; spring target back to 0 when released.
    offset.current.az += (target.current.az - offset.current.az) * k;
    offset.current.el += (target.current.el - offset.current.el) * k;
    if (!drag.current.active) {
      target.current.az *= 0.94;
      target.current.el *= 0.94;
    }

    // Path pose as an offset around the look target, so free-look orbits
    // whatever the camera is currently walking toward.
    const ox = pose.x - look.x;
    const oy = pose.y - look.y;
    const oz = pose.z - look.z;
    const baseRadius = Math.max(Math.hypot(ox, oy, oz), 0.001);
    // Hovering a tablet leans the camera in a touch toward it.
    const radius =
      baseRadius *
      pull *
      (1 -
        panelEase.current * (PANEL_DOLLY + surge * PANEL_SURGE_DOLLY) -
        cursorSignal.focus * FOCUS_DOLLY * (1 - panelEase.current));
    const baseAz = Math.atan2(ox, oz);
    const baseEl = Math.asin(oy / baseRadius);

    // Pointer parallax. On a panel the source is the panel-local pointer, so
    // the scene leans with the reader instead of sitting dead behind the type;
    // on the journey it's the window-wide cursor, gated by presence so an
    // absent pointer leaves the authored beat angle exactly as authored. The
    // two crossfade on panelEase, and the result is damped rather than applied
    // raw — an undamped lean on a high-resolution mouse is visible jitter.
    const pe = panelEase.current;
    const leanX = cursorSignal.x * cursorSignal.presence * (1 - pe) + panelSignal.px * pe;
    const leanY = cursorSignal.y * cursorSignal.presence * (1 - pe) + panelSignal.py * pe;
    lean.current.x += (leanX - lean.current.x) * kSlow;
    lean.current.y += (leanY - lean.current.y) * kSlow;
    const leanAmount = JOURNEY_PARALLAX * (1 - pe) + PANEL_PARALLAX * pe;

    const azTotal = baseAz + offset.current.az - lean.current.x * leanAmount;
    const elTotal = THREE.MathUtils.clamp(
      baseEl +
        offset.current.el -
        panelEase.current * PANEL_LEAN +
        lean.current.y * leanAmount * 0.6,
      -EL_LIMIT,
      EL_LIMIT,
    );
    camera.position.set(
      look.x + radius * Math.cos(elTotal) * Math.sin(azTotal),
      look.y + radius * Math.sin(elTotal),
      look.z + radius * Math.cos(elTotal) * Math.cos(azTotal),
    );
    // Aim below the artifact by the lift, so it rises clear of the caption.
    const lift =
      framing.liftNdc > 0
        ? framing.liftNdc *
          radius *
          Math.tan(((camera as THREE.PerspectiveCamera).fov * Math.PI) / 360) *
          (1 - panelEase.current)
        : 0;
    camera.lookAt(look.x, look.y - lift, look.z);

    // Drive the shader refs. Reduced motion pins every artifact resolved —
    // the camera still walks, but nothing gathers or ghosts. dimRef pushes
    // the cloud back so a reading surface has room without it disappearing.
    storyTRef.current += (heldT - storyTRef.current) * 0.16;
    resolveRef.current += (resolve - resolveRef.current) * 0.16;
    overrideRef.current.fill(reducedMotion ? 1 : -1);
    dimRef.current +=
      (panelEase.current * PANEL_DIM * (1 - surge * PANEL_SURGE_LIFT) - dimRef.current) *
      kSlow;
    motionScaleRef.current = reducedMotion ? 0 : 1;

    // Notify chrome when the active beat changes.
    const active = mix < 0.5 ? from : to;
    if (active !== lastBeat.current) {
      lastBeat.current = active;
      setBeat(active);
      if (active > 0) sound.tick();
    }

    // Two-stage audio: tick on crossing into a beat's pull (above), then the
    // resolving chord as its artifact actually snaps into focus. Hysteresis
    // so hovering near the threshold can't retrigger it.
    if (!onPanel && !reducedMotion) {
      if (!locked.current && resolve > 0.9) {
        locked.current = true;
        sound.lock();
      } else if (locked.current && resolve < 0.8) {
        locked.current = false;
      }
    }

    // Idle breathing so the void never freezes.
    if (!reducedMotion) {
      camera.position.y += Math.sin(state.clock.elapsedTime * 0.3) * 0.0015;
    }
  });

  // Click a resolved chapter to open its route. The cursor's preview card is
  // handed to the window (see lib/panel-handoff.ts) so it grows out of the
  // card; the token rides in the URL so only this navigation adopts it.
  useEffect(() => {
    const el = gl.domElement;
    const prefetch = () => {
      const route = cloudSignal.preview?.route;
      if (cloudSignal.hot && route) router.prefetch(route);
    };
    const onClick = () => {
      const beat = BEATS[lastBeat.current];
      const preview = cloudSignal.preview;
      if (
        !cloudSignal.hot ||
        !preview ||
        beat?.route !== preview.route ||
        resolveAmount(useStoryStore.getState().storyT) <= 0.8
      )
        return;
      if (!reducedMotion && getHandoff()) return;
      const token = beginHandoff(lastBeat.current, preview, reducedMotion);
      sound.enter();
      router.push(token ? `${preview.route}?rift=${token}` : preview.route, { scroll: false });
    };
    el.addEventListener("click", onClick);
    window.addEventListener(CLOUD_HOT_EVENT, prefetch);
    return () => {
      el.removeEventListener("click", onClick);
      window.removeEventListener(CLOUD_HOT_EVENT, prefetch);
    };
  }, [gl, router, reducedMotion]);

  return null;
}
