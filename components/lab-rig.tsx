"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { CAMERA_DISTANCE, VANTAGES, vantageCameraPosition } from "@/lib/vantages";
import { bestVantage, useLabStore, useSignalStore } from "@/lib/store";
import { sound } from "@/lib/sound";
import { useRouter } from "next/navigation";

/** How alignment weight falls off with angular distance from a vantage. */
const ALIGN_SIGMA_DEG = 14;
/** Weight above which a vantage is considered locked. */
const LOCK_WEIGHT = 0.86;
/** Weight above which releasing the drag magnetically snaps to the vantage. */
const SNAP_WEIGHT = 0.6;
/** Intro drift duration, seconds. */
const INTRO_SECONDS = 3.2;

function angularDistanceDeg(aAz: number, aEl: number, bAz: number, bEl: number): number {
  const az1 = THREE.MathUtils.degToRad(aAz);
  const el1 = THREE.MathUtils.degToRad(aEl);
  const az2 = THREE.MathUtils.degToRad(bAz);
  const el2 = THREE.MathUtils.degToRad(bEl);
  // Great-circle angle between two points on the sphere.
  const cos =
    Math.sin(el1) * Math.sin(el2) + Math.cos(el1) * Math.cos(el2) * Math.cos(az1 - az2);
  return THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(cos, -1, 1)));
}

interface LabRigProps {
  weightsRef: { current: number[] };
  dimRef: { current: number };
  motionScaleRef: { current: number };
  reducedMotion: boolean;
  isHome: boolean;
}

