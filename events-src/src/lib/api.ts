import type { EventsResponse } from "../types";
import { readPref, writePref } from "./prefs";

export type Load = { state: "fresh" | "cached"; data: EventsResponse } | { state: "error" };

const STALE_MS = 48 * 60 * 60 * 1000;

/** Shape check shared by network and cached data. */
const isEventsResponse = (x: unknown): x is EventsResponse =>
  typeof x === "object" && x !== null && Array.isArray((x as EventsResponse).events);

export async function loadTimetable(fetchImpl: typeof fetch = fetch): Promise<Load> {
  try {
    const res = await fetchImpl("/api/events", { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: unknown = await res.json();
    if (!isEventsResponse(data)) throw new Error("unexpected response");
    writePref("timetable", data);
    return { state: "fresh", data };
  } catch {
    const cached = readPref<unknown>("timetable", null);
    return isEventsResponse(cached) ? { state: "cached", data: cached } : { state: "error" };
  }
}

/** Whole days since OpenClaw last pushed, once that is more than 48 h; otherwise null. */
export function staleDays(data: EventsResponse, nowMs: number): number | null {
  if (!data.last_ingest_at) return null;
  const age = nowMs - Date.parse(data.last_ingest_at);
  return age > STALE_MS ? Math.floor(age / (24 * 60 * 60 * 1000)) : null;
}
