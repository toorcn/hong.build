"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BEATS, BEAT_COUNT, BEAT_T, CLEAR_RADIUS, ROOMS, framingFor } from "@/lib/story";
import { entranceSignal } from "@/lib/entrance";
import { cursorSignal } from "@/lib/cursor-signal";

/**
 * The rooms' walls.
 *
 * Each chapter's room had a radius and nothing to show for it: the artifact
 * floated in a void, and the only thing saying the world got bigger was the
 * copy. This draws each room's shell as a sparse sphere of the same dust the
 * cloud is made of, organised just enough to read as architecture — a
 * horizon ring, a few courses above and below it, vertical ribs, and the
 * doorways cut where the track leaves for the neighbouring rooms.
 *
 * It only exists around the frame's edges. A clear ellipse matched to the
 * artifact's footprint (CLEAR_RADIUS, scaled by the framing pull) keeps the
 * middle of the frame for the artwork; the walls fill only frame the artwork
 * isn't using. A room is lit while you stand in it and fades toward its
 * neighbours, so the late rooms' sixty-unit shells are what say "bigger".
 */

/** Motes per room. */
const PER_ROOM = 3600;

/** Shares of a room's motes: horizon ring, courses, ribs; the rest is haze. */
const HORIZON_SHARE = 0.3;
const COURSE_SHARE = 0.42;
const RIB_SHARE = 0.18;

/** Elevations (radians, before the room's flattening) of the courses. */
const COURSES = [0.16, -0.16, 0.32, -0.32, 0.55, -0.55];

/** Half-angle of the doorway cut toward each neighbouring room. */
const DOOR_ANGLE = (16 * Math.PI) / 180;

/** Ribs per room, evenly round the horizon. */
const RIBS = 12;

/** Points can't be hovered — and the walls must never steal the pointer. */
function noRaycast() {}

