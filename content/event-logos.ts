/** Local copies of event or organiser marks. Sources: public/logos/events/SOURCES.md. */
export interface EventLogo {
  src: string;
  label: string;
  treatment?: "knockout" | "light" | "knockout-light";
}

// Preserve coloured/negative marks. White-matted assets need their matte
// removed; dark monochrome marks need a light treatment on the site's ink.
const TREATMENTS: Readonly<Record<string, EventLogo["treatment"]>> = {
  cursor: "knockout-light",
  digital: "knockout",
  google: "knockout",
  hackmit: "knockout",
  icube: "knockout",
  lotushacks: "knockout",
  lovable: "knockout",
  mdec: "knockout-light",
  openai: "knockout-light",
  paynet: "knockout",
  simedarby: "knockout-light",
  taylors: "light",
  turboline: "knockout",
  vitrox: "light",
};

const logo = (id: string, label: string): EventLogo => ({
  src: `/logos/events/${id}.png`,
  label,
  treatment: TREATMENTS[id],
});

const openai = logo("openai", "OpenAI");
const taylors = logo("taylors", "Taylor's University");
const um = logo("um", "Universiti Malaya");

/** Event marks take priority; otherwise use an organiser named in the log. */
export const EVENT_LOGOS: Readonly<Record<string, EventLogo>> = {
  "MIT Hacking Medicine Malaysia 2026": logo("mit", "MIT"),
  "HackMIT 2026": logo("hackmit", "HackMIT"),
  "CodeNection 2026": logo("codenection", "IT Society MMU"),
  "Devin KL Hackathon 2026": logo("devin", "Devin by Cognition"),
  "Codex Community Hackathon 2026 (OpenAI Build Week), Kuala Lumpur": openai,
  "'Sup × OpenAI Hackathon, Singapore": openai,
  "Beyond Hack 2026, Macau": logo("beyond", "Beyond Expo"),
  "Lovable Vibeathon KL": logo("lovable", "Lovable"),
  "OpenAI × January Capital × Jelawang Capital": openai,
  "ImagineHack 2026": logo("agentsoftech", "Agents of Tech"),
  "LotusHacks × HackHarvard": logo("lotushacks", "LotusHacks"),
  "KitaHack 2026": logo("kitahack", "KitaHack"),
  "Cursor × Anthropic Hackathon": logo("cursor", "Cursor"),
  "Vortex XRJam: FuturScape 2025": taylors,
  "Great Malaysia AI Hackathon 2025": logo("mdec", "MDEC"),
  "ASEAN AI Malaysia Summit (aaims25)": logo("digital", "Ministry of Digital"),
  "CodeNection 2025": logo("codenection", "IT Society MMU"),
  "iCube IGNITE 2025": logo("icube", "iCube International"),
  "Top Coders 2025, Taylor's University": logo("dsa", "Data Science Association Malaysia"),
  "FutureHack! A.I. Battlefield": logo("newell", "Newell Road"),
  "Turboline × IIMS International Hackathon": logo("iims", "IIMS College"),
  "Loophole Hackathon 2025": logo("buildclub", "Build Club Malaysia"),
  "ViTrox Tech 4 Good 2025": logo("vitrox", "ViTrox"),
  "ImagineHack 2025": logo("agentsoftech", "Agents of Tech"),
  "Top Coders 2024, Taylor's University": logo("dsa", "Data Science Association Malaysia"),
  "PayNet PayHack 2024": logo("paynet", "PayNet"),
  "Deriv AI Hackathon": logo("deriv", "Deriv"),
  "IIUM I-Hax": logo("iium", "International Islamic University Malaysia"),
  "UCSI Hackathon — Cybersecurity Beyond Thinkable": logo("ucsi", "UCSI University"),
  "Google Workspace Hackathon 2024": logo("google", "Google"),
  "UM Programming League National": um,
  "Hilti IT Competition": logo("hilti", "Hilti"),
  "Sime Darby Young Innovators Challenge — National Championship": logo("yayasan", "Yayasan Sime Darby"),
  "UITM International C-PROM": logo("uitm", "Universiti Teknologi MARA"),
  "Taylor's Agents Of Tech ImagineHack": logo("agentsoftech", "Agents of Tech"),
  "RHB Get Your Hack On: ASEAN": logo("rhb", "RHB"),
  "Hong Leong Bank Hackathon": logo("hlb", "Hong Leong Bank"),
  "UM Odyssey Hackfest": um,
};