export function LabRig({ weightsRef, dimRef, motionScaleRef, reducedMotion, isHome }: LabRigProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const router = useRouter();

  const setCamera = useLabStore((s) => s.setCamera);
  const setWeights = useLabStore((s) => s.setWeights);
  const setLocked = useLabStore((s) => s.setLocked);
  const setAlignment = useLabStore((s) => s.setAlignment);
  const introPlaying = useLabStore((s) => s.introPlaying);
  const setIntroPlaying = useLabStore((s) => s.setIntroPlaying);
  const tourStep = useLabStore((s) => s.tourStep);

  const introT = useRef(0);
  const entering = useRef(false);
  // Discrete-state snapshot from the previous frame, for change detection.
  const prevDiscrete = useRef<{
    lockedId: number | null;
    alignment: string;
    bestId: number;
  }>({ lockedId: null, alignment: "SEEKING", bestId: 0 });
  const coordAccum = useRef(0);

  // Park the camera exactly on V0 at mount so the name resolves first.
  useEffect(() => {
    const v0 = vantageCameraPosition(VANTAGES[0]!);
    camera.position.set(v0.x, v0.y, v0.z);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Compute spherical position of the camera each frame, derive weights.
  // The shader reads weightsRef directly at 60fps for free; the Zustand
  // store is only updated when discrete state CHANGES (lock, alignment,
  // best vantage), so DOM components re-render a few times per gesture,
  // not 60 times per second.
  useFrame((state, delta) => {
    const controls = controlsRef.current;
    const pos = camera.position;
    const r = Math.max(pos.length(), 0.0001);
    const el = THREE.MathUtils.radToDeg(Math.asin(pos.y / r));
    const az = THREE.MathUtils.radToDeg(Math.atan2(pos.x, pos.z));

    // Intro: drift away from V0 so the resolved name crumbles to noise.
    if (introPlaying && isHome && !reducedMotion) {
      introT.current += delta;
      const t = Math.min(introT.current / INTRO_SECONDS, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const v0 = VANTAGES[0]!;
      const driftAz = v0.azimuthDeg + eased * 34;
      const driftEl = v0.elevationDeg + eased * 6;
      const target = vantageCameraPosition(
        { ...v0, azimuthDeg: driftAz, elevationDeg: driftEl },
        CAMERA_DISTANCE,
      );
      camera.position.lerp(new THREE.Vector3(target.x, target.y, target.z), 0.08);
      camera.lookAt(0, 0, 0);
      if (t >= 1) setIntroPlaying(false);
    }

    // Per-vantage alignment weights from angular proximity.
    const weights = weightsRef.current;
    for (const v of VANTAGES) {
      const d = angularDistanceDeg(az, el, v.azimuthDeg, v.elevationDeg);
      // Gaussian falloff: 1 at the vantage, ~0 by ~3 sigma.
      weights[v.id] = Math.exp(-(d * d) / (2 * ALIGN_SIGMA_DEG * ALIGN_SIGMA_DEG));
    }

    const { id, weight } = bestVantage(weights);
    const locked = weight >= LOCK_WEIGHT;
    const alignment = locked ? "LOCKED" : weight >= 0.35 ? "CLOSE" : "SEEKING";
    const lockedId = locked ? id : null;

    // Only touch the store when discrete state actually changes.
    const prev = prevDiscrete.current;
    if (prev.lockedId !== lockedId || prev.alignment !== alignment || prev.bestId !== id) {
      const nowLockedId = lockedId;
      setWeights([...weights]);
      setLocked(nowLockedId);
      setAlignment(alignment);
      setCamera(az, el);
      // Sound cues fire on real transitions only.
      if (prev.bestId !== id && weight > 0.35) sound.tick();
      if (nowLockedId !== null && prev.lockedId !== nowLockedId) sound.lock();
      prevDiscrete.current = { lockedId: nowLockedId, alignment, bestId: id };
    }

    // Live signal + coordinates flow to the HUD at a throttled cadence
    // (~12fps) via the lightweight signal channel, so the meter animates
    // smoothly during a drag without churning the discrete lab store.
    coordAccum.current += delta;
    if (coordAccum.current > 0.08) {
      coordAccum.current = 0;
      useSignalStore.getState().setBestWeight(weight);
      if (prevDiscrete.current.bestId === id) setCamera(az, el);
    }

    // Magnetic snap on release.
    if (controls && !controlsDragging.current && snapTarget.current) {
      const target = vantageCameraPosition(snapTarget.current);
      camera.position.lerp(new THREE.Vector3(target.x, target.y, target.z), 0.14);
      if (camera.position.distanceTo(new THREE.Vector3(target.x, target.y, target.z)) < 0.05) {
        snapTarget.current = null;
      }
    }

    // Scene dim + pull-back when a content route is open.
    const dimTarget = isHome ? 0 : 1;
    dimRef.current += (dimTarget - dimRef.current) * 0.08;

    // Tour drives the camera between vantages.
    if (tourStep >= 1 && tourStep <= 5) {
      const v = VANTAGES[tourStep - 1];
      if (v) {
        const target = vantageCameraPosition(v);
        camera.position.lerp(new THREE.Vector3(target.x, target.y, target.z), 0.06);
        camera.lookAt(0, 0, 0);
      }
    }

    // Gentle idle breathing so the void never feels frozen.
    if (!reducedMotion) {
      camera.position.y += Math.sin(state.clock.elapsedTime * 0.3) * 0.0015;
    }

    motionScaleRef.current = reducedMotion ? 0 : locked ? 0.15 : 1;
  });

  const controlsDragging = useRef(false);
  const snapTarget = useRef<(typeof VANTAGES)[number] | null>(null);

  const handleStart = () => {
    controlsDragging.current = true;
    snapTarget.current = null;
    // Any drag cancels the intro immediately.
    if (introPlaying) setIntroPlaying(false);
  };

  const handleEnd = () => {
    controlsDragging.current = false;
    const { id, weight } = bestVantage([...weightsRef.current]);
    if (weight >= SNAP_WEIGHT) {
      snapTarget.current = VANTAGES[id] ?? null;
    }
  };

  // Enter a locked vantage with a deliberate press (double click / tap).
  // Bound on the gl.domElement so it fires anywhere over the canvas.
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const onDoubleClick = () => {
      if (entering.current) return;
      const { id, weight } = bestVantage(weightsRef.current);
      if (weight >= LOCK_WEIGHT) {
        entering.current = true;
        sound.enter();
        router.push(VANTAGES[id]!.route);
        window.setTimeout(() => (entering.current = false), 400);
      }
    };
    el.addEventListener("dblclick", onDoubleClick);
    return () => el.removeEventListener("dblclick", onDoubleClick);
  }, [gl, router, weightsRef]);

  const controlsEnabled = useMemo(
    () => !introPlaying && tourStep < 0,
    [introPlaying, tourStep],
  );

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={controlsEnabled}
      enablePan={false}
      enableZoom={false}
      rotateSpeed={0.55}
      enableDamping
      dampingFactor={0.08}
      onStart={handleStart}
      onEnd={handleEnd}
      makeDefault
    />
  );
}
