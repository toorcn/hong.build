"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BEAT_TARGET_COUNT, FRAGMENT_TOTAL } from "@/lib/generated/fragments-meta";
import type { FragmentData } from "@/lib/fragments";
import { entranceSignal, SWEEP_Y_LEAD } from "@/lib/entrance";

/**
 * Narrative morph shader.
 *
 * Each fragment has BEAT_COUNT resolved targets. uMix selects the two
 * nearest beats and blends between them; uNoiseAmount swells the per-fragment
 * noise vector at the midpoint so the transition reads as a dissolve rather
 * than a slide. Per-fragment seed staggers the morph timing so the cloud
 * re-forms organically instead of in lockstep.
 */

const VERT = /* glsl */ `
  attribute vec3 aNoise;
  attribute float aSeed;
  // Per-beat resolved targets (up to 6). Each fragment's position is a
  // blend between two of these chosen by uMix.
  attribute vec3 aTarget0;
  attribute vec3 aTarget1;
  attribute vec3 aTarget2;
  attribute vec3 aTarget3;
  attribute vec3 aTarget4;
  attribute vec3 aTarget5;

  uniform float uMix;         // continuous beat position 0..(BEATS-1)
  uniform float uResolve;     // 0 = fully dissolved, 1 = fully resolved
  uniform float uTime;
  uniform float uDim;
  uniform float uMotionScale;
  uniform float uBirth;         // 0 = unborn at frame centre, 1 = in place
  uniform float uStaggerAxis;   // 0 = seed stagger, 1 = positional sweep
  uniform float uStaggerSpread; // width of the resolve stagger; 0 = off
  uniform vec2 uSpan;           // half-extent of the beat-0 mark on x and y
  uniform float uYLead;         // how much the upper line leads the sweep

  varying float vResolve;
  varying float vSeed;
  varying float vBirth;

  vec3 pickTarget(int idx) {
    if (idx == 0) return aTarget0;
    if (idx == 1) return aTarget1;
    if (idx == 2) return aTarget2;
    if (idx == 3) return aTarget3;
    if (idx == 4) return aTarget4;
    return aTarget5;
  }

  void main() {
    // Two nearest beats and the blend between them.
    float fb = clamp(uMix, 0.0, ${BEAT_TARGET_COUNT - 1}.0);
    int from = int(floor(fb));
    int to = min(from + 1, ${BEAT_TARGET_COUNT - 1});
    float localMix = fb - float(from);

    // Per-fragment stagger: shift each fragment's effective blend so the
    // cloud re-forms over a short window rather than all at once.
    float stagger = aSeed * 0.35;
    float m = smoothstep(stagger, 1.0 - stagger + 0.001, localMix);

    vec3 target = mix(pickTarget(from), pickTarget(to), m);

    // Per-fragment resolve. During the entrance sweep each fragment gets a
    // "lead" offset from its position in the beat-0 mark, so the wordmark
    // sets left-to-right with the upper line ahead of the lower — type being
    // set rather than a magic snap. On the journey uStaggerSpread is 0 and
    // resolve is exactly uResolve, preserving the beat-to-beat behaviour.
    float xn = clamp(aTarget0.x / max(uSpan.x, 0.001) * 0.5 + 0.5, 0.0, 1.0);
    float yn = clamp(aTarget0.y / max(uSpan.y, 0.001) * 0.5 + 0.5, 0.0, 1.0);
    float sweep = clamp(xn + (1.0 - yn) * uYLead, 0.0, 1.0);
    float lead = mix(aSeed, sweep, uStaggerAxis) * uStaggerSpread;
    float resolve = uStaggerSpread > 0.0
      ? smoothstep(lead, lead + 1.0 - uStaggerSpread, uResolve)
      : uResolve;

    // Dissolve: at the midpoint between beats, push fragments out along
    // their noise vector; at beats the noise vanishes. resolve can overshoot
    // past 1 at the snap, pulling fragments slightly inside the mask before
    // they relax — the over-contract.
    float dissolve = 1.0 - resolve;
    vec3 pos = target + aNoise * dissolve * 0.9;

    // Gentle idle drift, frozen when resolved and reduced for calm.
    float drift = (0.25 + max(dissolve, 0.0) * 0.75) * uMotionScale;
    float t = uTime * 0.4 + aSeed * 6.2831;
    pos.x += sin(t + aSeed * 17.0) * 0.05 * drift;
    pos.y += cos(t * 1.3 + aSeed * 11.0) * 0.05 * drift;
    pos.z += sin(t * 0.7 + aSeed * 23.0) * 0.05 * drift;

    // Birth burst: fragments ignite from a point at the centre of frame and
    // fly out to wherever they belong. Seed-staggered so the burst has a
    // leading edge instead of expanding as one uniform shell.
    float birth = smoothstep(aSeed * 0.45, aSeed * 0.45 + 0.55, uBirth);
    pos = mix(normalize(aNoise + vec3(1e-4)) * 0.06, pos, birth);

    // Fragments swell as they resolve.
    float scale = mix(0.8, 1.6, resolve) * (1.0 - uDim * 0.3) * birth;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = scale * (140.0 / -mv.z);

    vResolve = resolve;
    vSeed = aSeed;
    vBirth = birth;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3 uAccent;
  uniform vec3 uSlate;
  uniform float uDim;

  varying float vResolve;
  varying float vSeed;
  varying float vBirth;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.28, d);

    vec3 col = mix(uSlate, uAccent, vResolve);
    col *= 0.85 + vSeed * 0.3;
    col *= 1.0 - uDim * 0.55;

    float alpha = soft * mix(0.55, 1.0, vResolve) * (1.0 - uDim * 0.5) * vBirth;
    gl_FragColor = vec4(col, alpha);
  }
`;

