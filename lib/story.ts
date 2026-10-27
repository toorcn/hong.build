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
 * The spine is BEAT_COUNT * 96vh of journey followed by a 100vh outro. This
 * is the share of the spine's scroll range the journey itself occupies; the
 * rest is the "end pull" — scrolling past the last chapter toward hello.
 */
function journeyShare(): number {
  return (96 * BEAT_COUNT) / (96 * BEAT_COUNT + 100);
}

/** storyT and end pull from a scroll offset within the spine. */
export function storyFromScroll(
  scrolled: number,
  range: number,
): { storyT: number; endPull: number } {
  if (range <= 0) return { storyT: 0, endPull: 0 };
  const f = Math.min(Math.max(scrolled / range, 0), 1);
  const share = journeyShare();
  return f <= share
    ? { storyT: share > 0 ? f / share : 0, endPull: 0 }
    : { storyT: 1, endPull: 1 - share > 0 ? (f - share) / (1 - share) : 1 };
}

/** The scrollY that puts storyT on screen — the inverse of storyFromScroll. */
export function scrollForStory(t: number, top: number, range: number): number {
  return top + Math.min(Math.max(t, 0), 1) * journeyShare() * range;
}

/** End pull past which the outro hands the visitor to /contact. */
export const SAY_HI_PULL = 0.48;

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
  /** Title the cursor preview and in-scene window show for the route. */
  routeTitle?: string;
  /** One-line excerpt for the cursor preview. */
  routePreview?: string;
  /** NDC nudge for the dormant tablet so it clears this beat's artifact. */
  gateBias?: [number, number];
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
    label: "THE FIRST THING",
    year: "2017",
    when: "dec 2017",
    silhouette: 0, // the whitelist gate, built from blocks
    azimuthDeg: 0,
    elevationDeg: 10,
    distance: 11,
    line: "I was twelve, and I wanted to build things for my Minecraft server. So I learned to code.",
    turn: "Two plugins. 1,595 strangers downloaded them. Then I stopped for four years.",
  },
  {
    id: 1,
    code: "01",
    label: "THE LOSSES",
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
    label: "THE HAND-OFF",
    year: "2023",
    when: "nov 2023",
    silhouette: 2, // the trophy crossing to the other podium
    azimuthDeg: 96,
    elevationDeg: 8,
    distance: 12,
    line: "I was invited to mentor high school team INSLABBY. They won $4,000+ in grants at the national championship. I was so proud.",
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
    routeTitle: "How I build",
    routePreview: "The loop I actually trust, and the stance on AI it produced.",
  },
  {
    id: 4,
    code: "04",
    label: "THE TURN",
    year: "2024",
    when: "feb 2024 — 2025",
    silhouette: 4, // a controller with a prompt where the logo goes
    azimuthDeg: 188,
    elevationDeg: 12,
    distance: 12,
    line: "I kept building for the people I played with. Coaching the university team came out of that.",
    turn: "Anime society ran the same way — secretary, then VP, then president. Build for a room, and it makes space for you.",
    route: "/work",
    routeLabel: "what came out of it",
    routeTitle: "Selected work",
    routePreview: "Three things I built that taught me the most.",
  },
  {
    id: 5,
    code: "05",
    label: "THE GATHERING",
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
    routeTitle: "KiyokoCon",
    routePreview:
      "Malaysia's largest student-organised convention — 1,700 attendees, 50 booths, 35 partners.",
    gateBias: [0, -0.32],
  },
  {
    id: 6,
    code: "06",
    label: "ALL AT ONCE",
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
    routeTitle: "Hong Bing",
    routePreview: "I build interfaces where AI, design systems, and code meet.",
    gateBias: [0, -0.38],
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
    line: "Student champion at the ASEAN AI Summit buildathon. A managing partner from 500 Global was watching, and pulled me into the residency.",
    turn: "Same month, I co-founded a place for the people who would have been in that room.",
  },
  {
    id: 8,
    code: "08",
    label: "THE NETWORK",
    year: "25–26",
    when: "aug 2025 — now",
    silhouette: 8, // one hub, eighteen campuses, all wired
    azimuthDeg: 356,
    elevationDeg: 13,
    distance: 12,
    line: "AI Hackerdorm. Four chapters, four hundred-plus members nationwide. We co-organised Cursor × Anthropic Malaysia — $410,000 on the table.",
    turn: "Then HackMIT. HackHarvard. Macau. Hong Kong. Vietnam, Singapore. OpenAI. Nobody announced the venues getting bigger — they just did.",
    route: "/work/ai-hackerdorm",
    routeLabel: "the dorm",
    routeTitle: "AI Hackerdorm",
    routePreview:
      "A student-first builder community — four chapters and 400+ members nationwide.",
    gateBias: [0, -0.34],
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
    line: "Thirty-three events across five years. Eighteen I placed in, eight I wasn't competing, and seven gave me nothing at all.",
    turn: "The blanks stay in the log. They are the part that explains the rest.",
    route: "/notes",
    routeLabel: "the run log",
    routeTitle: "Run log",
    routePreview:
      "Every event since October 2022 — including the ones that produced nothing.",
    gateBias: [0, -0.4],
  },
  {
    id: 10,
    code: "10",
    label: "NOW",
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
    routeTitle: "Say hi",
    routePreview: "That's the whole story. Thanks for scrolling it.",
    gateBias: [0, -0.52],
  },
] as const;

