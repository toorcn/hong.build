"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FRAGMENTS_PER_VANTAGE, FRAGMENT_TOTAL } from "@/lib/generated/fragments-meta";
import { VANTAGE_COUNT } from "@/lib/vantages";
import type { FragmentData } from "@/lib/fragments";

const VERT = /* glsl */ `
  attribute float aVantage;
  attribute float aSeed;

  uniform float uWeights[${VANTAGE_COUNT}];
  uniform float uTime;
  uniform float uDim;        // 0 = full detail (home), 1 = dimmed (content open)
  uniform float uMotionScale; // 1 = full drift, 0 = frozen (reduced motion)

  varying float vAlign;
  varying float vSeed;

  void main() {
    int vi = int(aVantage + 0.5);
    float w = uWeights[vi];

    // Gentle per-fragment drift so the noise feels alive, frozen on lock.
    vec3 pos = position;
    float drift = (1.0 - w * 0.85) * uMotionScale;
    float t = uTime * 0.4 + aSeed * 6.2831;
    pos.x += sin(t + aSeed * 17.0) * 0.06 * drift;
    pos.y += cos(t * 1.3 + aSeed * 11.0) * 0.06 * drift;
    pos.z += sin(t * 0.7 + aSeed * 23.0) * 0.06 * drift;

    // Fragments swell slightly as their vantage aligns.
    float scale = mix(0.9, 1.5, w) * (1.0 - uDim * 0.3);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // Point size attenuated by distance.
    gl_PointSize = scale * (140.0 / -mv.z);

    vAlign = w;
    vSeed = aSeed;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3 uAccent;
  uniform vec3 uSlate;
  uniform float uDim;

  varying float vAlign;
  varying float vSeed;

  void main() {
    // Round, soft-edged points.
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.28, d);

    // Aligned fragments glow accent; the rest fall back to dim slate.
    vec3 col = mix(uSlate, uAccent, vAlign);
    // Subtle per-fragment luminance variance keeps the cloud from feeling flat.
    col *= 0.85 + vSeed * 0.3;
    // Dim the whole scene when content is open over it.
    col *= 1.0 - uDim * 0.55;

    float alpha = soft * mix(0.5, 1.0, vAlign) * (1.0 - uDim * 0.5);
    gl_FragColor = vec4(col, alpha);
  }
`;

interface LabCloudProps {
  data: FragmentData;
  weightsRef: { current: number[] };
  dimRef: { current: number };
  motionScaleRef: { current: number };
  maxCount?: number;
}

export function LabCloud({
  data,
  weightsRef,
  dimRef,
  motionScaleRef,
  maxCount = FRAGMENT_TOTAL,
}: LabCloudProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { geometry } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute(
      "aVantage",
      new THREE.BufferAttribute(new Float32Array(data.vantageIds), 1),
    );
    geo.setAttribute("aSeed", new THREE.BufferAttribute(data.seeds, 1));
    // Draw only up to maxCount (mobile trims the tail of each vantage evenly).
    geo.setDrawRange(0, Math.min(maxCount, data.count));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 40);
    return { geometry: geo };
  }, [data, maxCount]);

  const uniforms = useMemo(
    () => ({
      uWeights: { value: new Array(VANTAGE_COUNT).fill(0) as number[] },
      uTime: { value: 0 },
      uDim: { value: 0 },
      uMotionScale: { value: 1 },
      uAccent: { value: new THREE.Color("#c8ff4d") },
      uSlate: { value: new THREE.Color("#4a5468") },
    }),
    [],
  );

  useFrame((state) => {
    const mat = materialRef.current;
    if (!mat) return;
    const w = mat.uniforms.uWeights!.value as number[];
    for (let i = 0; i < VANTAGE_COUNT; i++) {
      // Smooth toward the target weights computed on the CPU from the camera.
      const target = weightsRef.current[i] ?? 0;
      w[i] = (w[i] ?? 0) + (target - (w[i] ?? 0)) * 0.12;
    }
    mat.uniforms.uTime!.value = state.clock.elapsedTime;
    const dimTarget = dimRef.current;
    mat.uniforms.uDim!.value += (dimTarget - (mat.uniforms.uDim!.value as number)) * 0.1;
    mat.uniforms.uMotionScale!.value = motionScaleRef.current;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export { FRAGMENTS_PER_VANTAGE };
