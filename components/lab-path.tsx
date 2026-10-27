"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  BEATS,
  BEAT_COUNT,
  BEAT_T,
  beatT,
  trackMixAt,
  trackNode,
  upcomingBeat,
} from "@/lib/story";
import { entranceSignal } from "@/lib/entrance";
import { useStoryStore } from "@/lib/story-store";
import { sound } from "@/lib/sound";
import { resetTrailSignal, setTrailHot, setTrailVector } from "@/lib/trail-signal";

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
/** Points can't be hovered; the invisible tube around the curve is the hit area. */
function noRaycast() {}

/** Radius of that tube, world units — generous, the track is a hairline. */
const HIT_RADIUS = 1.85;

/** How far ahead along the curve (0..1) to sample the track's screen heading. */
const HEADING_LOOKAHEAD = 0.03;

/** Below this screen-space length (NDC) the heading is noise; keep the last. */
const HEADING_MIN_STRENGTH = 0.012;

/** Click-to-travel: base duration, plus up to this much more for far jumps. */
const TRAVEL_MS = 1200;
const TRAVEL_MS_EXTRA = 1100;
const TRAVEL_FULL_DIST = 0.14;

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
  uniform float uHover;   // 0..1 — pointer is over the track

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
    float size = mix(0.66, 1.35, aNode) + near * 0.35 + uHover * ahead * local * 0.2;
    // Floored so the far stretch doesn't drop below a pixel and start to
    // sparkle; the fog below is what takes distance out, not point size.
    gl_PointSize = max(size * (140.0 / -mv.z), 0.8);

    // The way back is quieter than the way forward, but it is still there —
    // the rooms you have walked through are the point of the piece.
    float a = mix(0.32, 0.75, ahead) + hot * 0.66 + flow * 0.26 + uHover * ahead * 0.18;
    a = min(a, 0.95);
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

/** Screen heading of the curve between two world points, clipped to the near plane. */
function screenHeading(
  a: THREE.Vector3,
  b: THREE.Vector3,
  camera: THREE.Camera & { near?: number },
  viewA: THREE.Vector3,
  viewB: THREE.Vector3,
  ndcA: THREE.Vector3,
  ndcB: THREE.Vector3,
): { angle: number; strength: number } | null {
  viewA.copy(a).applyMatrix4(camera.matrixWorldInverse);
  viewB.copy(b).applyMatrix4(camera.matrixWorldInverse);
  const nearZ = -(camera.near ?? 0.1) * 1.02;
  const aBehind = viewA.z > nearZ;
  const bBehind = viewB.z > nearZ;
  if (aBehind && bBehind) return null;
  if (aBehind || bBehind) {
    // One end is behind the camera — clip it to the near plane so the
    // projection doesn't flip, then project both by hand.
    const f = (nearZ - viewA.z) / (viewB.z - viewA.z);
    const x = viewA.x + (viewB.x - viewA.x) * f;
    const y = viewA.y + (viewB.y - viewA.y) * f;
    if (aBehind) viewA.set(x, y, nearZ);
    else viewB.set(x, y, nearZ);
    viewA.applyMatrix4(camera.projectionMatrix);
    viewB.applyMatrix4(camera.projectionMatrix);
    ndcA.copy(viewA);
    ndcB.copy(viewB);
  } else {
    ndcA.copy(a).project(camera);
    ndcB.copy(b).project(camera);
  }
  const dx = ndcB.x - ndcA.x;
  const dy = -(ndcB.y - ndcA.y);
  const strength = Math.hypot(dx, dy);
  if (strength < 1e-5) return null;
  return { angle: (Math.atan2(dy, dx) * 180) / Math.PI, strength };
}

/** Curve parameter (0..1) nearest a world point: coarse scan, then refine. */
function nearestU(
  curve: THREE.CatmullRomCurve3,
  point: THREE.Vector3,
  scratch: THREE.Vector3,
  steps = 160,
): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    curve.getPointAt(u, scratch);
    const d = scratch.distanceToSquared(point);
    if (d < bestD) {
      bestD = d;
      best = u;
    }
  }
  const step = 1 / steps;
  const lo = Math.max(0, best - step);
  const hi = Math.min(1, best + step);
  for (let i = 0; i <= 12; i++) {
    const u = lo + ((hi - lo) * i) / 12;
    curve.getPointAt(u, scratch);
    const d = scratch.distanceToSquared(point);
    if (d < bestD) {
      bestD = d;
      best = u;
    }
  }
  return best;
}

