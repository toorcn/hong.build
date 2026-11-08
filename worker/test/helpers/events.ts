import { handleIngest, type IngestReport } from "../../events/ingest";
import { createTestDb } from "./d1";

export const NOW = Date.parse("2026-11-07T10:52:00Z"); // Sat 7 Nov 2026, 18:52 MYT
export const NOW_S = Math.floor(NOW / 1000);
export const TOKEN = "test-token";

export function makeEnv() {
  return { DB: createTestDb(), EVENTS_INGEST_TOKEN: TOKEN };
}
export type TestEnv = ReturnType<typeof makeEnv>;

export function ev(n: number, overrides: Record<string, unknown> = {}) {
  return {
    name: `Event ${n}`,
    date_text: "Wednesday, 11 November 2026",
    location_text: "Petaling Jaya",
    signup_url: `https://luma.com/e${n}`,
    ...overrides,
  };
}

export type IngestBody = Partial<IngestReport> & { error?: string; current?: number; accepted?: number };

export async function ingest(
  env: TestEnv,
  body: unknown,
  { token = TOKEN, raw }: { token?: string; raw?: string } = {},
): Promise<{ status: number; body: IngestBody }> {
  const request = new Request("https://events.hong.build/api/events/ingest", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: raw ?? JSON.stringify(body),
  });
  const res = await handleIngest(request, env, NOW);
  return { status: res.status, body: (await res.json()) as IngestBody };
}