/** Deterministic per-index noise; the walls must be identical every load. */
function hash(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

/** Unit directions from room k's centre toward its neighbours. */
function doorways(k: number): [number, number, number][] {
  const room = ROOMS[k];
  if (!room) return [];
  const out: [number, number, number][] = [];
  for (const j of [k - 1, k + 1]) {
    const other = ROOMS[j];
    if (!other) continue;
    const dx = other.center[0] - room.center[0];
    const dy = other.center[1] - room.center[1];
    const dz = other.center[2] - room.center[2];
    const len = Math.hypot(dx, dy, dz);
    if (len < 1e-4) continue;
    out.push([dx / len, dy / len, dz / len]);
  }
  return out;
}

/**
 * How much of the vertical range the courses and ribs use. The camera sits
 * well inside the big late rooms, so a full sphere's courses would land
 * mostly overhead and underfoot; flatten them toward the horizon in
 * proportion to how far out the camera stands relative to the shell.
 */
function verticalReach(k: number): number {
  const room = ROOMS[k];
  const beat = BEATS[k];
  if (!room || !beat) return 1;
  return Math.min(1, (beat.distance * 1.6) / Math.max(room.radius, 0.001));
}

function buildWalls() {
  const count = PER_ROOM * BEAT_COUNT;
  const position = new Float32Array(count * 3);
  const room = new Float32Array(count);
  const seed = new Float32Array(count);
  const wall = new Float32Array(count * 3);
  const drift = new Float32Array(count);
  const doors = Array.from({ length: BEAT_COUNT }, (_, k) => doorways(k));
  const doorCos = Math.cos(DOOR_ANGLE);

  let i = 0;
  for (let n = 0; n < PER_ROOM; n++) {
    for (let k = 0; k < BEAT_COUNT; k++) {
      const r = ROOMS[k]!;
      const [cx, cy, cz] = r.center;
      const s = n * 13.37 + k * 7.77;
      const reach = verticalReach(k);
      const pick = hash(s + 0.11);

      let el: number;
      let band = 0;
      let rib = 0;
      if (pick < HORIZON_SHARE) {
        band = 1;
        el = (hash(s + 1.23) * 2 - 1) * 0.018;
      } else if (pick < HORIZON_SHARE + COURSE_SHARE) {
        band = 0.55;
        el =
          (COURSES[Math.floor(hash(s + 9.13) * COURSES.length)] ?? COURSES[0]!) * reach +
          (hash(s + 1.23) * 2 - 1) * 0.018;
      } else if (pick < HORIZON_SHARE + COURSE_SHARE + RIB_SHARE) {
        rib = 1;
        el = (hash(s + 2.31) * 2 - 1) * 1.2 * reach;
      } else {
        // Haze, cubed toward the horizon.
        const v = hash(s + 3.47) * 2 - 1;
        el = v * v * v * 1.25 * reach;
      }

      const az = rib
        ? (Math.floor(hash(s + 4.19) * RIBS) / RIBS) * Math.PI * 2 + (hash(s + 5.03) - 0.5) * 0.05
        : hash(s + 4.19) * Math.PI * 2;

      const ce = Math.cos(el);
      let x = ce * Math.sin(az);
      let y = Math.sin(el);
      let z = ce * Math.cos(az);

      // Inside a doorway cone: push the mote out to the cone's edge, where
      // it becomes part of the doorway's rim.
      let rim = 0;
      for (const d of doors[k]!) {
        const dot = x * d[0] + y * d[1] + z * d[2];
        if (dot <= doorCos) continue;
        let px = x - d[0] * dot;
        let py = y - d[1] * dot;
        let pz = z - d[2] * dot;
        let len = Math.hypot(px, py, pz);
        if (len < 1e-5) {
          px = d[1];
          py = -d[0];
          pz = 0;
          len = Math.hypot(px, py, pz) || 1;
        }
        px /= len;
        py /= len;
        pz /= len;
        const a = DOOR_ANGLE * (1 + (hash(s + 6.61) - 0.5) * 0.16);
        const ca = Math.cos(a);
        const sa = Math.sin(a);
        x = d[0] * ca + px * sa;
        y = d[1] * ca + py * sa;
        z = d[2] * ca + pz * sa;
        rim = 1;
        break;
      }

      const radius = r.radius * (0.95 + hash(s + 7.29) * 0.1);
      position[i * 3] = cx + x * radius;
      position[i * 3 + 1] = cy + y * radius;
      position[i * 3 + 2] = cz + z * radius;
      room[i] = k;
      seed[i] = hash(s + 8.53);
      wall[i * 3] = rim ? 0 : band;
      wall[i * 3 + 1] = rib;
      wall[i * 3 + 2] = rim;
      drift[i] = r.radius * 0.01;
      i++;
    }
  }
  return { position, room, seed, wall, drift, count };
}

const LAST = BEAT_COUNT - 1;

const VERT = /* glsl */ `
  attribute float aRoom;
  attribute float aSeed;
  /** x = band (1 horizon ring, 0.55 course), y = 1 on a rib, z = 1 on a rim. */
  attribute vec3 aWall;
  attribute float aDrift;

  uniform float uStoryT;
  uniform float uBeatT[${BEAT_COUNT}];
  uniform float uTime;
  uniform float uDim;
  uniform float uReveal;
  uniform float uMotionScale;
  uniform float uResolve;
  uniform float uGain;
  /** NDC half-extents of the artifact's footprint, and its offset in frame. */
  uniform vec2 uClear;
  uniform float uClearY;
  uniform float uSoft;
  uniform float uRingFloor;
  uniform float uFlatten;
  uniform float uFlatSize;
  uniform float uSizeScale;

  uniform vec3 uCamPos;
  uniform vec3 uRay;
  uniform vec3 uRayPrev;
  uniform float uCursor;
  uniform float uCursorEnergy;
  uniform float uConeBase;
  uniform float uConeSlope;

  varying float vAlpha;
  varying float vWarm;

  /**
   * Influence of one pointer ray on a point, and the displacement it wants.
   *
   * Same cone as the cloud's (lib/cursor-signal.ts explains why influence is
   * measured perpendicular to the RAY rather than to a point in space), but
   * tuned for a surface tens of units out: the depth damping is gentler,
   * because a wall reacting proportionally on screen is the whole effect.
   */
  float coneInfluence(vec3 p, vec3 dir, out vec3 push) {
    push = vec3(0.0);
    vec3 rel = p - uCamPos;
    float along = dot(rel, dir);
    if (along <= 0.1) return 0.0;

    vec3 perp = rel - dir * along;
    float d = length(perp);
    float radius = uConeBase + along * uConeSlope;
    float infl = 1.0 - smoothstep(radius * 0.15, radius, d);
    if (infl <= 0.0) return 0.0;

    vec3 outward = d > 1e-4 ? perp / d : vec3(1.0, 0.0, 0.0);
    // Radial parting plus a swirl about the ray, so the wall sloshes rather
    // than dents.
    vec3 flow = outward + cross(dir, outward) * 0.65;
    push = flow * radius * mix(1.0, 0.7, clamp(along / 220.0, 0.0, 1.0));
    return infl * infl;
  }

  void main() {
    int room = int(aRoom + 0.5);
    float bt = uBeatT[room];
    // Clamped indices rather than a guarded ternary: a driver free to evaluate
    // both branches would read uBeatT[-1].
    float prevT = uBeatT[max(room - 1, 0)];
    float nextT = uBeatT[min(room + 1, ${LAST})];
    // At the ends, mirror the one real neighbour so the falloff stays
    // symmetrical instead of collapsing to zero width.
    float lo = room == 0 ? bt - (nextT - bt) : prevT;
    float hi = room == ${LAST} ? bt + (bt - prevT) : nextT;

    // Presence: 1 standing in this room, 0 at either neighbour. Normalised per
    // side, because BEAT_T is deliberately uneven — the long gap across the
    // four quiet years must not leave the gate's walls lit halfway to 2022.
    float d = uStoryT - bt;
    float span = d < 0.0 ? max(bt - lo, 1e-4) : max(hi - bt, 1e-4);
    float near = 1.0 - smoothstep(0.0, 1.0, clamp(abs(d) / span, 0.0, 1.0));
    near = pow(near, 1.35);

    // Idle drift, scaled by the room's own radius so every room breathes by
    // the same amount on screen.
    vec3 pos = position;
    float t = uTime * 0.09 + aSeed * 6.2831;
    float amp = aDrift * uMotionScale;
    pos.x += sin(t + aSeed * 12.0) * amp;
    pos.y += cos(t * 1.21 + aSeed * 7.0) * amp * 0.7;
    pos.z += sin(t * 0.83 + aSeed * 19.0) * amp;

    // The pointer. Two rays — this frame's and last frame's — so a flick
    // sloshes the whole stretch of wall it swept past.
    vec3 pushA;
    vec3 pushB;
    float ia = coneInfluence(pos, uRay, pushA);
    float ib = coneInfluence(pos, uRayPrev, pushB);
    float infl = max(ia, ib);
    vec3 push = ia >= ib ? pushA : pushB;
    float touch = infl * uCursor;
    pos += push * touch * uMotionScale * (0.05 + uCursorEnergy * 0.14);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float depth = max(-mv.z, 0.001);
    // The wall you are standing against.
    //
    // Wherever the camera sits close to its room's shell, those motes are only a
    // few units away, and the flattened size curve blows them up to the 9px
    // ceiling — wall-checks caught the consequence on a short landscape frame
    // (844x390, where framing() dollies back ~2x and puts parts of the shell 4-8
    // units out): the peripheral lift spiked from ~0.5 to 15, a solid wash rather
    // than a wall. So the near wall fades out over a generous range instead of
    // being walked through. Also covers the gate, whose 9-unit shell passes
    // within two units of the camera at its authored distance.
    float nearFade = smoothstep(2.5, 14.0, depth);
    // Slower falloff than the cloud's: the walls have to survive out to the
    // sixty-unit shells of the late rooms, which is the whole growth cue.
    float far = exp(-max(depth - 90.0, 0.0) * 0.006);

    // The clear ellipse — see the header. Matched to the artifact's footprint,
    // so the haze only ever occupies frame the artwork isn't using.
    vec2 ndc = gl_Position.xy / max(abs(gl_Position.w), 1e-4);
    vec2 rel = vec2(ndc.x, ndc.y - uClearY) / max(uClear, vec2(0.001));
    float edge = smoothstep(1.0, 1.0 + uSoft, length(rel));
    // Rings carry on across the middle at a floor; haze does not. A horizon
    // with its middle deleted is two stubs at the frame edges, which is what
    // the first cut looked like.
    float band = aWall.x;
    edge = max(edge, band * uRingFloor);

    // Mote size — and the single biggest thing the first cut got wrong.
    //
    // These coefficients were about a quarter of this, which put the walls at
    // 1–2px. An A/B of the real rendered frame then showed the layer carried NO
    // measurable luminance into the periphery at all: a 1px dot has no area to
    // contribute, however many of them there are, so 500 of them and 5 of them
    // look the same. It was also the wrong material — pinpricks read as a
    // starfield, while the cloud draws its own motes at 9–19px ('140.0 / -mv.z'
    // over a scale of 0.8–1.6) and this world is made of one substance.
    //
    // Rings get a little more body than the haze, so the arcs cohere into a
    // line rather than dissolving into the field around them.
    float size = 0.95 + band * 0.25 + aWall.y * 0.2 + aWall.z * 0.35 + touch * 0.6;
    // Perspective, mostly flattened — see SIZE_FLATTEN for why. Clamped at both
    // ends: a floor stops the far rooms sparkling below a pixel, a ceiling stops
    // the gate's near wall blooming into blobs.
    float perspective = mix(140.0 / depth, uFlatSize, uFlatten);
    // Scaled by frame height, because gl_PointSize is in PIXELS and a mote
    // should be a constant fraction of the frame rather than a constant pixel
    // count. Without this a 5px mote is 0.55% of a 900px-tall window and 1.3% of
    // a 390px one, so the walls silently thicken as the frame gets shorter —
    // wall-checks measured a peripheral lift of 13 on a phone in landscape,
    // against 0.5 on a desktop, which is a grey wash rather than a wall.
    gl_PointSize = max(clamp(size * perspective, 2.0, 9.0) * uSizeScale, 1.2);

    // The horizon is the line the room is read by, so it carries well over
    // twice the field's value rather than the marginal lift it had first.
    float a = 0.19 + band * 0.24 + aWall.y * 0.05 + aWall.z * 0.16;
    a *= near * edge * nearFade * far;
    a *= uReveal * (1.0 - uDim * 0.85);
    // Present when the artifact is crisp and the frame around it is empty;
    // out of the way through the dissolve, when the cloud fills the frame on
    // its own and a second layer would only muddy it.
    a *= mix(0.55, 1.0, uResolve);
    a *= uGain * (0.8 + aSeed * 0.4);
    // The touched motes are the reward for sweeping the void, so their lift is
    // added rather than scaled — it survives the vignette's own falloff.
    a += touch * 0.1 * near * edge * nearFade * uReveal * uGain;

    vAlpha = a;
    // Warmed toward accent, which is what separates a drawn line from a grey
    // speck: at 0.12 the rings were the same slate as the haze and read as
    // stars rather than as architecture.
    vWarm = clamp(aWall.z * 0.55 + touch * 0.8 + band * 0.3, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3 uAccent;
  uniform vec3 uSlate;

  varying float vAlpha;
  varying float vWarm;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.12, d);

    vec3 col = mix(uSlate, uAccent, vWarm);
    gl_FragColor = vec4(col, soft * vAlpha);
  }
`;

/**
 * Perspective, mostly flattened. Full perspective made the near wall of a
 * small room ten times the size of a late room's far wall, so the walls read
 * as a few blobs close by and nothing at distance — the opposite of "the
 * rooms got bigger". Mostly-flat sizes keep every room's wall the same grain.
 */
const SIZE_FLATTEN = 0.75;
const FLAT_SIZE = 4.6;

/** Soft edge of the clear ellipse, as a fraction of its radius. */
const CLEAR_SOFT = 0.45;
/** Floor the horizon ring keeps across the clear ellipse. */
const RING_FLOOR = 0.1;

interface LabWallsProps {
  /** Unsmoothed journey position the camera is actually at. */
  walkTRef: { current: number };
  resolveRef: { current: number };
  dimRef: { current: number };
  motionScaleRef: { current: number };
  /** Share of motes drawn, 0..1 — mobile draws fewer. */
  density?: number;
}

export function LabWalls({
  walkTRef,
  resolveRef,
  dimRef,
  motionScaleRef,
  density = 1,
}: LabWallsProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { geometry, total } = useMemo(() => {
    const w = buildWalls();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(w.position, 3));
    geo.setAttribute("aRoom", new THREE.BufferAttribute(w.room, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(w.seed, 1));
    geo.setAttribute("aWall", new THREE.BufferAttribute(w.wall, 3));
    geo.setAttribute("aDrift", new THREE.BufferAttribute(w.drift, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 5, -250), 380);
    return { geometry: geo, total: w.count };
  }, []);

  const uniforms = useMemo(
    () => ({
      uStoryT: { value: 0 },
      uBeatT: { value: [...BEAT_T] },
      uTime: { value: 0 },
      uDim: { value: 0 },
      uReveal: { value: 0 },
      uMotionScale: { value: 1 },
      uResolve: { value: 1 },
      uGain: { value: 1 },
      uClear: { value: new THREE.Vector2(CLEAR_RADIUS, CLEAR_RADIUS) },
      uClearY: { value: 0 },
      uSoft: { value: CLEAR_SOFT },
      uRingFloor: { value: RING_FLOOR },
      uFlatten: { value: SIZE_FLATTEN },
      uFlatSize: { value: FLAT_SIZE },
      uSizeScale: { value: 1 },
      uCamPos: { value: new THREE.Vector3() },
      uRay: { value: new THREE.Vector3(0, 0, -1) },
      uRayPrev: { value: new THREE.Vector3(0, 0, -1) },
      uCursor: { value: 0 },
      uCursorEnergy: { value: 0 },
      // Wider than the cloud's cone: the walls are tens of units out.
      uConeBase: { value: 0.6 },
      uConeSlope: { value: 0.3 },
      uAccent: { value: new THREE.Color("#c8ff4d") },
      uSlate: { value: new THREE.Color("#4a5468") },
    }),
    [],
  );

  const scratch = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms;
    u.uTime!.value = state.clock.elapsedTime;

    // Like the track, the walls stay out of COLD START and arrive with the
    // journey. Skipped entirely while invisible.
    const target = entranceSignal.authority > 0 ? 0 : 1;
    u.uReveal!.value += (target - (u.uReveal!.value as number)) * (1 - Math.pow(0.55, delta));
    if ((u.uReveal!.value as number) < 0.004) {
      if (geometry.drawRange.count !== 0) geometry.setDrawRange(0, 0);
      return;
    }

    u.uStoryT!.value = walkTRef.current;
    u.uResolve!.value = resolveRef.current;
    u.uDim!.value += (dimRef.current - (u.uDim!.value as number)) * 0.1;
    u.uMotionScale!.value = motionScaleRef.current;

    // The clear ellipse tracks the artifact's footprint on this viewport:
    // the framing pull shrinks it, the lift moves it up.
    const width = Math.max(state.size.width, 1);
    const height = Math.max(state.size.height, 1);
    const framing = framingFor(width, height);
    const clear = (CLEAR_RADIUS / framing.pull) * 1.06;
    const aspect = Math.max(width / height, 0.2);
    (u.uClear!.value as THREE.Vector2).set(clear / aspect, clear);
    u.uClearY!.value = framing.liftNdc;
    u.uSizeScale!.value = Math.min(Math.max(height / 900, 0.45), 1.5);

    const camera = state.camera;
    (u.uCamPos!.value as THREE.Vector3).copy(camera.position);
    (u.uRayPrev!.value as THREE.Vector3).copy(u.uRay!.value as THREE.Vector3);
    scratch
      .set(cursorSignal.x, cursorSignal.y, 0.5)
      .unproject(camera)
      .sub(camera.position)
      .normalize();
    (u.uRay!.value as THREE.Vector3).copy(scratch);
    u.uCursor!.value = cursorSignal.presence;
    u.uCursorEnergy!.value = cursorSignal.energy;

    const drawn = Math.max(1, Math.floor(total * Math.min(Math.max(density, 0), 1)));
    if (geometry.drawRange.count !== drawn) geometry.setDrawRange(0, drawn);
  });

  return (
    <points geometry={geometry} frustumCulled={false} raycast={noRaycast}>
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
