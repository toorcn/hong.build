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
  email: "hello@hongbing.dev", // ← replace with your real address
  availability: "Open to select freelance & collab, Q4 2026",
  socials: [
    { label: "LinkedIn", href: "https://linkedin.com/in/hong-bing" },
    { label: "GitHub", href: "https://github.com/hongbinsim" }, // ← confirm handle
    { label: "Tack", href: "https://tack.im" },
    { label: "AI Hackerdorm", href: "https://aihackerdorm.com" },
  ],
} as const;

export const NAV = [
  { label: "Work", href: "/work", code: "V1" },
  { label: "About", href: "/about", code: "V0" },
  { label: "Process", href: "/process", code: "V2" },
  { label: "Signals", href: "/notes", code: "V3" },
  { label: "Contact", href: "/contact", code: "V4" },
] as const;

/**
 * REVIEW BEFORE LAUNCH — confirm with owner:
 * - how much can be said publicly about YTL AI Labs (sovereign AI, API & console)
 * - whether the SF research-lab role ("the human video company") can be named
 */
export const ABOUT_FACTS = [
  { k: "role.current", v: "AI engineering, API & console — YTL AI Labs" },
  { k: "role.research", v: "SWE, research lab — SF-based startup ($3.2M pre-seed)" },
  { k: "role.founder", v: "Founder — Tack (tack.im), real-time AI meeting moderator" },
  { k: "study", v: "Computer science & psychology, Taylor's University" },
  { k: "community", v: "Co-founder & VP — AI Hackerdorm (500+ students, 19 campuses)" },
  { k: "side", v: "\"Chief Reality Officer\" — Polytera, seeded entirely by hackathon winnings" },
  { k: "graphics", v: "First Malaysian student showcase @ ACM SIGGRAPH Asia" },
] as const;
