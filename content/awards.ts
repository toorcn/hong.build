/**
 * The run log. Structured data for the SIGNALS destination.
 * "wins" are placements that count toward the 19x headline.
 */

export interface Award {
  year: number;
  event: string;
  result: string;
  org?: string;
  /** Counts toward the 19x hackathon-win headline. */
  win: boolean;
  /** One-line note for the log. */
  note?: string;
}

export const AWARDS: readonly Award[] = [
  {
    year: 2026,
    event: "'Sup × OpenAI Hackathon, Singapore",
    result: "Champion — Overall",
    org: "OpenAI, 'Sup, Carousell",
    win: true,
    note: "AUNTIE — trust-first AI copilot for SEA live commerce. 550+ international sign-ups.",
  },
  {
    year: 2026,
    event: "Beyond Hack 2026, Macau",
    result: "2nd — Innovation & Creativity",
    org: "Beyond Expo",
    win: true,
  },
  {
    year: 2026,
    event: "OpenAI × January Capital × Jelawang Capital",
    result: "3rd — $5k credits + 1y Pro",
    org: "OpenAI",
    win: true,
  },
  {
    year: 2026,
    event: "LotusHacks 2026",
    result: "Top 5% of 210 teams",
    org: "LotusHacks & HackHarvard",
    win: false,
    note: "Won 4–8 tracks along the way.",
  },
  {
    year: 2025,
    event: "KiyokoCon 2025",
    result: "Event of the Year — Gold",
    org: "Taylor's Student Development",
    win: true,
    note: "As organising head & founder. 1.7k attendees, 50 booths, 35 partners.",
  },
  {
    year: 2025,
    event: "Vortex XRJam: FuturScape 2025",
    result: "Champion",
    org: "Vortex XR Lab",
    win: true,
    note: "Mindspace — AR spatial organization companion.",
  },
  {
    year: 2025,
    event: "Great Malaysia AI Hackathon 2025",
    result: "Finalist — Top 5 of 550",
    org: "MDEC, AWS, APU",
    win: false,
  },
  {
    year: 2025,
    event: "ASEAN AI Malaysia Summit (aaims25)",
    result: "Student Champion",
    org: "Ministry of Digital & AI Tinkerer",
    win: true,
    note: "AI CodeFest & AI Buildathon.",
  },
  {
    year: 2025,
    event: "FutureHack 2025",
    result: "Semi-finalist & Speaker",
    org: "Newell",
    win: false,
  },
  {
    year: 2025,
    event: "Top Coders 2025, Taylor's University",
    result: "1st runner-up",
    org: "Data Science Association",
    win: false,
  },
  {
    year: 2025,
    event: "Turboline × IIMS International Hackathon",
    result: "Special Recognition",
    org: "Turboline",
    win: false,
  },
  {
    year: 2025,
    event: "Vitrox Tech 4 Good 2025",
    result: "Grand Finalist",
    org: "Vitrox",
    win: false,
  },
  {
    year: 2025,
    event: "iCube IGNITE 2025",
    result: "Finalist",
    org: "iCube International",
    win: false,
  },
  {
    year: 2025,
    event: "ImagineHack 2025",
    result: "Best Technical Implementation",
    org: "Taylor's Agents Of Tech",
    win: true,
  },
  {
    year: 2025,
    event: "Loophole Hackathon 2025",
    result: "Judges' Favourite",
    org: "Build Club MY",
    win: true,
  },
  {
    year: 2024,
    event: "PayNet PayHack 2024",
    result: "Semi-finalist",
    org: "PayNet",
    win: false,
  },
  {
    year: 2024,
    event: "Top Coders 2024, Taylor's University",
    result: "Champion",
    org: "Data Science Association",
    win: true,
  },
  {
    year: 2024,
    event: "UCSI Hackathon — Cybersecurity Beyond Thinkable",
    result: "Champion",
    org: "UCSI & Palo Alto Networks",
    win: true,
  },
  {
    year: 2024,
    event: "Google Workspace Hackathon 2024",
    result: "Finalist — Top 7 of 400",
    org: "GDSC APU",
    win: false,
  },
  {
    year: 2024,
    event: "Google Workspace Hackathon 2024",
    result: "Popularity Champion",
    org: "GDSC APU",
    win: true,
  },
] as const;

export const WIN_COUNT = AWARDS.filter((a) => a.win).length;
