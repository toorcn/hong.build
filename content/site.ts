/**
 * Site-wide facts: identity, contact, nav. Single place to edit copy
 * without touching components.
 */

export const SITE = {
  name: "Hong Bing Sim",
  shortName: "HONG BING",
  title: "AI engineer & builder",
  location: "Kuala Lumpur, MY (UTC+8)",
  thesis: "Meaning is found in the absurdity of our perception.",
  email: "hong@polytera.dev",
  status: "AI engineering at YTL AI Labs since Apr 2026. Building Tack.",
  socials: [
    { label: "LinkedIn", href: "https://linkedin.com/in/hong-bing" },
    { label: "Instagram", href: "https://instagram.com/h.0.n.4" },
    { label: "X", href: "https://x.com/leapinghong" },
    { label: "GitHub", href: "https://github.com/toorcn" },
    { label: "Tack", href: "https://tack.im" },
    { label: "AI Hackerdorm", href: "https://aihackerdorm.com" },
  ],
} as const;

export const NAV = [
  { label: "Work", href: "/work", code: "V1" },
  { label: "About", href: "/about", code: "V0" },
  { label: "Process", href: "/process", code: "V2" },
  { label: "Run log", href: "/notes", code: "V3" },
  { label: "Contact", href: "/contact", code: "V4" },
] as const;

/** Owner-confirmed public: YTL AI Labs, the SF research lab, and Polytera. */
export const ABOUT_FACTS = [
  { k: "role.current", v: "AI engineering, API & console — YTL AI Labs" },
  { k: "role.research", v: "SWE, research lab — SF-based startup ($3.2M pre-seed)" },
  { k: "role.founder", v: "Founder — Tack (tack.im), real-time AI meeting moderator" },
  { k: "study", v: "Computer science & psychology, Taylor's University" },
  { k: "community", v: "Co-founder & VP — AI Hackerdorm (4 chapters, 400+ members)" },
  { k: "side", v: "\"Chief Reality Officer\" — Polytera, seeded entirely by hackathon winnings" },
  { k: "graphics", v: "First Malaysian student showcase @ ACM SIGGRAPH Asia" },
] as const;
