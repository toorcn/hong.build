/**
 * The narrative spine — single source of truth for the scroll journey.
 *
 * storyT runs 0..1 across the whole journey. Beats are stops along it, and
 * they are deliberately NOT evenly spaced: the gaps mirror real elapsed
 * time. One spark at twelve, four quiet years, then everything at once.
 * The gaps shrink as you scroll because the life accelerated.
 *
 * Each beat owns an authored camera pose, a silhouette the fragment cloud
 * resolves into, and two lines: `line` lands when the cloud resolves,
 * `turn` lands as it dissolves and hands off to the next beat. The
 * interstitials carry the narration rather than being dead scroll.
 */

export const BEAT_COUNT = 11;

/**
 * Beat positions along storyT. Uneven on purpose — see the note above.
 * Gaps: .20 .12 .10 .09 .09 .08 .08 .08 .08 .08 — tightening, then holding.
 *
 * The first gap is the long one: Dec 2017 → Oct 2022, when nothing was
 * shipped and nothing was entered. It is the only silence in the piece
 * that is earned, so it gets the most room.
 *
 * The plateau at the end is the other honest bit: from 2024 on, the beats
 * stop spreading out because the events stopped spreading out. Six of the
 * eleven committee terms started in a single year.
 */
export const BEAT_T = [
  0, 0.2, 0.32, 0.42, 0.51, 0.6, 0.68, 0.76, 0.84, 0.92, 1.0,
] as const;

export interface Beat {
  id: number;
  /** Machine label for chrome. */
  code: string;
  /** Display label — the phase name. */
  label: string;
  /**
   * Compact year token for the chapter rail, so the rail reads as a time
   * axis rather than a row of anonymous dots. Kept short enough to sit in
   * the rail's gutter: "2017", "22–23".
   */
  year: string;
  /** Rough date this beat sits at, for the chrome's time readout. */
  when: string;
  /** The silhouette id in silhouettes.ts this beat resolves to. */
  silhouette: number;
  /** Authored camera azimuth (deg), elevation (deg), distance. */
  azimuthDeg: number;
  elevationDeg: number;
  distance: number;
  /** The claim. Lands as the cloud resolves. */
  line: string;
  /** The consequence. Lands as the cloud dissolves toward the next beat. */
  turn: string;
  /** Optional route for the "read more" detail layer. */
  route?: string;
  /** Route label. */
  routeLabel?: string;
}

/**
 * Eleven chapters, chronological, one claim each.
 *
 * The club years used to be a single beat — seven committees, a 1,700-person
 * convention and a 19-campus network crushed into one breath. That was the
 * least honest beat in the piece: it read as a list, and a list is what you
 * write when you have not decided what any of it meant. It is now four
 * chapters (04–07): why he joined, what he built out of joining, the terms
 * themselves as a time axis, and the room that grew because of them.
 *
 * `silhouette` indices match beat ids — see assets/silhouettes.ts.
 */
