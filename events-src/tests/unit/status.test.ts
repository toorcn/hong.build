import { describe, expect, it } from "vitest";
import { eventStatus } from "../../src/lib/status";
import type { PublicEvent } from "../../src/types";

const NOW = Date.parse("2026-11-07T10:52:00Z"); // 18:52 MYT
const e = (over: Partial<PublicEvent>): PublicEvent => ({
  id: "0000000000000001", name: "E", start: "2026-11-07T11:30:00.000Z", end: null, all_day: false,
  date: "2026-11-07", region: "kv", place_tag: null, topic: "ai", kind: "event", location: "KL",
  url: "https://x.y/z", organizer: null, price: null, image: null, ...over,
});

describe("eventStatus", () => {
  it("is BOARDING within the hour before start", () => {
    expect(eventStatus(e({}), NOW)).toEqual({ label: "BOARDING · 38 MIN", kind: "board", chip: true });
    expect(eventStatus(e({ start: "2026-11-07T11:52:00.000Z" }), NOW).label).toBe("BOARDING · 60 MIN");
    expect(eventStatus(e({ start: "2026-11-07T11:53:00.000Z" }), NOW)).toEqual({ label: "TODAY", kind: "today", chip: false });
  });
  it("is LIVE from start until end, defaulting to three hours", () => {
    expect(eventStatus(e({ start: "2026-11-07T10:52:00.000Z" }), NOW).kind).toBe("live");
    expect(eventStatus(e({ start: "2026-11-07T07:53:00.000Z" }), NOW).kind).toBe("live");
    expect(eventStatus(e({ start: "2026-11-07T07:52:00.000Z" }), NOW)).toEqual({ label: "DEPARTED", kind: "dep", chip: true });
    expect(eventStatus(e({ start: "2026-11-07T02:00:00.000Z", end: "2026-11-07T14:00:00.000Z" }), NOW).kind).toBe("live");
  });
  it("counts days ahead", () => {
    expect(eventStatus(e({ date: "2026-11-08", start: "2026-11-08T02:00:00.000Z" }), NOW)).toEqual({ label: "TOMORROW", kind: "soon", chip: false });
    expect(eventStatus(e({ date: "2026-11-11", start: "2026-11-10T16:00:00.000Z", all_day: true }), NOW).label).toBe("IN 4D");
  });
  it("treats all-day events as TODAY until midnight", () => {
    expect(eventStatus(e({ all_day: true, start: "2026-11-06T16:00:00.000Z" }), NOW)).toEqual({ label: "TODAY", kind: "today", chip: false });
  });
  it("counts down deadlines", () => {
    const d = e({ kind: "deadline", date: "2026-11-20", start: "2026-11-20T15:59:00.000Z" });
    expect(eventStatus(d, NOW)).toEqual({ label: "CLOSES IN 13D", kind: "board", chip: true });
    expect(eventStatus(e({ kind: "deadline", start: "2026-11-07T15:59:00.000Z" }), NOW).label).toBe("CLOSES TODAY");
    expect(eventStatus(e({ kind: "deadline", start: "2026-11-07T09:00:00.000Z" }), NOW).label).toBe("CLOSED");
  });
});