interface LabCloudProps {
  data: FragmentData;
  /** Continuous beat position 0..(BEATS-1), updated per frame. */
  mixRef: { current: number };
  /** Resolve amount 0..1 (1 at a beat center), updated per frame. */
  resolveRef: { current: number };
  dimRef: { current: number };
  motionScaleRef: { current: number };
  maxCount?: number;
}

export function LabCloud({
  data,
  mixRef,
  resolveRef,
  dimRef,
  motionScaleRef,
  maxCount = FRAGMENT_TOTAL,
}: LabCloudProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { geometry, limit, span } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const n = data.count * 3;
    // The "position" attribute is required by three; seed it with beat 0.
    geo.setAttribute("position", new THREE.BufferAttribute(data.targets.subarray(0, n).slice(), 3));
    for (let k = 0; k < BEAT_TARGET_COUNT; k++) {
      const off = k * n;
      geo.setAttribute(
        `aTarget${k}`,
        new THREE.BufferAttribute(data.targets.subarray(off, off + n).slice(), 3),
      );
    }
    geo.setAttribute("aNoise", new THREE.BufferAttribute(data.noise, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(data.seeds, 1));
    const drawn = Math.min(maxCount, data.count);
    geo.setDrawRange(0, drawn);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 60);

    // Half-extent of the beat-0 mark, used to normalise the entrance sweep.
    // Beat 0's camera sits on +Z looking at the origin, so world x is screen
    // right and world y is screen up — the sweep axes are the mark's own.
    let spanX = 0.001;
    let spanY = 0.001;
    for (let i = 0; i < data.count; i++) {
      spanX = Math.max(spanX, Math.abs(data.targets[i * 3] ?? 0));
      spanY = Math.max(spanY, Math.abs(data.targets[i * 3 + 1] ?? 0));
    }
    return { geometry: geo, limit: drawn, span: new THREE.Vector2(spanX, spanY) };
  }, [data, maxCount]);

  const uniforms = useMemo(
    () => ({
      uMix: { value: 0 },
      uResolve: { value: 1 },
      uTime: { value: 0 },
      uDim: { value: 0 },
      uMotionScale: { value: 1 },
      uBirth: { value: 1 },
      uStaggerAxis: { value: 0 },
      uStaggerSpread: { value: 0 },
      uSpan: { value: new THREE.Vector2(1, 1) },
      uYLead: { value: SWEEP_Y_LEAD },
      uAccent: { value: new THREE.Color("#c8ff4d") },
      uSlate: { value: new THREE.Color("#4a5468") },
    }),
    [],
  );

  // The span depends on the loaded payload, so push it once it's measured.
  useEffect(() => {
    (uniforms.uSpan.value as THREE.Vector2).copy(span);
  }, [uniforms, span]);

  useFrame((state) => {
    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms;
    u.uTime!.value = state.clock.elapsedTime;
    u.uDim!.value += (dimRef.current - (u.uDim!.value as number)) * 0.1;
    u.uMotionScale!.value = motionScaleRef.current;

    // While the entrance has authority its values are authored frame by
    // frame, so they're written straight through — smoothing here on top of
    // the rig's own damping would blunt the snap into a fade.
    if (entranceSignal.authority > 0) {
      u.uMix!.value = 0;
      u.uResolve!.value = entranceSignal.resolve;
      u.uBirth!.value = entranceSignal.birth;
      u.uStaggerAxis!.value = 1;
      u.uStaggerSpread!.value = entranceSignal.staggerSpread;
      geometry.setDrawRange(0, Math.max(0, Math.floor(entranceSignal.density * limit)));
      return;
    }

    // Journey: smooth toward the live story position, sweep off.
    u.uMix!.value += (mixRef.current - (u.uMix!.value as number)) * 0.16;
    u.uResolve!.value += (resolveRef.current - (u.uResolve!.value as number)) * 0.16;
    u.uBirth!.value = 1;
    u.uStaggerAxis!.value = 0;
    u.uStaggerSpread!.value = 0;
    if (geometry.drawRange.count !== limit) geometry.setDrawRange(0, limit);
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