export const BEATS: readonly Beat[] = [
  {
    id: 0,
    code: "00",
    label: "HG748",
    year: "2017",
    when: "dec 2017",
    silhouette: 0, // the whitelist gate, built from blocks
    azimuthDeg: 0,
    elevationDeg: 10,
    distance: 11,
    line: "I was twelve, playing Minecraft, and I wanted to control who got into my server. So I learned Java.",
    turn: "Two plugins. 1,595 strangers ran them. The server had a donation link. Then I stopped for four years.",
  },
  {
    id: 1,
    code: "01",
    label: "FIRST FIVE",
    year: "22–23",
    when: "oct 2022 — oct 2023",
    silhouette: 1, // five entries, every result slot empty
    azimuthDeg: 48,
    elevationDeg: 14,
    distance: 12,
    line: "First hackathon, October 2022. Then four more.",
    turn: "No placement. Five times.",
  },
  {
    id: 2,
    code: "02",
    label: "SOMEONE ELSE'S WIN",
    year: "2023",
    when: "nov 2023",
    silhouette: 2, // the trophy crossing to the other podium
    azimuthDeg: 96,
    elevationDeg: 8,
    distance: 12,
    line: "The sixth one I didn't compete in. I mentored a team called INSLABBY, and they took the national championship.",
    turn: "I could see it before I could do it.",
  },
  {
    id: 3,
    code: "03",
    label: "THE LOOP",
    year: "2024",
    when: "2024",
    silhouette: 3, // five nodes and a break — think build test break correct
    azimuthDeg: 144,
    elevationDeg: 16,
    distance: 11,
    line: "think. build. test. break. correct. repeat.",
    turn: "Ten months later, my own Top 1. Then another one in December.",
    route: "/process",
    routeLabel: "how I build",
  },
  {
    id: 4,
    code: "04",
    label: "JOINED, THEN BUILT",
    year: "2024",
    when: "feb 2024 — 2025",
    silhouette: 4, // a controller with a prompt where the logo goes
    azimuthDeg: 188,
    elevationDeg: 12,
    distance: 12,
    line: "I joined the esports club because I play. I ended up being the one who wrote its software.",
    turn: "Anime society the same way — secretary, then VP, then president. Being into something runs out of room, and then you build it.",
    route: "/work",
    routeLabel: "what came out of it",
  },
  {
    id: 5,
    code: "05",
    label: "KIYOKOCON",
    year: "2025",
    when: "2025",
    silhouette: 5, // a stage and the room in front of it
    azimuthDeg: 232,
    elevationDeg: 9,
    distance: 12,
    line: "So I founded a convention and chaired it. Fifty booths, thirty-five partners, 1,700 people through the door.",
    turn: "Event of the Year, gold. The build was never the point — the room was.",
    route: "/work/kiyokocon",
    routeLabel: "the convention",
  },
  {
    id: 6,
    code: "06",
    label: "ELEVEN TERMS",
    year: "24–26",
    when: "feb 2024 — now",
    silhouette: 6, // the terms as bars on a real time axis, overlapping
    azimuthDeg: 274,
    elevationDeg: 15,
    distance: 12,
    line: "Anime society. Esports. Valorant. Student welfare. Family business. Counselling. Ice skating. Eleven terms, and every one of them overlaps another.",
    turn: "Six started in 2025 alone. I meant all of them, and I never finished one before starting the next.",
    route: "/about",
    routeLabel: "the human",
  },
  {
    id: 7,
    code: "07",
    label: "THE ROOM GOT BIGGER",
    year: "2025",
    when: "aug 2025",
    silhouette: 7, // the same small figure, in rooms that keep growing
    azimuthDeg: 312,
    elevationDeg: 10,
    distance: 12,
    line: "Student champion at the ASEAN AI Summit buildathon. A managing partner from 500 Global was watching, and pulled us into the residency.",
    turn: "Same month, I co-founded a place for the people who would have been in that room.",
  },
  {
    id: 8,
    code: "08",
    label: "NINETEEN CAMPUSES",
    year: "25–26",
    when: "aug 2025 — now",
    silhouette: 8, // one hub, eighteen campuses, all wired
    azimuthDeg: 356,
    elevationDeg: 13,
    distance: 12,
    line: "AI Hackerdorm. Five hundred students across nineteen campuses, and we co-ran Cursor × Anthropic Malaysia with $410,000 on the table.",
    turn: "Then HackHarvard. Macau. Singapore. OpenAI. Nobody announced the venues getting bigger — they just did.",
    route: "/work/ai-hackerdorm",
    routeLabel: "the dorm",
  },
  {
    id: 9,
    code: "09",
    label: "THE RUN",
    year: "22–26",
    when: "2022 — 2026",
    silhouette: 9, // thirty entries, plotted by year
    azimuthDeg: 40,
    elevationDeg: 11,
    distance: 12,
    line: "Thirty events across five years. Nineteen results — and eleven that gave me nothing at all.",
    turn: "The blanks stay in the log. They are the part that explains the rest.",
    route: "/notes",
    routeLabel: "the run log",
  },
  {
    id: 10,
    code: "10",
    label: "HONG BING",
    year: "now",
    when: "now",
    silhouette: 10, // the wordmark — earned, not announced
    azimuthDeg: 84,
    elevationDeg: 12,
    distance: 10,
    line: "Same loop every time: be in the room, work out what it needs, build that. I'm still entering.",
    turn: "Say hi.",
    route: "/contact",
    routeLabel: "say hi",
  },
] as const;

