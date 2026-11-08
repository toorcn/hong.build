import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadTimetable, staleDays } from "../../src/lib/api";
import { readPref, writePref } from "../../src/lib/prefs";
import type { EventsResponse } from "../../src/types";

const data: EventsResponse = { generated_at: "2026-11-07T10:52:00.000Z", last_ingest_at: "2026-11-07T00:05:00.000Z", tz: "Asia/Kuala_Lumpur", events: [] };
const ok = (async () => Response.json(data)) as typeof fetch;
const down = (async () => { throw new Error("offline"); }) as typeof fetch;

function memoryStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("prefs", () => {
  it("falls back when storage is unavailable", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(readPref("night", true)).toBe(true);
    expect(() => writePref("night", false)).not.toThrow();
  });
  it("round-trips through storage", () => {
    vi.stubGlobal("localStorage", memoryStorage());
    writePref("kept", ["a"]);
    expect(readPref<string[]>("kept", [])).toEqual(["a"]);
  });
});

describe("loadTimetable", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
  });

  it("returns fresh data and keeps a copy", async () => {
    expect(await loadTimetable(ok)).toEqual({ state: "fresh", data });
    expect(await loadTimetable(down)).toEqual({ state: "cached", data });
  });
  it("reports an error with no saved copy", async () => {
    expect(await loadTimetable(down)).toEqual({ state: "error" });
  });
});

describe("staleDays", () => {
  it("only reports pushes older than 48 hours", () => {
    expect(staleDays(data, Date.parse("2026-11-08T23:00:00Z"))).toBeNull();
    expect(staleDays({ ...data, last_ingest_at: "2026-11-04T00:00:00.000Z" }, Date.parse("2026-11-07T10:52:00Z"))).toBe(3);
    expect(staleDays({ ...data, last_ingest_at: null }, Date.now())).toBeNull();
  });
});