/** storyT position of a beat. Uneven — reads from BEAT_T. */
export function beatT(id: number): number {
  return BEAT_T[Math.min(Math.max(id, 0), BEAT_COUNT - 1)] ?? 0;
}

/** The next beat after `id` that opens a route — where "next chapter" leads. */
export function nextRouteBeat(id: number): Beat | null {
  for (const b of BEATS) if (b.id > id && b.route) return b;
  return null;
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
 * The chapter ahead of storyT — the trail cursor's destination. Mid-dissolve
 * that is the segment's far end; parked on a beat it is the one after.
 */
export function upcomingBeat(t: number): number | null {
  const { from, to, mix } = storyPosition(t);
  if (mix > 0.08 && mix < 0.92) return to;
  const next = (mix <= 0.08 ? from : to) + 1;
  return next < BEAT_COUNT ? next : null;
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

/**
 * Half-extent (NDC) of the clear zone the cloud keeps open around the copy
 * at a framing pull of 1.
 */
export const CLEAR_RADIUS = 0.82;

const NO_FRAMING = { pull: 1, liftNdc: 0 };

/**
 * How far the camera pulls back so an artifact clears the chrome on this
 * viewport, and how far (NDC) it lifts to stay above the caption band.
 * Narrow and short viewports pull back more; phones lift further because
 * the caption sits higher.
 */
export function framingFor(
  width: number,
  height: number,
): { pull: number; liftNdc: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    return NO_FRAMING;
  const top = Math.min(96 / height, 0.35);
  const bottom = Math.min((width < 640 ? 280 : 150) / height, 0.45);
  return {
    pull: Math.min(
      2.6,
      Math.max(
        1,
        CLEAR_RADIUS / ((width / height) * 0.9),
        0.7266666666666667 / Math.max(1 - top - bottom, 0.2),
      ),
    ),
    liftNdc: Math.max(0, bottom - top - 0.06),
  };
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
 * How much the look target leads the camera's own easing, as an exponent on
 * the segment's smoothstep. Exported because the track has to undo it — see
 * `trackMixAt`.
 */
export const LOOK_LEAD = 0.7;

/**
 * Where the camera looks at storyT. Room centres, eased to lead slightly
 * toward the next room so the gathering dust is already in frame.
 */
export function pathLook(t: number): CameraPose {
  const { from, to, mix } = storyPosition(t);
  const a = ROOMS[from]!.center;
  const b = ROOMS[to]!.center;
  const s0 = mix * mix * (3 - 2 * mix);
  const s = Math.pow(s0, LOOK_LEAD);
  return {
    x: a[0] + (b[0] - a[0]) * s,
    y: a[1] + (b[1] - a[1]) * s,
    z: a[2] + (b[2] - a[2]) * s,
  };
}

/* ------------------------------------------------------------------ */
/* The track — the walk made visible.                                  */
/*                                                                     */
/* The corridor is real but it was invisible: the camera moved through */
/* eleven rooms and nothing on screen said the rooms were connected,   */
/* or which way was forward. The track is a thread of dust running     */
/* under the artifacts from the gate to the wordmark, with a bead      */
/* where each chapter sits. It is drawn in components/lab-path.tsx;    */
/* only the geometry lives here, with the layout it derives from.      */
/* ------------------------------------------------------------------ */

/**
 * How far below a room's centre the track passes.
 *
 * Set by the camera, not by the room. Every beat is viewed from 10–12 units
 * out at 8–16 degrees of elevation, so what decides where the line lands in
 * frame is the drop against that fixed distance — and two units puts it
 * around two thirds of the way down, under the artifact and well clear of
 * the bottom edge. Scaling with the room radius (which grows sixfold) was
 * the first instinct and it was wrong: it sank the line out of frame in
 * exactly the late rooms where the walk is longest and needs it most.
 *
 * The faint growth term is only so the line clears the denser dust shells
 * of the later rooms.
 */
export function trackDrop(radius: number): number {
  return 2.0 + radius * 0.012;
}

/** World-space point where the track passes under room k. */
export function trackNode(k: number): CameraPose {
  const room = ROOMS[Math.min(Math.max(k, 0), BEAT_COUNT - 1)]!;
  return {
    x: room.center[0],
    y: room.center[1] - trackDrop(room.radius),
    z: room.center[2],
  };
}

/**
 * Undo the easing pathLook applies inside a segment.
 *
 * A point on the track needs to know the storyT at which the camera draws
 * level with it, so the lit head of the path can sit exactly under the
 * viewer. Position within a segment is `pow(smoothstep(mix), LOOK_LEAD)`;
 * this inverts both halves — the power, then smoothstep's closed-form
 * inverse — and returns the mix that produced `local`.
 */
export function trackMixAt(local: number): number {
  const clamped = Math.min(Math.max(local, 0), 1);
  const y = Math.min(Math.max(Math.pow(clamped, 1 / LOOK_LEAD), 0), 1);
  return 0.5 - Math.sin(Math.asin(1 - 2 * y) / 3);
}