/** storyT position of a beat. Uneven — reads from BEAT_T. */
export function beatT(id: number): number {
  return BEAT_T[Math.min(Math.max(id, 0), BEAT_COUNT - 1)] ?? 0;
}

/**
 * The beat a content route belongs to, or null on the journey itself.
 * Longest match wins so /work/tack still maps to its beat — the scene
 * holds that beat's silhouette while its detail layer is open.
 */
export function beatForRoute(pathname: string | null | undefined): number | null {
  // Callers inside drei's <Html> get a null pathname when the router context
  // hasn't been bridged, and a crash there takes the whole Canvas subtree out.
  if (!pathname) return null;
  let best: Beat | null = null;
  for (const b of BEATS) {
    if (!b.route) continue;
    if (pathname !== b.route && !pathname.startsWith(`${b.route}/`)) continue;
    if (!best || b.route.length > best.route!.length) best = b;
  }
  return best?.id ?? null;
}

/**
 * Continuous beat position from storyT: the segment you're in and how far
 * through it you are. Walks BEAT_T rather than assuming even spacing, so
 * `mix` stays normalised 0..1 per segment however long that segment is.
 */
export function storyPosition(t: number): { from: number; to: number; mix: number } {
  const clamped = Math.min(Math.max(t, 0), 1);

  // Find the segment. BEAT_COUNT is small enough that a linear walk is
  // cheaper than the branch-heavy binary search it would replace.
  let from = 0;
  for (let i = BEAT_COUNT - 2; i >= 0; i--) {
    if (clamped >= BEAT_T[i]!) {
      from = i;
      break;
    }
  }
  const to = Math.min(from + 1, BEAT_COUNT - 1);

  const a = BEAT_T[from]!;
  const b = BEAT_T[to]!;
  const span = b - a;
  const mix = span > 0 ? Math.min(Math.max((clamped - a) / span, 0), 1) : 1;

  return { from, to, mix };
}

/**
 * The beat storyT is currently nearest to — same rule the rig uses for
 * `activeBeat` (pull toward the closer endpoint of the current segment).
 * Magnetic scroll snap lands here when the visitor stops mid-dissolve.
 */
export function nearestBeat(t: number): number {
  const { from, to, mix } = storyPosition(t);
  return mix < 0.5 ? from : to;
}

/**
 * How "resolved" the cloud is at storyT — 1 at a beat center, 0 midway
 * between two beats. Because `mix` is normalised per segment, a long
 * segment simply means a longer, slower dissolve. The four quiet years
 * get the longest one in the piece, which is the point.
 */
export function resolveAmount(t: number): number {
  const { mix } = storyPosition(t);
  return Math.abs(mix - 0.5) * 2; // 1 at beats, 0 at the midpoint
}

/**
 * Fidelity of the resolve, 0..1, climbing across the journey. Beat 0 lands
 * coarse and blocky — honest to an 18 KB jar written by a twelve-year-old —
 * and the cloud sharpens as the story advances. The rendering technique
 * narrates the growth alongside the copy.
 *
 * Wired in scripts/generate-fragments.ts: per-beat depth jitter scales
 * down as fidelity climbs, so early artifacts scatter and late ones set
 * tight.
 */
export function fidelity(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1);
  // Eased so the early gain is visible rather than all of it arriving late.
  return 0.35 + 0.65 * clamped * clamped;
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

