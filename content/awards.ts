/**
 * The run log — every hackathon and competition entered, Oct 2022 onward,
 * including the ones that produced nothing.
 *
 * The empty results are the point. The first five entries have no placement
 * at all, and the sixth result wasn't his: he mentored INSLABBY to a
 * national championship before he ever placed himself. A wall of wins reads
 * as talent, which nobody relates to. The losses are what make the rest
 * legible.
 *
 * `result: null` means entered, no placement. That is data, not a gap.
 */

export interface Award {
  year: number;
  /** Month or span, lowercase, as it appears in the log. */
  month: string;
  event: string;
  /** Placement, or null for entered-no-placement. */
  result: string | null;
  org?: string;
  /** Competitive programming rather than a build event. */
  compCode?: boolean;
  /** Placement earned by a team he mentored, not competed on. */
  mentored?: boolean;
  /** One-line note for the log. */
  note?: string;
}

export const AWARDS: readonly Award[] = [
  // ── 2026 ──────────────────────────────────────────────────────────────
  {
    year: 2026,
    month: "jun",
    event: "'Sup × OpenAI Hackathon, Singapore",
    result: "Champion — Overall",
    org: "OpenAI, 'Sup, Carousell",
    note: "AUNTIE — trust-first AI copilot for SEA live commerce. 550+ international sign-ups.",
  },
  {
    year: 2026,
    month: "may",
    event: "Beyond Hack 2026, Macau",
    result: "2nd — Innovation & Creativity",
    org: "Beyond Expo",
  },
  {
    year: 2026,
    month: "may",
    event: "OpenAI × January Capital × Jelawang Capital",
    result: "3rd — $5k credits + 1y Pro",
    org: "OpenAI",
  },
  {
    year: 2026,
    month: "mar",
    event: "LotusHacks × HackHarvard",
    result: "Top 5% of 210 teams · 4 track placements",
    org: "LotusHacks & HackHarvard",
    note: "3rd Edtech (Etest Vietnam) · 1st Agora · 1st fal · 1st Exa",
  },

  // ── 2025 ──────────────────────────────────────────────────────────────
  {
    year: 2025,
    month: "oct",
    event: "Vortex XRJam: FuturScape 2025",
    result: "Champion",
    org: "Vortex XR Lab",
    note: "Mindspace — AR spatial organization companion.",
  },
  {
    year: 2025,
    month: "sep",
    event: "Great Malaysia AI Hackathon 2025",
    result: "Finalist — Top 5 of 550",
    org: "MDEC, AWS, APU",
  },
  {
    year: 2025,
    month: "aug",
    event: "ASEAN AI Malaysia Summit (aaims25)",
    result: "Student Champion",
    org: "Ministry of Digital & AI Tinkerer",
    note: "AI CodeFest & AI Buildathon. A managing partner from 500 Global was watching — the residency invite came out of this room.",
  },
  {
    year: 2025,
    month: "jul",
    event: "iCube IGNITE 2025",
    result: "Finalist",
    org: "iCube International",
  },
  {
    year: 2025,
    month: "jul",
    event: "Top Coders 2025, Taylor's University",
    result: "Top 2 — 1st runner-up",
    org: "Data Science Association",
    compCode: true,
  },
  {
    year: 2025,
    month: "jul",
    event: "FutureHack! A.I. Battlefield",
    result: "Semi-finalist & Speaker",
    org: "Newell",
  },
  {
    year: 2025,
    month: "jul",
    event: "Turboline × IIMS International Hackathon",
    result: "Special Recognition",
    org: "Turboline",
  },
  {
    year: 2025,
    month: "apr–jul",
    event: "ViTrox Tech 4 Good 2025",
    result: "Grand Finalist",
    org: "ViTrox",
  },
  {
    year: 2025,
    month: "jun",
    event: "ImagineHack 2025",
    result: "Best Technical Implementation",
    org: "Taylor's Agents Of Tech",
  },
  {
    year: 2025,
    month: "—",
    event: "Loophole Hackathon 2025",
    result: "Judges' Favourite",
    org: "Build Club MY",
  },

  // ── 2024 ── the placements start ──────────────────────────────────────
  {
    year: 2024,
    month: "dec",
    event: "Top Coders 2024, Taylor's University",
    result: "Champion — Top 1",
    org: "Data Science Association",
    compCode: true,
  },
  {
    year: 2024,
    month: "nov",
    event: "PayNet PayHack 2024",
    result: "Semi-finalist",
    org: "PayNet",
  },
  { year: 2024, month: "nov", event: "Deriv AI Hackathon", result: null },
  { year: 2024, month: "oct", event: "IIUM I-Hax", result: null },
  {
    year: 2024,
    month: "oct",
    event: "UCSI Hackathon — Cybersecurity Beyond Thinkable",
    result: "Champion — Top 1",
    org: "UCSI & Palo Alto Networks",
    note: "The first one he won himself, two years after the first entry.",
  },
  {
    year: 2024,
    month: "aug",
    event: "Google Workspace Hackathon 2024",
    result: "Finalist — Top 7 of 400 · Popularity Champion",
    org: "GDSC APU",
  },
  {
    year: 2024,
    month: "may",
    event: "UM Programming League National",
    result: null,
    compCode: true,
  },
  { year: 2024, month: "feb", event: "Hilti IT Competition", result: null },

  // ── 2023 ── the only result this year belongs to someone else ─────────
  {
    year: 2023,
    month: "nov",
    event: "Sime Darby Young Innovators Challenge — National Championship",
    result: "Winning team",
    org: "Sime Darby",
    mentored: true,
    note: "Mentored team INSLABBY. Coached someone else across the line a year before getting there himself.",
  },
  {
    year: 2023,
    month: "oct",
    event: "UITM International C-PROM",
    result: null,
    compCode: true,
  },
  {
    year: 2023,
    month: "may",
    event: "Taylor's Agents Of Tech ImagineHack",
    result: null,
  },
  {
    year: 2023,
    month: "jan",
    event: "RHB Get Your Hack On: ASEAN",
    result: null,
    org: "RHB",
  },

  // ── 2022 ── where it starts. Nothing to show for either. ──────────────
  { year: 2022, month: "oct", event: "Hong Leong Bank Hackathon", result: null },
  {
    year: 2022,
    month: "oct",
    event: "UM Odyssey Hackfest",
    result: null,
    note: "The first one.",
  },
] as const;

