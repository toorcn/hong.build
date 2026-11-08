import type { Region } from "./types";

export const REGIONS: readonly Region[] = ["kv", "sg", "online", "other"];
export const isRegion = (v: unknown): v is Region => typeof v === "string" && (REGIONS as string[]).includes(v);

const KLANG_VALLEY = [
  "kuala lumpur", "kl", "klcc", "kl sentral", "bukit bintang", "petaling jaya", "pj", "bangsar",
  "bangsar south", "mid valley", "ttdi", "taman tun dr ismail", "damansara", "mont kiara",
  "sri hartamas", "cyberjaya", "putrajaya", "subang", "subang jaya", "puchong", "shah alam",
  "cheras", "ampang", "bukit jalil", "sunway", "kepong", "setapak", "klang", "selangor",
];
const ONLINE = ["online", "virtual", "zoom", "remote", "livestream", "live stream", "google meet"];
const SINGAPORE = ["singapore", "sg"];
const OTHER: Record<string, string> = {
  penang: "PENANG", "george town": "PENANG", "johor bahru": "JB", jb: "JB", johor: "JOHOR",
  ipoh: "IPOH", melaka: "MELAKA", malacca: "MELAKA", "kota kinabalu": "KK", kuching: "KUCHING",
  jakarta: "JAKARTA", bali: "BALI", bangkok: "BANGKOK", "ho chi minh": "HCMC", manila: "MANILA",
  tokyo: "TOKYO", seoul: "SEOUL", "hong kong": "HONG KONG", taipei: "TAIPEI", shanghai: "SHANGHAI",
  shenzhen: "SHENZHEN", beijing: "BEIJING", sydney: "SYDNEY", london: "LONDON",
  "san francisco": "SF", "new york": "NYC",
};

export interface PlaceResult {
  region: Region;
  placeTag: string | null;
  known: boolean;
}

function matcher(locationText: string) {
  const text = locationText.toLowerCase();
  return (term: string) =>
    new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(text);
}

const fallbackTag = (text: string) => (text.split(",")[0] ?? text).trim().toUpperCase().slice(0, 12) || "AWAY";

/** Main line (Klang Valley) or a branch, plus the short tag a branch station shows. */
export function resolvePlace(locationText: string, explicit?: Region): PlaceResult {
  const has = matcher(locationText);
  const otherTag = () => Object.entries(OTHER).find(([term]) => has(term))?.[1] ?? null;
  if (explicit === "kv") return { region: "kv", placeTag: null, known: true };
  if (explicit === "sg") return { region: "sg", placeTag: "SG", known: true };
  if (explicit === "online") return { region: "online", placeTag: "ONLINE", known: true };
  if (explicit === "other") return { region: "other", placeTag: otherTag() ?? fallbackTag(locationText), known: true };
  if (ONLINE.some(has)) return { region: "online", placeTag: "ONLINE", known: true };
  if (SINGAPORE.some(has)) return { region: "sg", placeTag: "SG", known: true };
  if (KLANG_VALLEY.some(has)) return { region: "kv", placeTag: null, known: true };
  const tag = otherTag();
  if (tag) return { region: "other", placeTag: tag, known: true };
  return { region: "kv", placeTag: null, known: false };
}
