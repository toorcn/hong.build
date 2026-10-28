"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { BEAT_TARGET_COUNT, FRAGMENT_TOTAL } from "@/lib/generated/fragments-meta";
import { BEATS, BEAT_T, ROOMS, beatPose, nearestBeat, resolveAmount } from "@/lib/story";
import type { FragmentData } from "@/lib/fragments";
import { entranceSignal, SWEEP_Y_LEAD } from "@/lib/entrance";
import { cursorSignal } from "@/lib/cursor-signal";
import { clearCloudHot, cloudSignal, setCloudHot } from "@/lib/cloud-signal";
import { resetTrailSignal } from "@/lib/trail-signal";
import type { HandoffPreview } from "@/lib/panel-handoff";

/** What the cursor's preview card shows for each chapter that opens a route. */
const PREVIEWS: (HandoffPreview | null)[] = BEATS.map((b) =>
  b.route && b.routeTitle && b.routePreview
    ? {
        route: b.route,
        code: b.code,
        label: b.label,
        title: b.routeTitle,
        excerpt: b.routePreview,
      }
    : null,
);

/** Resolve at which the hero artifact starts reading as the cloud's hot zone. */
const HOVER_RESOLVE = 0.58;
/** Resolve at which hovering it offers the chapter's route. */
const PREVIEW_RESOLVE = 0.8;

