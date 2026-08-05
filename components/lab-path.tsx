"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BEAT_COUNT, BEAT_T, trackMixAt, trackNode } from "@/lib/story";
import { entranceSignal } from "@/lib/entrance";

/**
 * The track — the journey made visible.
 *
 * Eleven rooms strung along half a kilometre of world space, and until now
 * nothing on screen said they were connected or which way was forward. This
 * draws the line the camera walks: a thread of dust running under the
 * artifacts from the gate to the wordmark, with a bead where each chapter
 * sits. From inside a corridor the beads ahead converge toward the next
 * room, so the scene answers "where am I scrolling to" before the next
 * silhouette has gathered.
 *
 * It is points, additive, in the cloud's two colours, for one reason: this
 * world is made of dust, and a solid line would be the only manufactured
 * object in it. Read as a path only because of where it goes.
 *
 * Three signals carry the direction of travel, in descending strength:
 *   - a lit head that sits exactly under the viewer (hence `trackMixAt`,
 *     which undoes the camera's own per-segment easing)
 *   - the road ahead brighter than the road behind
 *   - a slow flow pulse running forward through the near stretch
 * Everything else is deliberately at the edge of visible.
 */

/**
 * Motes along the track. Spaced by arc length, so density is even.
 *
 * ~0.1 world units apart, which is what it takes to read as a line rather
 * than a dotted trail at corridor distances — at half this the road looks
 * like a row of beads a few pixels apart instead of a road.
 */
const COUNT = 5200;
/** Lateral scatter, world units — a worn trail, not a ruled line. It also
 *  keeps the distant stretch from aliasing into a crawling hairline. */
const SPREAD = 0.3;
/** Wavelength of the flow pulse, in radians across the whole track. */
const FLOW_WAVES = 130;
/** World radius of a chapter bead — the marker where the track meets a room. */
const BEAD_RADIUS = 2.2;

/** Deterministic per-index noise; the track must be identical every load. */
function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

const VERT = /* glsl */ `
  attribute float aT;     // storyT at which the camera draws level with this mote
  attribute float aU;     // normalised arc position, for the flow pulse
  attribute float aNode;  // 0..1 closeness to a chapter bead
  attribute float aSeed;

  uniform float uStoryT;
  uniform float uTime;
  uniform float uDim;
  uniform float uReveal;
  uniform float uFlow;    // 0 under reduced motion — the track goes static

  varying float vHot;
  varying float vFlow;
  varying float vAlpha;

  void main() {
    float d = aT - uStoryT;
    float ahead = step(0.0, d);

    // Two windows on the same distance: a tight head that reads as "you are
    // here", and a broad one that keeps the flow pulse local so the far
    // stretch stays a calm line instead of a running light.
    float near = exp(-abs(d) * 40.0);
    float local = exp(-abs(d) * 9.0);
    float flow = uFlow * ahead * local * (0.5 + 0.5 * sin(aU * ${FLOW_WAVES}.0 - uTime * 0.8));

    // max, not sum. At the beat you are standing on, the head and the bead
    // are the same motes a few units from the camera — added together they
    // blow out into one hot blob in front of the artifact.
    float hot = max(near, aNode * 0.75);

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;

    // Capped just under the cloud's own top mote size. A bead is a knot in
    // the thread, not an object — at the room you are standing in it is only
    // eleven units away, and any larger it out-renders the artifact above it.
    float size = mix(0.55, 1.2, aNode) + near * 0.35;
    // Floored so the far stretch doesn't drop below a pixel and start to
    // sparkle; the fog below is what takes distance out, not point size.
    gl_PointSize = max(size * (140.0 / -mv.z), 0.8);

    // The way back is quieter than the way forward, but it is still there —
    // the rooms you have walked through are the point of the piece.
    float a = mix(0.22, 0.55, ahead) + hot * 0.6 + flow * 0.22;
    a = min(a, 0.8);
    // Slower falloff than the cloud's: the track's whole job is to be legible
    // further out than the thing it leads to.
    a *= exp(-max(-mv.z - 60.0, 0.0) * 0.005);
    a *= uReveal * (1.0 - uDim * 0.75);

    vHot = hot;
    vFlow = flow;
    vAlpha = a * (0.85 + aSeed * 0.3);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3 uAccent;
  uniform vec3 uSlate;

  varying float vHot;
  varying float vFlow;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.15, d);

    float warm = clamp(vHot * 0.85 + vFlow * 0.5, 0.0, 1.0);
    vec3 col = mix(uSlate, uAccent, warm);
    gl_FragColor = vec4(col, soft * vAlpha);
  }
`;

