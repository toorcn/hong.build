"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { usePathname, useRouter } from "next/navigation";
import {
  BEATS,
  beatForRoute,
  beatT,
  spinePose,
  storyPosition,
  resolveAmount,
} from "@/lib/story";
import { useStoryStore } from "@/lib/story-store";
import { entranceSignal, WRONG_ANGLE } from "@/lib/entrance";
import { sound } from "@/lib/sound";

interface LabRigProps {
  /** Continuous beat position 0..(BEATS-1), written per frame for the shader. */
  mixRef: { current: number };
  /** Resolve amount 0..1 (1 at a beat center), written per frame. */
  resolveRef: { current: number };
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

/**
 * Hybrid narrative rig — pointer-driven, no OrbitControls.
 *
 * Scroll drives storyT → the authored spine pose (position + look-at).
 * A pointer drag adds an az/el free-look offset on top of that pose.
 * On release the offset springs back to zero, so the camera returns to the
 * authored angle at the current scroll position (option A).
 */
export function LabRig({
  mixRef,
  resolveRef,
  dimRef,
  motionScaleRef,
  reducedMotion,
}: LabRigProps) {
  const { camera, gl } = useThree();
  const router = useRouter();
  const pathname = usePathname();

  const storyT = useStoryStore((s) => s.storyT);
  const setBeat = useStoryStore((s) => s.setBeat);
  const setOriginT = useStoryStore((s) => s.setOriginT);

  /** Which beat a content route holds, or null on the journey. */
  const panelBeat = beatForRoute(pathname);
  const onPanel = panelBeat !== null;

  /** Eased 0..1: how far into a content route the camera has settled. */
  const panelEase = useRef(0);
  /** Whether the current silhouette has already played its lock chord. */
  const locked = useRef(true);

  // Free-look offset (radians) on top of the spine pose.
  const offset = useRef({ az: 0, el: 0 });
  const target = useRef({ az: 0, el: 0 });
  const drag = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0,
  });
  const lastBeat = useRef(-1);

  // Opening a content route pauses the journey — remember where, so the
  // spine can put us back on the way out.
  useEffect(() => {
    if (onPanel) setOriginT(useStoryStore.getState().storyT);
  }, [onPanel, setOriginT]);

  // Park the camera at the first beat on mount.
  useEffect(() => {
    const p = spinePose(useStoryStore.getState().storyT);
    camera.position.set(p.x, p.y, p.z);
    camera.lookAt(0, 0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  // Pointer handlers on the canvas → free-look target.
  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
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

  useFrame((state, delta) => {
    // Frame-rate independent damping. k is the responsive one (~0.15s) for
    // free-look; kSlow (~0.33s) reads as an authored camera move.
    const k = 1 - Math.pow(0.001, delta);
    const kSlow = 1 - Math.pow(0.05, delta);

    // COLD START owns the camera until it hands over. Its pose is authored
    // per-frame from entranceSignal.snap, so there's no damping here — the
    // easing is already in the signal.
    if (entranceSignal.authority > 0) {
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
      const r = THREE.MathUtils.lerp(WRONG_ANGLE.distance, BEATS[0]!.distance, s);
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
      mixRef.current = 0;
      resolveRef.current = entranceSignal.resolve;
      dimRef.current = 0;
      motionScaleRef.current = reducedMotion ? 0 : 1;
      lastBeat.current = 0;
      locked.current = true;
      return;
    }

    // On a content route the journey holds: the camera flies to that beat's
    // authored pose and its silhouette stays fully resolved behind the panel.
    const heldT = panelBeat !== null ? beatT(panelBeat) : storyT;
    const pose = spinePose(heldT);
    const { from, to, mix } = storyPosition(heldT);
    const resolve = reducedMotion || onPanel ? 1 : resolveAmount(heldT);

    panelEase.current += ((onPanel ? 1 : 0) - panelEase.current) * kSlow;

    // Smooth offset toward target; spring target back to 0 when released.
    offset.current.az += (target.current.az - offset.current.az) * k;
    offset.current.el += (target.current.el - offset.current.el) * k;
    if (!drag.current.active) {
      target.current.az *= 0.94;
      target.current.el *= 0.94;
    }

    // Spine base angles + free-look offset, closing in on a content route.
    const baseRadius = Math.max(Math.hypot(pose.x, pose.y, pose.z), 0.001);
    const radius = baseRadius * (1 - panelEase.current * PANEL_DOLLY);
    const baseAz = Math.atan2(pose.x, pose.z);
    const baseEl = Math.asin(pose.y / baseRadius);
    const azTotal = baseAz + offset.current.az;
    const elTotal = THREE.MathUtils.clamp(
      baseEl + offset.current.el - panelEase.current * PANEL_LEAN,
      -EL_LIMIT,
      EL_LIMIT,
    );
    camera.position.set(
      radius * Math.cos(elTotal) * Math.sin(azTotal),
      radius * Math.sin(elTotal),
      radius * Math.cos(elTotal) * Math.cos(azTotal),
    );
    camera.lookAt(0, 0, 0);

    // Drive the shader refs. dimRef pushes the cloud back so the reading
    // surface has room without the scene disappearing.
    mixRef.current += (from + mix - mixRef.current) * 0.16;
    resolveRef.current += (resolve - resolveRef.current) * 0.16;
    dimRef.current += (panelEase.current * PANEL_DIM - dimRef.current) * kSlow;
    motionScaleRef.current = reducedMotion ? 0 : 1;

    // Notify chrome when the active beat changes.
    const active = mix < 0.5 ? from : to;
    if (active !== lastBeat.current) {
      lastBeat.current = active;
      setBeat(active);
      if (active > 0) sound.tick();
    }

    // Two-stage audio: tick on crossing into a beat's pull (above), then the
    // resolving chord as its silhouette actually snaps into focus. Hysteresis
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

  // Double-click a resolved beat to enter its detail route.
  useEffect(() => {
    const el = gl.domElement;
    const onDoubleClick = () => {
      const beat = BEATS[lastBeat.current];
      if (beat?.route && resolveAmount(useStoryStore.getState().storyT) > 0.8) {
        sound.enter();
        router.push(beat.route);
      }
    };
    el.addEventListener("dblclick", onDoubleClick);
    return () => el.removeEventListener("dblclick", onDoubleClick);
  }, [gl, router]);

  return null;
}
