"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useLabStore } from "@/lib/store";
import type { SkyPalette } from "@/lib/scheme";

/**
 * The light scheme's ground: a dawn sky instead of a flat page. Zenith blue
 * falls through lavender to a warm horizon, with a low glow where the sun
 * would be and thin cloud drifting across it. Drawn as one clip-space quad
 * behind everything, so the fragments' ink multiplies over it like any page.
 *
 * It does not follow the camera. The rooms move; the sky is what they move
 * against, which is what makes it read as far away.
 */

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uLow;
  uniform vec3 uGlow;
  uniform float uTime;
  uniform float uAspect;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(17.0, 9.0);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float y = vUv.y;
    vec3 col = mix(uLow, uMid, smoothstep(0.0, 0.5, y));
    col = mix(col, uTop, smoothstep(0.4, 1.0, y));

    vec2 p = vec2(vUv.x * uAspect, y);

    // Low sun, wider than it is tall, behind where the captions sit.
    vec2 sun = (p - vec2(0.5 * uAspect, 0.1)) * vec2(0.5, 1.5);
    col = mix(col, uGlow, exp(-length(sun) * 2.4) * 0.5);

    // Cloud: stretched along the horizon, warped by a slower copy of itself
    // so it billows instead of sliding past as a fixed texture.
    vec2 q = vec2(p.x * 1.3 + uTime * 0.011, y * 3.0);
    float c = fbm(q + fbm(q * 0.6 - uTime * 0.007));
    c = smoothstep(0.36, 0.8, c);
    // Thinner toward the zenith, so the top of the frame stays open sky.
    c *= mix(1.0, 0.55, smoothstep(0.55, 1.0, y));
    col = mix(col, vec3(1.0), c * 0.72);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function noRaycast() {}

export function LabSky({ sky }: { sky: SkyPalette }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const reducedMotion = useLabStore((s) => s.reducedMotion);

  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color(sky.top) },
      uMid: { value: new THREE.Color(sky.mid) },
      uLow: { value: new THREE.Color(sky.low) },
      uGlow: { value: new THREE.Color(sky.glow) },
      uTime: { value: 0 },
      uAspect: { value: 1 },
    }),
    [sky],
  );

  useFrame((state) => {
    const m = materialRef.current;
    if (!m) return;
    m.uniforms.uAspect!.value = state.size.width / Math.max(state.size.height, 1);
    // A held sky is still a sky; reduced motion just stops the drift.
    if (!reducedMotion) m.uniforms.uTime!.value = state.clock.elapsedTime;
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1000} raycast={noRaycast}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
