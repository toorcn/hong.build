import type { Topic } from "./types";

export const TOPICS: readonly Topic[] = ["ai", "founder", "hack", "design", "hardware", "community"];
export const isTopic = (v: unknown): v is Topic => typeof v === "string" && (TOPICS as string[]).includes(v);

/** First match wins, so a "24h AI hackathon" rides the Hack Line. */
const RULES: [Topic, RegExp][] = [
  ["hack", /\b(hackathons?|hack|hacks|buildathon)\b/i],
  ["ai", /\b(ai|llms?|gpt|agents?|agentic|genai|machine learning|ml)\b/i],
  ["hardware", /\b(hardware|iot|robots?|robotics|maker|makers|electronics)\b/i],
  ["design", /\b(design|ux|ui|animation|figma)\b/i],
  ["founder", /\b(startups?|founders?|pitch|vc|investors?|demo day|fundraising)\b/i],
];

export function resolveTopic(name: string, explicit?: Topic): Topic {
  if (explicit) return explicit;
  return RULES.find(([, re]) => re.test(name))?.[0] ?? "community";
}