/* ------------------------------------------------------------------ */
/* The walk — world layout.                                            */
/*                                                                     */
/* The journey is a corridor of rooms, one per chapter, along a        */
/* winding path. Rooms grow as the story accelerates; the final        */
/* chapter floats in effectively open space. Each room's artifact is   */
/* built from its own fragment allocation (see generate-fragments) —   */
/* fragments never become a different artifact; there is no morph.     */
/* Future chapters exist as dust-shells around their room until the    */
/* camera nears and they gather. Past chapters stay formed but dim,    */
/* drift, and relax toward the walls — history becomes the rooms.      */
/*                                                                     */
/* Note the inversion: BEAT_T gaps shrink (life accelerated) while     */
/* physical distances grow (the world got bigger). The four quiet      */
/* years are a long, slow scroll through a short, empty hallway; the  */
/* later chapters rush through vast rooms.                             */
/* ------------------------------------------------------------------ */

export interface Room {
  /** World-space centre of the room; the artifact floats here. */
  center: [number, number, number];
  /** Dust-shell radius — the size of the room's walls. */
  radius: number;
}

export const ROOMS: readonly Room[] = [
  { center: [0, 0, 0], radius: 9 }, // 00 the gate
  { center: [6, 1, -26], radius: 12 }, // 01 first five
  { center: [-8, 2, -56], radius: 16 }, // 02 someone else's win
  { center: [10, 3, -94], radius: 20 }, // 03 the loop
  { center: [-11, 4, -136], radius: 24 }, // 04 joined, then built
  { center: [13, 5, -182], radius: 30 }, // 05 kiyokocon
  { center: [-15, 6, -234], radius: 34 }, // 06 eleven terms
  { center: [12, 7, -290], radius: 38 }, // 07 the room got bigger
  { center: [-14, 8, -352], radius: 44 }, // 08 nineteen campuses
  { center: [15, 9, -420], radius: 50 }, // 09 the run
  { center: [0, 10, -496], radius: 60 }, // 10 hong bing — open space
] as const;

/**
 * Per-beat fragment allocations — the morph is gone, so each chapter
 * gets its own fixed share of the pool, weighted by how much ink its
 * silhouette needs. Must sum to FRAGMENT_TOTAL (7000).
 *
 * The gate is deliberately the thinnest: coarse blocks, few of them, and
 * the story sharpens from there. The wordmark takes the most because two
 * lines of heavy display type need the ink to stay legible.
 */
export const BEAT_ALLOCATIONS = [
  480, 520, 600, 600, 620, 740, 700, 560, 640, 640, 900,
] as const;

/** World-space hero camera position for beat k: room centre + authored orbit. */
export function approachPose(k: number): CameraPose {
  const b = BEATS[Math.min(Math.max(k, 0), BEAT_COUNT - 1)]!;
  const room = ROOMS[Math.min(Math.max(k, 0), BEAT_COUNT - 1)]!;
  const orbit = beatPose(b);
  return {
    x: room.center[0] + orbit.x,
    y: room.center[1] + orbit.y,
    z: room.center[2] + orbit.z,
  };
}

/**
 * Camera position along the walk at storyT. Interpolates between room
 * approach poses with the same smoothstep the old spine used, so the
 * scroll feel is unchanged — only the topology moved.
 */
export function pathPose(t: number): CameraPose {
  const { from, to, mix } = storyPosition(t);
  const a = approachPose(from);
  const b = approachPose(to);
  const s = mix * mix * (3 - 2 * mix);
  return {
    x: a.x + (b.x - a.x) * s,
    y: a.y + (b.y - a.y) * s,
    z: a.z + (b.z - a.z) * s,
  };
}

/**
 * Where the camera looks at storyT. Room centres, eased to lead slightly
 * toward the next room so the gathering dust is already in frame.
 */
export function pathLook(t: number): CameraPose {
  const { from, to, mix } = storyPosition(t);
  const a = ROOMS[from]!.center;
  const b = ROOMS[to]!.center;
  const s0 = mix * mix * (3 - 2 * mix);
  const s = Math.pow(s0, 0.7);
  return {
    x: a[0] + (b[0] - a[0]) * s,
    y: a[1] + (b[1] - a[1]) * s,
    z: a[2] + (b[2] - a[2]) * s,
  };
}
