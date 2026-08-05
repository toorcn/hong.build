/**
 * The narrative spine — single source of truth for the scroll journey.
 *
 * storyT runs 0..1 across the whole journey. Beats are evenly spaced
 * stops along it. Each beat owns an authored camera pose and a silhouette
 * the fragment cloud resolves into. Scroll moves storyT along the rail;
 * drag orbits locally around the current pose and springs back on release.
 */

export const BEAT_COUNT = 6;

export interface Beat {
  id: number;
  /** Machine label for chrome. */
  code: string;
  /** Display label. */
  label: string;
  /** The silhouette id in silhouettes.ts this beat resolves to. */
  silhouette: number;
  /** Authored camera azimuth (deg), elevation (deg), distance. */
  azimuthDeg: number;
  elevationDeg: number;
  distance: number;
  /** Short in-world caption line. */
  caption: string;
  /** Optional route for the "read more" detail layer. */
  route?: string;
  /** Route label. */
  routeLabel?: string;
}

export const BEATS: readonly Beat[] = [
  {
    id: 0,
    code: "00",
    label: "ORIGIN",
    silhouette: 0, // HONG BING
    azimuthDeg: 0,
    elevationDeg: 10,
    distance: 11,
    caption: "AI engineer & builder, Kuala Lumpur.",
  },
  {
    id: 1,
    code: "01",
    label: "WORK",
    silhouette: 1, // window frame
    azimuthDeg: 68,
    elevationDeg: 14,
    distance: 12,
    caption: "Three things I built that taught me the most.",
    route: "/work",
    routeLabel: "open case studies",
  },
  {
    id: 2,
    code: "02",
    label: "PROOF",
    silhouette: 3, // waveform-as-constellation for now; re-authored below
    azimuthDeg: 142,
    elevationDeg: 8,
    distance: 12,
    caption: "Nineteen hackathons. Speed, learned the hard way.",
    route: "/notes",
    routeLabel: "the run log",
  },
  {
    id: 3,
    code: "03",
    label: "PROCESS",
    silhouette: 2, // recursion loop
    azimuthDeg: 210,
    elevationDeg: 16,
    distance: 11,
    caption: "think. build. test. break. correct. repeat.",
    route: "/process",
    routeLabel: "how I build",
  },
  {
    id: 4,
    code: "04",
    label: "SIGNALS",
    silhouette: 3, // waveform
    azimuthDeg: 282,
    elevationDeg: 10,
    distance: 12,
    caption: "What I'm into, what I'm making next.",
    route: "/about",
    routeLabel: "the human",
  },
  {
    id: 5,
    code: "05",
    label: "CONTACT",
    silhouette: 4, // @
    azimuthDeg: 338,
    elevationDeg: 12,
    distance: 10,
    caption: "Have an unusual interface in mind?",
    route: "/contact",
    routeLabel: "say hi",
  },
] as const;

/** storyT boundaries for each beat — evenly spaced. */
export function beatT(id: number): number {
  return id / (BEAT_COUNT - 1);
}

/**
 * The beat a content route belongs to, or null on the journey itself.
 * Longest match wins so /work/tack still maps to the WORK beat — the scene
 * holds that beat's silhouette while its detail layer is open.
 */
export function beatForRoute(pathname: string): number | null {
  let best: Beat | null = null;
  for (const b of BEATS) {
    if (!b.route) continue;
    if (pathname !== b.route && !pathname.startsWith(`${b.route}/`)) continue;
    if (!best || b.route.length > best.route!.length) best = b;
  }
  return best?.id ?? null;
}

/** Continuous beat position from storyT: { index, local } where
 *  index is the nearer beat and local is 0..1 toward it. */
export function storyPosition(t: number): { from: number; to: number; mix: number } {
  const clamped = Math.min(Math.max(t, 0), 1);
  const scaled = clamped * (BEAT_COUNT - 1);
  const from = Math.min(Math.floor(scaled), BEAT_COUNT - 1);
  const to = Math.min(from + 1, BEAT_COUNT - 1);
  const mix = scaled - from;
  return { from, to, mix };
}

/** How "resolved" the cloud is at storyT — 1 at a beat center, 0 mid-way. */
export function resolveAmount(t: number): number {
  const { mix } = storyPosition(t);
  // Distance from the nearest beat center, folded to 0..0.5.
  const d = Math.abs(mix - 0.5) * 2; // 1 at beats, 0 at midpoint
  return d;
}

export interface CameraPose {
  x: number;
  y: number;
  z: number;
}

export function beatPose(b: Beat): CameraPose {
  const az = (b.azimuthDeg * Math.PI) / 180;
  const el = (b.elevationDeg * Math.PI) / 180;
  return {
    x: b.distance * Math.cos(el) * Math.sin(az),
    y: b.distance * Math.sin(el),
    z: b.distance * Math.cos(el) * Math.cos(az),
  };
}

/** Interpolated camera pose along the spine at storyT (Catmull-Rom-ish
 * smoothstep between beat poses). */
export function spinePose(t: number): CameraPose {
  const { from, to, mix } = storyPosition(t);
  const a = beatPose(BEATS[from]!);
  const b = beatPose(BEATS[to]!);
  // Smoothstep easing keeps velocity continuous through beats.
  const s = mix * mix * (3 - 2 * mix);
  return {
    x: a.x + (b.x - a.x) * s,
    y: a.y + (b.y - a.y) * s,
    z: a.z + (b.z - a.z) * s,
  };
}