/** Every event entered. */
export const EVENT_COUNT = AWARDS.length;

/** Entries that produced a placement of his own. */
export const PLACEMENT_COUNT = AWARDS.filter((a) => a.result && !a.mentored).length;

/** Entries that produced nothing. Kept visible on purpose. */
export const NO_PLACEMENT_COUNT = AWARDS.filter((a) => a.result === null).length;

/** Outright event wins — champion or top 1. */
export const CHAMPION_COUNT = AWARDS.filter(
  (a) => a.result && !a.mentored && /champion|top 1/i.test(a.result),
).length;

/** The first year of the run. */
export const FIRST_YEAR = Math.min(...AWARDS.map((a) => a.year));

/**
 * Entries per year, oldest first. Silhouette 3 in assets/silhouettes.ts is
 * drawn from this shape — if these counts change, redraw those bars and
 * re-run `npm run fragments`.
 */
export const BY_YEAR: readonly { year: number; count: number }[] = [
  ...new Set(AWARDS.map((a) => a.year)),
]
  .sort((a, b) => a - b)
  .map((year) => ({ year, count: AWARDS.filter((a) => a.year === year).length }));


/**
 * Entries per year broken down by outcome, oldest first. The frequency chart
 * on /notes and silhouette 9 both read this — one source of truth.
 *
 * `placed` is a self-won result, `mentored` is a team he coached across, and
 * `nothing` is entered-no-placement. `total === placed + mentored + nothing`.
 */
export interface YearOutcome {
  year: number;
  total: number;
  placed: number;
  mentored: number;
  nothing: number;
}

export const OUTCOMES_BY_YEAR: readonly YearOutcome[] = [
  ...new Set(AWARDS.map((a) => a.year)),
]
  .sort((a, b) => a - b)
  .map((year) => {
    const e = AWARDS.filter((a) => a.year === year);
    return {
      year,
      total: e.length,
      placed: e.filter((a) => a.result && !a.mentored).length,
      mentored: e.filter((a) => a.mentored).length,
      nothing: e.filter((a) => a.result === null).length,
    };
  });