interface LabPathProps {
  /** Unsmoothed journey position the camera is actually at, per frame. */
  walkTRef: { current: number };
  dimRef: { current: number };
  motionScaleRef: { current: number };
}

export function LabPath({ walkTRef, dimRef, motionScaleRef }: LabPathProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const nodes = Array.from({ length: BEAT_COUNT }, (_, k) => {
      const n = trackNode(k);
      return new THREE.Vector3(n.x, n.y, n.z);
    });
    // Centripetal, not uniform: the rooms are spaced 27 to 77 units apart and
    // uniform Catmull-Rom loops the curve out past the short segments.
    const curve = new THREE.CatmullRomCurve3(nodes, false, "centripetal", 0.5);
    // The default 200 divisions is ~2.6 world units per step on a curve this
    // long — coarser than the mote spacing it is meant to even out.
    curve.arcLengthDivisions = 2000;

    const position = new Float32Array(COUNT * 3);
    const aT = new Float32Array(COUNT);
    const aU = new Float32Array(COUNT);
    const aNode = new Float32Array(COUNT);
    const aSeed = new Float32Array(COUNT);

    const p = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const side = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < COUNT; i++) {
      const u = i / (COUNT - 1);
      // Arc-length parametrised, so motes are evenly spaced in world units.
      // Sampling in t instead would leave the late corridors — long in space,
      // short in storyT — seven times sparser than the early ones.
      // The 0 is "no explicit arc distance, use u" — three tests the argument
      // for truthiness, which is the same branch getPointAt takes. Its typings
      // just don't mark it optional.
      const t = curve.getUtoTmapping(u, 0);
      curve.getPoint(t, p);
      curve.getTangent(t, tangent);
      side.crossVectors(tangent, up).normalize();

      // Bead: distance to the nearer of the two rooms this sample sits between.
      // Constant in world units, which is also constant in frame: every beat
      // is viewed from the same 10–12 units out.
      const nk = Math.min(Math.max(Math.round(t), 0), BEAT_COUNT - 1);
      const dist = p.distanceTo(nodes[nk]!);
      aNode[i] = 1 - THREE.MathUtils.smoothstep(dist, BEAD_RADIUS * 0.3, BEAD_RADIUS);

      // storyT of this mote — the segment it is in, with the camera's own
      // easing undone so the lit head lands under the viewer, not ahead of it.
      const k = Math.min(Math.floor(t), BEAT_COUNT - 2);
      const mix = trackMixAt(t - k);
      aT[i] = BEAT_T[k]! + (BEAT_T[k + 1]! - BEAT_T[k]!) * mix;
      aU[i] = u;
      aSeed[i] = hash(i * 3.77 + 0.9);

      const lateral = (hash(i * 1.13) * 2 - 1) * SPREAD;
      const vertical = (hash(i * 2.71 + 5.3) * 2 - 1) * SPREAD * 0.28;
      position[i * 3] = p.x + side.x * lateral;
      position[i * 3 + 1] = p.y + vertical;
      position[i * 3 + 2] = p.z + side.z * lateral;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(position, 3));
    geo.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
    geo.setAttribute("aU", new THREE.BufferAttribute(aU, 1));
    geo.setAttribute("aNode", new THREE.BufferAttribute(aNode, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -250), 400);
    return geo;
  }, []);

  const uniforms = useMemo(
    () => ({
      uStoryT: { value: 0 },
      uTime: { value: 0 },
      uDim: { value: 0 },
      uReveal: { value: 0 },
      uFlow: { value: 1 },
      uAccent: { value: new THREE.Color("#c8ff4d") },
      uSlate: { value: new THREE.Color("#4a5468") },
    }),
    [],
  );

  useFrame((state, delta) => {
    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms;
    u.uTime!.value = state.clock.elapsedTime;

    // COLD START is a void with one mark in it. A route laid out across that
    // void would answer the question the entrance exists to ask, so the track
    // only surfaces once the journey has the camera — and it takes about a
    // second to do it, so it reads as the world extending rather than a layer
    // switching on.
    const target = entranceSignal.authority > 0 ? 0 : 1;
    const k = 1 - Math.pow(0.35, delta);
    u.uReveal!.value += (target - (u.uReveal!.value as number)) * k;

    // Straight through, not damped: the head has to stay under the camera,
    // and the rig's heldT is already the camera's own position.
    u.uStoryT!.value = walkTRef.current;
    u.uDim!.value += (dimRef.current - (u.uDim!.value as number)) * 0.1;
    u.uFlow!.value = motionScaleRef.current;
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