export function LabPath({ walkTRef, dimRef, motionScaleRef }: LabPathProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  // Hover: whether the pointer is on the track, where along it, and the
  // arrow the cursor should draw.
  const hovering = useRef(0);
  const hoverU = useRef(0.5);
  const vector = useRef<{ angle: number; depth: "in" | "out"; dest: number; live: boolean }>({
    angle: 0,
    depth: "in",
    dest: -1,
    live: false,
  });
  const onJourney = usePathname() === "/";

  useEffect(() => () => resetTrailSignal(), []);

  const { geometry, hitGeometry, curve } = useMemo(() => {
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
    return {
      geometry: geo,
      hitGeometry: new THREE.TubeGeometry(curve, 180, HIT_RADIUS, 6, false),
      curve,
    };
  }, []);

  const uniforms = useMemo(
    () => ({
      uStoryT: { value: 0 },
      uTime: { value: 0 },
      uDim: { value: 0 },
      uReveal: { value: 0 },
      uFlow: { value: 1 },
      uHover: { value: 0 },
      uAccent: { value: new THREE.Color("#c8ff4d") },
      uSlate: { value: new THREE.Color("#4a5468") },
    }),
    [],
  );

  const scratch = useMemo(
    () => ({
      viewA: new THREE.Vector3(),
      viewB: new THREE.Vector3(),
      ndcA: new THREE.Vector3(),
      ndcB: new THREE.Vector3(),
      wa: new THREE.Vector3(),
      wb: new THREE.Vector3(),
    }),
    [],
  );

  // The track is only an instrument on the journey itself, once the
  // entrance has let go and no content window owns the frame.
  const interactive = () =>
    onJourney &&
    entranceSignal.authority === 0 &&
    document.documentElement.dataset.inScene !== "1";

  const release = () => {
    vector.current.live = false;
    vector.current.dest = -1;
    hovering.current = 0;
    resetTrailSignal();
  };

  /**
   * Aim the cursor's arrow along the track at the hovered point, toward the
   * chapter ahead. `ease` 0 snaps; otherwise the angle turns the short way
   * round at that rate, so it doesn't jitter as the camera moves.
   */
  const aim = (camera: THREE.Camera, ease: number): boolean => {
    const dest = upcomingBeat(walkTRef.current);
    if (dest === null) return false;
    const u0 = THREE.MathUtils.clamp(hoverU.current, 0, 1);
    let u1 = u0 + HEADING_LOOKAHEAD;
    if (u1 > 1) {
      u1 = u0;
      curve.getPointAt(Math.max(0, u0 - HEADING_LOOKAHEAD), scratch.wa);
      curve.getPointAt(u1, scratch.wb);
    } else {
      curve.getPointAt(u0, scratch.wa);
      curve.getPointAt(u1, scratch.wb);
    }
    const heading = screenHeading(
      scratch.wa,
      scratch.wb,
      camera,
      scratch.viewA,
      scratch.viewB,
      scratch.ndcA,
      scratch.ndcB,
    );
    const v = vector.current;
    const fresh = !v.live || v.dest !== dest;
    if (heading && (fresh || heading.strength >= HEADING_MIN_STRENGTH)) {
      v.angle = fresh
        ? heading.angle
        : v.angle + (((((heading.angle - v.angle) % 360) + 540) % 360) - 180) * ease;
    }
    v.depth = "in";
    v.dest = dest;
    v.live = true;
    const beat = BEATS[dest];
    setTrailVector({
      angle: v.angle,
      dir: "forward",
      depth: v.depth,
      dest,
      destCode: beat?.code ?? "",
      destLabel: beat?.label ?? "",
    });
    return true;
  };

  const track = (point: THREE.Vector3, camera: THREE.Camera, announce: boolean) => {
    if (!interactive()) {
      if (hovering.current) release();
      return;
    }
    hoverU.current = nearestU(curve, point, scratch.wa);
    if (!aim(camera, 0)) {
      if (hovering.current) release();
      return;
    }
    if (announce || !hovering.current) {
      hovering.current = 1;
      setTrailHot(true);
    }
  };

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

    // Keep the arrow true as the camera moves under a still pointer.
    const live = interactive();
    if (!live && hovering.current > 0) release();
    if (live && hovering.current > 0 && !aim(state.camera, 1 - Math.pow(0.0008, delta))) release();
    const hoverTarget = live && hovering.current > 0 ? 1 : 0;
    u.uHover!.value += (hoverTarget - (u.uHover!.value as number)) * (1 - Math.pow(0.001, delta));
  });

  return (
    <group>
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
      {/* Invisible hit tube. Click travels to the chapter the arrow names. */}
      <mesh
        geometry={hitGeometry}
        frustumCulled={false}
        onPointerOver={(e) => {
          if (e.pointerType === "touch") return;
          e.stopPropagation();
          track(e.point, e.camera, true);
        }}
        onPointerMove={(e) => {
          if (e.pointerType === "touch") return;
          track(e.point, e.camera, true);
        }}
        onPointerOut={() => {
          release();
        }}
        onPointerDown={(e) => {
          if (e.pointerType === "touch") return;
          if (interactive()) e.stopPropagation();
        }}
        onClick={(e) => {
          if (!interactive()) return;
          e.stopPropagation();
          track(e.point, e.camera, true);
          const dest = vector.current.live ? vector.current.dest : -1;
          if (dest < 0) return;
          const from = useStoryStore.getState().storyT;
          sound.tick();
          useStoryStore.getState().goToBeat(dest, {
            duration:
              TRAVEL_MS +
              TRAVEL_MS_EXTRA * Math.min(1, Math.abs(beatT(dest) - from) / TRAVEL_FULL_DIST),
          });
        }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
