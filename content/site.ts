/**
 * Site-wide facts: identity, contact, nav. Single place to edit copy
 * without touching components.
 */

export const SITE = {
  name: "Hong Bing Sim",
  shortName: "HONG BING",
  title: "Founder, building in stealth",
  location: "Kuala Lumpur (UTC+8) · San Francisco (PT)",
  thesis: "Meaning is found in the absurdity of our perception.",
  email: "hi@hong.build",
  status: "Founder, building in stealth. AI engineering at YTL AI Labs since Apr 2026.",
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

/** Owner-confirmed public: the stealth company, YTL AI Labs, the SF research lab, and Polytera. */
export const ABOUT_FACTS = [
  { k: "role.founder", v: "Founder — building in stealth" },
  { k: "role.current", v: "AI engineering, API & console — YTL AI Labs" },
  { k: "role.previous", v: "SWE, research lab — SF-based startup ($3.2M pre-seed)" },
  { k: "built", v: "Tack (tack.im), real-time AI meeting moderator" },
  { k: "study", v: "Computer science & psychology, Taylor's University" },
  { k: "community", v: "Co-founder & VP — AI Hackerdorm (4 chapters, 700+ members)" },
  { k: "side", v: "\"Chief Reality Officer\" — Polytera, seeded entirely by hackathon winnings" },
  { k: "graphics", v: "First Malaysian student showcase @ ACM SIGGRAPH Asia" },
] as const;

/** How Hong builds. Rendered on /process and in the agent docs. */
export const PRINCIPLES = [
  {
    k: "think.build.test.break.correct.repeat",
    v: "Speed is not the same as progress. I'd rather run ten cheap loops than one expensive guess.",
  },
  {
    k: "intent beats volume",
    v: "Some of my best work came from the smallest prompts. Some of my worst came from throwing everything at the wall. Unclear prompts are usually unclear thinking.",
  },
  {
    k: "ai is infrastructure, not magic",
    v: "After RM25,000 of AI, the first good answer impresses me least. What matters is what happens after: can I give it context, tell when it's making something up, and turn the output into something that actually works?",
  },
  {
    k: "the tool is never the point",
    v: "Whether it's a meeting moderator or a convention, the build only matters if the room works. I optimize for the person, then the system.",
  },
] as const;
