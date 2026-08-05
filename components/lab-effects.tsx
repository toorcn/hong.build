"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { ChromaticAberrationEffect } from "postprocessing";
import { Vector2 } from "three";
import { bestVantage, useLabStore } from "@/lib/store";

/**
 * Postprocessing that IS the metaphor: misalignment splits the colour,
 * alignment resolves it to pure signal. The offset is driven imperatively
 * each frame from the best vantage weight — no ref serialization.
 */
export function LabEffects({ enabled }: { enabled: boolean }) {
  const aberration = useMemo(
    () =>
      new ChromaticAberrationEffect({
        offset: new Vector2(0.0035, 0.0035),
        radialModulation: false,
        modulationOffset: 0,
      }),
    [],
  );

  useFrame(() => {
    const { weight } = bestVantage(useLabStore.getState().weights);
    const target = (1 - Math.min(weight, 1)) * 0.0035;
    aberration.offset.x += (target - aberration.offset.x) * 0.1;
    aberration.offset.y += (target - aberration.offset.y) * 0.1;
  });

  if (!enabled) return null;

  return (
    <EffectComposer multisampling={0}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <primitive object={aberration} dispose={undefined} />
    </EffectComposer>
  );
}
