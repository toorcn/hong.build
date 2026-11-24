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
  /** Mentored rather than competed; result records the role or team's placement. */
  mentored?: boolean;
  /** One-line note for the log. */
  note?: string;
  /** The post about it, where there is one. */
  linkedin?: string;
}

const LOGGED: readonly Award[] = [
  // ── 2026 ──────────────────────────────────────────────────────────────
  {
    year: 2026,
    month: "oct",
    event: "MIT Hacking Medicine Malaysia 2026",
    result: "Mentor",
    org: "MIT",
    mentored: true,
  },
  {
    year: 2026,
    month: "sep",
    event: "HackMIT 2026",
    result: "#1 Hardware — Special Prize",
    org: "HackMIT",
    note: "HARE — a prototype robot learning companion for preschoolers.",
    linkedin: "https://www.linkedin.com/feed/update/urn:li:activity:7513761391082729472/",
  },
  {
    year: 2026,
    month: "sep",
    event: "CodeNection 2026",
    result: "Mentor",
    mentored: true,
  },
  {
    year: 2026,
    month: "aug",
    event: "Devin KL Hackathon 2026",
    result: "Finalist",
    org: "Cognition",
  },
  {
    year: 2026,
    month: "jul",
    event: "Codex Community Hackathon 2026 (OpenAI Build Week), Kuala Lumpur",
    result: "Technical mentor",
    org: "OpenAI",
    mentored: true,
  },
  {
    year: 2026,
    month: "jun",
    event: "'Sup × OpenAI Hackathon, Singapore",
    result: "Champion — Overall",
    org: "OpenAI, 'Sup, Carousell",
    note: "AUNTIE — trust-first AI copilot for SEA live commerce. 550+ international sign-ups.",
    linkedin: "https://www.linkedin.com/posts/hong-bing_sup-won-%F0%9D%97%99%F0%9D%97%B6%F0%9D%97%BF%F0%9D%98%80%F0%9D%98%81-%F0%9D%97%BD%F0%9D%97%B9%F0%9D%97%AE%F0%9D%97%B0%F0%9D%97%B2-at-the-%F0%9D%97%A6-activity-7487729044659249152-H7z1",
  },
  {
    year: 2026,
    month: "may",
    event: "Beyond Hack 2026, Macau",
    result: "2nd — Innovation & Creativity",
    org: "Beyond Expo",
    linkedin: "https://www.linkedin.com/posts/hong-bing_openclaw-codex-clawcon-activity-7472445350163886080-CE4B",
  },
  {
    year: 2026,
    month: "may",
    event: "Lovable Vibeathon KL",
    result: "Mentor · Preliminary Judge",
    org: "Lovable",
    mentored: true,
  },
  {
    year: 2026,
    month: "may",
    event: "OpenAI × January Capital × Jelawang Capital",
    result: "3rd — $5k credits + 1y Pro",
    org: "OpenAI",
    linkedin: "https://www.linkedin.com/posts/hong-bing_sup-won-an-openai-hackathon-solo-7k-activity-7460677775901888512-ARHi",
  },
  {
    year: 2026,
    month: "may",
    event: "ImagineHack 2026",
    result: "Workshop Speaker",
    org: "Taylor's Agents Of Tech",
    mentored: true,
    note: "https://hackathon.polytera.dev",
  },
  {
    year: 2026,
    month: "mar",
    event: "LotusHacks × HackHarvard",
    result: "Top 5% of 210 teams · 4 track placements",
    org: "LotusHacks & HackHarvard",
    note: "3rd Edtech (Etest Vietnam) · 1st Agora · 1st fal · 1st Exa",
    linkedin: "https://www.linkedin.com/posts/hong-bing_we-just-won-9-awards-at-%F0%9D%91%BD%F0%9D%92%8A%F0%9D%92%86%F0%9D%92%95%F0%9D%92%8F%F0%9D%92%82%F0%9D%92%8E%F0%9D%92%94-activity-7442494731399630848-zHjK",
  },
  {
    year: 2026,
    month: "mar",
    event: "KitaHack 2026",
    result: "Finalist",
    org: "KitaHack",
    mentored: true,
    linkedin: "https://www.linkedin.com/posts/hong-bing_kitahack2026-activity-7449275182059266048-E-XT",
  },
  // ── 2025 ──────────────────────────────────────────────────────────────
  {
    year: 2025,
    month: "dec",
    event: "Cursor × Anthropic Hackathon",
    result: "Preliminary Judge · Mentor · Organiser",
    org: "Cursor, Anthropic",
    mentored: true,
    linkedin: "https://www.linkedin.com/posts/hong-bing_i-stick-to-one-rule-say-yes-for-fundamental-activity-7404717003661406208-K24S",
  },
  {
    year: 2025,
    month: "oct",
    event: "Vortex XRJam: FuturScape 2025",
    result: "Champion",
    org: "Vortex XR Lab",
    note: "Mindspace — AR spatial organization companion.",
    linkedin: "https://www.linkedin.com/posts/hong-bing_hackathon-kiyokocon-kiyokocon-activity-7389121966659571713-bBwY",
  },
  {
    year: 2025,
    month: "sep",
    event: "Great Malaysia AI Hackathon 2025",
    result: "Finalist — Top 5 of 550",
    org: "MDEC, AWS, APU",
    linkedin: "https://www.linkedin.com/posts/hong-bing_top-2-tight-competition-and-learnt-so-much-activity-7383737320824426496-sRjz",
  },
  {
    year: 2025,
    month: "aug",
    event: "ASEAN AI Malaysia Summit (aaims25)",
    result: "Student Champion",
    org: "Ministry of Digital & AI Tinkerer",
    note: "AI CodeFest & AI Buildathon. A managing partner from 500 Global was watching — the residency invite came out of this room.",
    linkedin: "https://www.linkedin.com/posts/hong-bing_secured-my-14th-award-at-the-asean-ai-activity-7362339830074150912-BnRA",
  },
  {
    year: 2025,
    month: "aug",
    event: "CodeNection 2025",
    result: "Mentor",
    org: "CodeNection",
    mentored: true,
  },
  {
    year: 2025,
    month: "jul",
    event: "iCube IGNITE 2025",
    result: "Finalist",
    org: "iCube International",
    linkedin: "https://www.linkedin.com/posts/hong-bing_my-first-hackathon-pitch-was-a-%F0%9D%92%85%F0%9D%92%8A%F0%9D%92%94%F0%9D%92%82%F0%9D%92%94-activity-7359524305593905153-W5cI",
  },
  {
    year: 2025,
    month: "jul",
    event: "Top Coders 2025, Taylor's University",
    result: "Top 2 — 1st runner-up",
    org: "Data Science Association",
    compCode: true,
    linkedin: "https://www.linkedin.com/posts/hong-bing_my-first-hackathon-pitch-was-a-%F0%9D%92%85%F0%9D%92%8A%F0%9D%92%94%F0%9D%92%82%F0%9D%92%94-activity-7359524305593905153-W5cI",
  },
  {
    year: 2025,
    month: "jul",
    event: "FutureHack! A.I. Battlefield",
    result: "Semi-finalist & Speaker",
    org: "Newell",
    linkedin: "https://www.linkedin.com/posts/hong-bing_my-first-hackathon-pitch-was-a-%F0%9D%92%85%F0%9D%92%8A%F0%9D%92%94%F0%9D%92%82%F0%9D%92%94-activity-7359524305593905153-W5cI",
  },
  {
    year: 2025,
    month: "jul",
    event: "Turboline × IIMS International Hackathon",
    result: "Special Recognition",
    org: "Turboline",
    linkedin: "https://www.linkedin.com/posts/hong-bing_my-first-hackathon-pitch-was-a-%F0%9D%92%85%F0%9D%92%8A%F0%9D%92%94%F0%9D%92%82%F0%9D%92%94-activity-7359524305593905153-W5cI",
  },
  {
    year: 2025,
    month: "apr–jul",
    event: "ViTrox Tech 4 Good 2025",
    result: "Grand Finalist",
    org: "ViTrox",
    linkedin: "https://www.linkedin.com/posts/hong-bing_finalist-problem-neurodivergent-activity-7319648261663862784-N4za",
  },
  {
    year: 2025,
    month: "jun",
    event: "ImagineHack 2025",
    result: "Best Technical Implementation",
    org: "Taylor's Agents Of Tech",
    linkedin: "https://www.linkedin.com/posts/hong-bing_my-first-hackathon-pitch-was-a-%F0%9D%92%85%F0%9D%92%8A%F0%9D%92%94%F0%9D%92%82%F0%9D%92%94-activity-7359524305593905153-W5cI",
  },
  {
    year: 2025,
    month: "jun",
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
    linkedin: "https://www.linkedin.com/posts/hong-bing_champion-coding-activity-7279750519869349888-h1JA",
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
  {
    year: 2024,
    month: "feb",
    event: "Hilti IT Competition",
    result: null,
  },
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
  {
    year: 2022,
    month: "oct",
    event: "Hong Leong Bank Hackathon",
    result: null,
  },
  {
    year: 2022,
    month: "oct",
    event: "UM Odyssey Hackfest",
    result: null,
    note: "The first one.",
  },
] as const;

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Spans sort by their starting month; undated entries follow dated ones. */
function monthIndex(month: string): number {
  return MONTHS.indexOf(month.slice(0, 3));
}

/** Shared by the run log and generated documents, consistently newest first. */
export const AWARDS: readonly Award[] = [...LOGGED].sort(
  (a, b) => b.year - a.year || monthIndex(b.month) - monthIndex(a.month),
);

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
 * on /hackathons and silhouette 9 both read this — one source of truth.
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
