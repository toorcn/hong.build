import type { EventsResponse, PublicEvent } from "../../src/types";

/** Sat 7 Nov 2026, 18:52 in KL. */
export const NOW = new Date("2026-11-07T18:52:00+08:00");

const base: Omit<PublicEvent, "id" | "name" | "start" | "date" | "topic" | "location" | "url"> = {
  end: null, all_day: false, region: "kv", place_tag: null, kind: "event", organizer: null, price: null, image: null,
};

export const fixture: EventsResponse = {
  generated_at: "2026-11-07T10:52:00.000Z",
  last_ingest_at: "2026-11-07T00:05:00.000Z",
  tz: "Asia/Kuala_Lumpur",
  events: [
    { ...base, id: "a000000000000001", name: "Morning Design Crit", start: "2026-11-07T01:00:00.000Z", end: "2026-11-07T03:00:00.000Z", date: "2026-11-07", topic: "design", location: "Bangsar", url: "https://luma.com/crit" },
    { ...base, id: "a000000000000002", name: "Weekend Hack Sprint", start: "2026-11-07T02:00:00.000Z", end: "2026-11-07T14:00:00.000Z", date: "2026-11-07", topic: "hack", location: "Cyberjaya", url: "https://luma.com/sprint" },
    { ...base, id: "a000000000000003", name: "Builders Demo Night", start: "2026-11-07T11:30:00.000Z", date: "2026-11-07", topic: "founder", location: "Bangsar", url: "https://luma.com/demo" },
    { ...base, id: "a000000000000004", name: "AI Tinker Night", start: "2026-11-09T11:00:00.000Z", date: "2026-11-09", topic: "ai", location: "KL Sentral", url: "https://luma.com/tinker" },
    { ...base, id: "a000000000000005", name: "Code Meets Animation - SwiftLah! Community x LottieFiles", start: "2026-11-10T16:00:00.000Z", all_day: true, date: "2026-11-11", topic: "design", location: "Petaling Jaya", url: "https://luma.com/cwe18vhn", organizer: "SwiftLah! × LottieFiles" },
    { ...base, id: "a000000000000006", name: "SG Product Circle", start: "2026-11-17T11:00:00.000Z", date: "2026-11-17", region: "sg", place_tag: "SG", topic: "founder", location: "Singapore", url: "https://luma.com/sgpc" },
    { ...base, id: "a000000000000007", name: "Global AI Grant closes", start: "2026-11-20T15:59:00.000Z", date: "2026-11-20", region: "online", place_tag: "ONLINE", topic: "ai", kind: "deadline", location: "Online", url: "https://example.org/grant" },
  ],
};