/** Twice the signed area of triangle abc; > 0 when c is left of ab. */
function cross2(a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

/** Monotone-chain convex hull, counter-clockwise. */
function convexHull(points: THREE.Vector2[]): THREE.Vector2[] {
  if (points.length <= 3) return points;
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const lower: THREE.Vector2[] = [];
  const upper: THREE.Vector2[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross2(lower.at(-2)!, lower.at(-1)!, p) <= 0) lower.pop();
    lower.push(p);
  }
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]!;
    while (upper.length >= 2 && cross2(upper.at(-2)!, upper.at(-1)!, p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function insideHull(p: THREE.Vector2, hull: THREE.Vector2[]): boolean {
  if (hull.length < 3) return false;
  for (let i = 0; i < hull.length; i++) {
    if (cross2(hull[i]!, hull[(i + 1) % hull.length]!, p) < -1e-4) return false;
  }
  return true;
}

/**
 * A chapter artifact's silhouette as a flat footprint: the plane it faces the
 * hero camera on, and the convex hull of its fragments in that plane. The
 * pointer hits the artifact when its ray lands inside the hull — points have
 * no area to raycast, and a bounding box would light up the empty corners.
 */
interface Footprint {
  plane: THREE.Plane;
  origin: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
  hull: THREE.Vector2[];
}

/**
 * The walk shader (v3).
 *
 * Each fragment has one home chapter, a world-space target inside that
 * chapter's artifact, and a world-space dust position in its room's shell.
 * uStoryT drives everything:
 *   - future artifacts gather from dust as the camera nears their room
 *   - the hero artifact holds fully resolved at its waypoint
 *   - past artifacts stay formed but dim, breathe, and relax toward the
 *     walls — history becomes the rooms you have walked through
 *
 * There is no morph: a fragment never becomes a different artifact.
 * Entrance/panel/reduced-motion states pin per-beat resolve through
 * uResolveOverride (-1 = let uStoryT decide).
 *
 * Scroll is not the only input. The pointer displaces fragments it passes
 * over — see `rayInfluence` below and lib/cursor-signal.ts for why influence
 * is measured against the pointer's ray rather than a point in space.
 */

const LAST = BEAT_TARGET_COUNT - 1;

const VERT = /* glsl */ `
  attribute vec3 aDust;
  attribute float aSeed;
  attribute float aHome;

  uniform float uStoryT;
  uniform float uBeatT[${BEAT_TARGET_COUNT}];
  uniform float uResolveOverride[${BEAT_TARGET_COUNT}];
  uniform vec3 uRooms[${BEAT_TARGET_COUNT}];
  uniform float uTime;
  uniform float uDim;
  uniform float uMotionScale;
  uniform float uBirth;         // 0 = unborn at the room's core, 1 = in place
  uniform float uStaggerAxis;   // 0 = seed stagger, 1 = positional sweep
  uniform float uStaggerSpread; // width of the resolve stagger; 0 = off
  uniform vec2 uSpan;           // half-extent of the beat-0 mark on x and y
  uniform float uYLead;         // how much the upper line leads the sweep

  uniform vec3 uCamPos;         // camera world position
  uniform vec3 uRay;            // world ray through the pointer, normalised
  uniform vec3 uRayPrev;        // last frame's ray — the two form the wake
  uniform float uCursor;        // pointer presence, 0..1
  uniform float uCursorEnergy;  // pointer speed, 0..1
  uniform float uConeBase;      // influence radius at the camera
  uniform float uConeSlope;     // growth per unit of depth — constant on screen

  varying float vResolve;
  varying float vSeed;
  varying float vBirth;
  varying float vGhost;
  varying float vFade;
  varying float vTouch;

  /**
   * Influence of one pointer ray on a point, plus the displacement it wants.
   *
   * Distance is measured PERPENDICULAR TO THE RAY, not to a point in space, so
   * the reach is a cone: whatever is under the cursor on screen reacts at any
   * depth, and the radius grows with depth so it stays a constant size in the
   * frame. A point probe would only ever stir one plane and leave the parked
   * background — most of what's on screen — dead.
   *
   * The push comes back scaled by the local radius, so a far fragment moves
   * further in world units and the same amount on screen.
   */
  float rayInfluence(vec3 p, vec3 dir, out vec3 push) {
    push = vec3(0.0);
    vec3 rel = p - uCamPos;
    float along = dot(rel, dir);
    if (along <= 0.1) return 0.0;           // behind the camera

    vec3 perp = rel - dir * along;
    float d = length(perp);
    float radius = uConeBase + along * uConeSlope;
    float infl = 1.0 - smoothstep(radius * 0.12, radius, d);
    if (infl <= 0.0) return 0.0;

    vec3 outward = d > 1e-4 ? perp / d : vec3(1.0, 0.0, 0.0);
    // Radial parting plus a swirl about the ray, so the wake curls closed
    // behind the cursor instead of just bulging away from it.
    vec3 dirv = outward + cross(dir, outward) * 0.55;
    // Distant rooms are damped: proportional on screen still reads as the
    // whole horizon sloshing if it's given full authority.
    float depthDamp = mix(1.0, 0.45, clamp(along / 160.0, 0.0, 1.0));
    push = dirv * radius * depthDamp;
    return infl * infl;                     // squared — a tighter core
  }

  void main() {
    int home = int(aHome + 0.5);
    float bt = uBeatT[home];

    // Gathering: a future artifact assembles from its room's dust as the
    // camera walks the second half of the corridor toward it. Beat 0 is
    // resolved from the start of the journey.
    float prev = home == 0 ? -1.0 : uBeatT[home - 1];
    float gatherStart = home == 0 ? -1.0 : (prev + bt) * 0.5;
    float autoR = smoothstep(gatherStart, bt, uStoryT);

    float ovr = uResolveOverride[home];
    float base = ovr >= 0.0 ? ovr : autoR;

    // Entrance sweep: during the snap each fragment of the gate gets a lead
    // from its position in the mark, so the shape sets left-to-right with
    // the upper line ahead — type being set rather than a magic snap. On
    // the journey uStaggerSpread is 0 and resolve is exactly the base value.
    float xn = clamp(position.x / max(uSpan.x, 0.001) * 0.5 + 0.5, 0.0, 1.0);
    float yn = clamp(position.y / max(uSpan.y, 0.001) * 0.5 + 0.5, 0.0, 1.0);
    float sweep = clamp(xn + (1.0 - yn) * uYLead, 0.0, 1.0);
    float lead = mix(aSeed, sweep, uStaggerAxis) * uStaggerSpread;
    float r = uStaggerSpread > 0.0
      ? smoothstep(lead, lead + 1.0 - uStaggerSpread, base)
      : base;

    // Ghost: once the walk moves on, the artifact holds its shape but
    // relaxes toward the walls. Fully ghosted by the corridor's midpoint.
    float next = home == ${LAST} ? 2.0 : uBeatT[home + 1];
    float ghostEnd = (bt + next) * 0.5;
    float ghost = ovr >= 0.0 ? 0.0 : smoothstep(bt, ghostEnd, uStoryT);

    vec3 pos = mix(aDust, position, r);
    pos = mix(pos, aDust, ghost * 0.35);

    // Idle drift: dust wanders, hero artifacts hold, ghosts breathe.
    float drift = (0.25 + max(1.0 - r, 0.0) * 0.75 + ghost * 0.4) * uMotionScale;
    float t = uTime * 0.4 + aSeed * 6.2831;
    pos.x += sin(t + aSeed * 17.0) * 0.05 * drift;
    pos.y += cos(t * 1.3 + aSeed * 11.0) * 0.05 * drift;
    pos.z += sin(t * 0.7 + aSeed * 23.0) * 0.05 * drift;

    // Coherent sway, per room. Per-fragment drift can't be raised much before
    // a resolved silhouette goes soft, but moving the whole artifact together
    // costs no legibility at all — so the crisp shapes still breathe.
    float sway = uMotionScale * (0.55 + 0.45 * r);
    pos.x += sin(uTime * 0.23 + float(home) * 1.7) * 0.07 * sway;
    pos.y += sin(uTime * 0.19 + float(home) * 2.3) * 0.05 * sway;

    // The cursor. Two rays — this frame's and last frame's — so a flick throws
    // a wake through the dust rather than dragging a single round hole.
    //
    // pos is compared against world-space uniforms directly: the points mesh
    // carries no transform, so its model space IS world space. Give the points
    // object a position or scale and this needs a modelMatrix multiply.
    vec3 pushA;
    vec3 pushB;
    float ia = rayInfluence(pos, uRay, pushA);
    float ib = rayInfluence(pos, uRayPrev, pushB);
    float infl = max(ia, ib);
    vec3 push = ia >= ib ? pushA : pushB;

    // Dust yields; a resolved artifact barely moves. The whole piece rests on
    // those silhouettes reading at their waypoint, so the cursor is not allowed
    // to smear one — it ruffles the edges and rearranges the room around it.
    float give = mix(1.0, 0.16, r);
    float touch = infl * uCursor;
    pos += push * touch * give * uMotionScale * (0.09 + uCursorEnergy * 0.24);

    // Birth burst from each room's core — the world materialises in depth.
    float birth = smoothstep(aSeed * 0.45, aSeed * 0.45 + 0.55, uBirth);
    pos = mix(uRooms[home] * 0.06, pos, birth);

    // Fragments swell as they resolve; ghosts recede a little. Touched ones
    // swell too — the cursor reads as a light passing through the dust.
    float scale = mix(0.8, 1.6, r * (1.0 - ghost * 0.4)) * (1.0 - uDim * 0.3) * birth;
    // Damped on resolved fragments for the same reason the displacement is:
    // at full strength the swell turns a crisp silhouette lumpy where the
    // cursor crosses it. Dust gets the full sparkle.
    scale *= 1.0 + touch * mix(0.7, 0.3, r);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = scale * (140.0 / -mv.z);

    vResolve = r * (1.0 - ghost * 0.85);
    vGhost = ghost;
    vSeed = aSeed;
    vBirth = birth;
    vTouch = touch;
    // Distant rooms fall off so the walk reads as depth, not a wall of dust.
    vFade = exp(-max(-mv.z - 60.0, 0.0) * 0.012);
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
  varying float vGhost;
  varying float vFade;
  varying float vTouch;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.28, d);

    vec3 col = mix(uSlate, uAccent, vResolve);
    col *= 0.85 + vSeed * 0.3;
    col *= 1.0 - uDim * 0.55;
    // Under the cursor, dust warms toward accent — the pointer carries a
    // light, so hovering over unresolved noise still tells you it's there.
    col = mix(col, uAccent, vTouch * 0.75);

    float alpha = soft * mix(0.45, 1.0, vResolve) * (1.0 - vGhost * 0.45);
    alpha *= (1.0 - uDim * 0.5) * vBirth * vFade;
    alpha += soft * vTouch * 0.3 * vBirth * vFade;
    gl_FragColor = vec4(col, alpha);
  }
`;

interface LabCloudProps {
  data: FragmentData;
  /** Continuous journey position 0..1, updated per frame. */
  storyTRef: { current: number };
  /** Per-beat resolve pins; -1 = let uStoryT decide. Updated per frame. */
  overrideRef: { current: number[] };
  dimRef: { current: number };
  motionScaleRef: { current: number };
  maxCount?: number;
}

export function LabCloud({
  data,
  storyTRef,
  overrideRef,
  dimRef,
  motionScaleRef,
  maxCount = FRAGMENT_TOTAL,
}: LabCloudProps) {
  const pathname = usePathname();
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  // Which chapter the pointer can hit this frame, and what it would open.
  const hover = useRef<{ enabled: boolean; home: number; preview: HandoffPreview | null }>({
    enabled: false,
    home: 0,
    preview: null,
  });

  const { geometry, footprints, limit, span } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    // The built-in `position` attribute doubles as the fragment's resolved
    // target — the shader reads it directly.
    geo.setAttribute("position", new THREE.BufferAttribute(data.targets, 3));
    geo.setAttribute("aDust", new THREE.BufferAttribute(data.dust, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(data.seeds, 1));
    geo.setAttribute("aHome", new THREE.BufferAttribute(data.homes, 1));
    const drawn = Math.min(maxCount, data.count);
    geo.setDrawRange(0, drawn);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -170), 400);

    // Half-extent of the beat-0 mark, used to normalise the entrance sweep.
    // Beat 0's room sits at the origin with its camera on +Z, so world x is
    // screen right and world y is screen up — the sweep axes are the mark's.
    let spanX = 0.001;
    let spanY = 0.001;
    for (let i = 0; i < data.count; i++) {
      if (data.homes[i] !== 0) continue;
      spanX = Math.max(spanX, Math.abs(data.targets[i * 3] ?? 0));
      spanY = Math.max(spanY, Math.abs(data.targets[i * 3 + 1] ?? 0));
    }

    const footprints: Footprint[] = BEATS.map((b, k) => {
      const room = ROOMS[k]!;
      const origin = new THREE.Vector3(...room.center);
      const pose = beatPose(b);
      const normal = new THREE.Vector3(pose.x, pose.y, pose.z).normalize();
      const right = new THREE.Vector3(0, 1, 0).cross(normal).normalize();
      const up = normal.clone().cross(right).normalize();
      const flat: THREE.Vector2[] = [];
      const p = new THREE.Vector3();
      const d = new THREE.Vector3();
      for (let i = 0; i < drawn; i++) {
        if (data.homes[i] !== k) continue;
        p.fromBufferAttribute(geo.getAttribute("position") as THREE.BufferAttribute, i);
        d.copy(p).sub(origin);
        flat.push(new THREE.Vector2(d.dot(right), d.dot(up)));
      }
      const hull = convexHull(flat);
      // A touch of slack so the edge motes still count as on the artifact.
      const centroid = hull
        .reduce((acc, v) => acc.add(v), new THREE.Vector2())
        .multiplyScalar(1 / Math.max(1, hull.length));
      for (const v of hull) v.sub(centroid).multiplyScalar(1.035).add(centroid);
      return {
        plane: new THREE.Plane().setFromNormalAndCoplanarPoint(normal, origin),
        origin,
        right,
        up,
        hull,
      };
    });

    return { geometry: geo, footprints, limit: drawn, span: new THREE.Vector2(spanX, spanY) };
  }, [data, maxCount]);

  const uniforms = useMemo(
    () => ({
      uStoryT: { value: 0 },
      uBeatT: { value: [...BEAT_T] },
      uResolveOverride: { value: new Array(BEAT_TARGET_COUNT).fill(-1) },
      uRooms: { value: ROOMS.map((r) => new THREE.Vector3(...r.center)) },
      uTime: { value: 0 },
      uDim: { value: 0 },
      uMotionScale: { value: 1 },
      uBirth: { value: 1 },
      uStaggerAxis: { value: 0 },
      uStaggerSpread: { value: 0 },
      uSpan: { value: new THREE.Vector2(1, 1) },
      uYLead: { value: SWEEP_Y_LEAD },
      uCamPos: { value: new THREE.Vector3() },
      uRay: { value: new THREE.Vector3(0, 0, -1) },
      uRayPrev: { value: new THREE.Vector3(0, 0, -1) },
      uCursor: { value: 0 },
      uCursorEnergy: { value: 0 },
      // Reach at the camera, and growth per unit of depth. The slope is what
      // keeps the influence a constant size on screen: at the ~12-unit
      // waypoint distance it works out to a radius of about 3 world units,
      // roughly a quarter of the frame.
      uConeBase: { value: 0.4 },
      uConeSlope: { value: 0.22 },
      uAccent: { value: new THREE.Color("#c8ff4d") },
      uSlate: { value: new THREE.Color("#4a5468") },
    }),
    [],
  );

  /** Scratch for deriving the pointer ray; reused so the frame loop is allocation-free. */
  const scratch = useMemo(() => new THREE.Vector3(), []);

  /**
   * Raycast against the hero chapter's footprint instead of the points.
   * Reports a hit at the near plane so the cloud wins over anything behind it.
   */
  const raycast = useMemo(() => {
    const hit = new THREE.Vector3();
    const local = new THREE.Vector3();
    const flat = new THREE.Vector2();
    return function (this: THREE.Object3D, raycaster: THREE.Raycaster, hits: THREE.Intersection[]) {
      const h = hover.current;
      if (!h.enabled) return;
      const fp = footprints[h.home];
      if (!fp || !raycaster.ray.intersectPlane(fp.plane, hit)) return;
      local.copy(hit).sub(fp.origin);
      flat.set(local.dot(fp.right), local.dot(fp.up));
      if (!insideHull(flat, fp.hull)) return;
      const distance = raycaster.ray.origin.distanceTo(hit);
      if (distance < raycaster.near || distance > raycaster.far) return;
      hits.push({ distance: raycaster.near, point: hit.clone(), object: this });
    };
  }, [footprints]);

  useEffect(() => () => clearCloudHot(), []);

  // The cloud sits over the track, so it claims the pointer from it.
  const onHover = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    e.stopPropagation();
    resetTrailSignal();
    setCloudHot(true, hover.current.preview);
  };

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

    const ovr = u.uResolveOverride!.value as number[];

    // While the entrance has authority its values are authored frame by
    // frame, so they're written straight through — smoothing here on top of
    // the rig's own damping would blunt the snap into a fade. The gate
    // (home 0) sweeps; every other room waits as dust.
    if (entranceSignal.authority > 0) {
      hover.current.enabled = false;
      if (cloudSignal.hot) clearCloudHot();
      u.uStoryT!.value = 0;
      ovr[0] = entranceSignal.resolve;
      for (let k = 1; k < BEAT_TARGET_COUNT; k++) ovr[k] = 0;
      u.uBirth!.value = entranceSignal.birth;
      u.uStaggerAxis!.value = 1;
      u.uStaggerSpread!.value = entranceSignal.staggerSpread;
      // COLD START is authored frame by frame; the cursor gets no say in it.
      u.uCursor!.value = 0;
      u.uCursorEnergy!.value = 0;
      geometry.setDrawRange(0, Math.max(0, Math.floor(entranceSignal.density * limit)));
      return;
    }

    // The pointer ray, in world space. Last frame's ray is kept as the other
    // end of the wake, so a fast flick displaces the whole path it swept
    // rather than only where it happens to have landed this frame.
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

    // Only the resolved hero artifact on the journey is hoverable, and only
    // once it's legible enough to be worth opening.
    const t = storyTRef.current;
    const h = hover.current;
    const resolved = resolveAmount(t);
    h.home = nearestBeat(t);
    h.enabled = pathname === "/" && resolved >= HOVER_RESOLVE;
    h.preview = h.enabled && resolved > PREVIEW_RESOLVE ? (PREVIEWS[h.home] ?? null) : null;
    if (!h.enabled && cloudSignal.hot) clearCloudHot();
    else if (cloudSignal.hot && cloudSignal.preview !== h.preview) setCloudHot(true, h.preview);

    // Journey: smooth toward the live story position, sweep off.
    u.uStoryT!.value += (storyTRef.current - (u.uStoryT!.value as number)) * 0.16;
    for (let k = 0; k < BEAT_TARGET_COUNT; k++) ovr[k] = overrideRef.current[k] ?? -1;
    u.uBirth!.value = 1;
    u.uStaggerAxis!.value = 0;
    u.uStaggerSpread!.value = 0;
    if (geometry.drawRange.count !== limit) geometry.setDrawRange(0, limit);
  });

  return (
    <points
      geometry={geometry}
      frustumCulled={false}
      raycast={raycast}
      onPointerOver={onHover}
      onPointerMove={onHover}
      onPointerOut={clearCloudHot}
      onPointerDown={onHover}
      onClick={onHover}
    >
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
