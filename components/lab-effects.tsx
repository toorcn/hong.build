"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { ChromaticAberrationEffect } from "postprocessing";
import { Vector2 } from "three";

/**
 * Postprocessing that IS the metaphor: between beats the colour splits,
 * at a resolved beat it converges to pure signal. Driven by resolveRef so
 * the aberration swells exactly when the cloud is dissolved.
 */
export function LabEffects({
  enabled,
  resolveRef,
}: {
  enabled: boolean;
  resolveRef: { current: number };
}) {
  const aberration = useMemo(
    () =>
      new ChromaticAberrationEffect({
        offset: new Vector2(0, 0),
        radialModulation: false,
        modulationOffset: 0,
      }),
    [],
  );

  useFrame(() => {
    const target = (1 - Math.min(resolveRef.current, 1)) * 0.0038;
    aberration.offset.x += (target - aberration.offset.x) * 0.12;
    aberration.offset.y += (target - aberration.offset.y) * 0.12;
  });

  if (!enabled) return null;

  return (
    <EffectComposer multisampling={0}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <primitive object={aberration} dispose={undefined} />
    </EffectComposer>
  );
}
