"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useLabStore } from "@/lib/store";
import { loadFragments, type FragmentData } from "@/lib/fragments";
import { useEntranceStore } from "@/lib/entrance";
import { FRAGMENT_TOTAL, BEAT_TARGET_COUNT } from "@/lib/generated/fragments-meta";
import { CAMERA_FOV } from "@/lib/vantages";
import { LabCloud } from "@/components/lab-cloud";
import { LabRig } from "@/components/lab-rig";
import { LabEffects } from "@/components/lab-effects";

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    setMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return mobile;
}

export function LabCanvas() {
  const setWebgl = useLabStore((s) => s.setWebgl);
  const setReducedMotion = useLabStore((s) => s.setReducedMotion);
  const reducedMotion = useLabStore((s) => s.reducedMotion);
  const mobile = useIsMobile();

  const [webgl, setWebglOk] = useState<boolean | null>(null);
  const [data, setData] = useState<FragmentData | null>(null);

  const mixRef = useRef(0);
  const resolveRef = useRef(1);
  const dimRef = useRef(0);
  const motionScaleRef = useRef(1);

  useEffect(() => {
    let available = false;
    try {
      const canvas = document.createElement("canvas");
      available = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") ?? canvas.getContext("webgl"))
      );
    } catch {
      available = false;
    }
    setWebglOk(available);
    setWebgl(available);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [setWebgl, setReducedMotion]);

  useEffect(() => {
    if (!webgl) return;
    let alive = true;
    const started = performance.now();
    const { setProgress, finishLoad } = useEntranceStore.getState();
    loadFragments((loaded, total) => {
      if (alive) setProgress(loaded, total);
    })
      .then((d) => {
        if (!alive) return;
        setData(d);
        finishLoad(Math.round(performance.now() - started));
      })
      .catch(() => {
        // No payload means no cloud — fall back to the static wordmark. The
        // entrance watches this flag and switches to its no-WebGL path.
        finishLoad(Math.round(performance.now() - started));
        setWebgl(false);
      });
    return () => {
      alive = false;
    };
  }, [webgl, setWebgl]);

  // Mobile: trim fragment count and cap DPR for sustained frame rate.
  const maxCount = mobile ? Math.floor(FRAGMENT_TOTAL * 0.55) : FRAGMENT_TOTAL;
  const dpr: [number, number] = mobile ? [1, 1.5] : [1, 2];

  if (!webgl) return null;

  return (
    <Canvas
      dpr={dpr}
      camera={{ fov: CAMERA_FOV, near: 0.1, far: 400, position: [0, 2, 12] }}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      frameloop="always"
    >
      <color attach="background" args={["#0a0b0d"]} />
      <Suspense fallback={null}>
        {data && data.beats === BEAT_TARGET_COUNT ? (
          <LabCloud
            data={data}
            mixRef={mixRef}
            resolveRef={resolveRef}
            dimRef={dimRef}
            motionScaleRef={motionScaleRef}
            maxCount={maxCount}
          />
        ) : null}
        <LabRig
          mixRef={mixRef}
          resolveRef={resolveRef}
          dimRef={dimRef}
          motionScaleRef={motionScaleRef}
          reducedMotion={reducedMotion}
        />
        <LabEffects enabled={!mobile && !reducedMotion} resolveRef={resolveRef} />
      </Suspense>
    </Canvas>
  );
}
