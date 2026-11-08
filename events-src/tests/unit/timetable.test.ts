import { describe, expect, it } from "vitest";
import { buildTimetable, dayEvents, spurLabel } from "../../src/lib/timetable";
import type { PublicEvent } from "../../src/types";

const NOW = Date.parse("2026-11-07T10:52:00Z");
let n = 0;
const e = (over: Partial<PublicEvent>): PublicEvent => ({
  id: String(++n).padStart(16, "0"), name: `E${n}`, start: "2026-11-09T11:00:00.000Z", end: null, all_day: false,
  date: "2026-11-09", region: "kv", place_tag: null, topic: "ai", kind: "event", location: "KL",
  url: "https://x.y/z", organizer: null, price: null, image: null, ...over,
});

describe("buildTimetable", () => {
  it("always starts with today, splits main line from branches, and sorts", () => {
    const late = e({ name: "Late", start: "2026-11-09T12:00:00.000Z" });
    const early = e({ name: "Early", start: "2026-11-09T01:00:00.000Z" });
    const sg = e({ name: "SG", region: "sg", place_tag: "SG" });
    const days = buildTimetable([late, sg, early], NOW);
    expect(days.map((d) => [d.key, d.isToday])).toEqual([["2026-11-07", true], ["2026-11-09", false]]);
    expect(days[1]!.main.map((x) => x.name)).toEqual(["Early", "Late"]);
    expect(days[1]!.branch.map((x) => x.name)).toEqual(["SG"]);
    expect(dayEvents(days[1]!).map((x) => x.name)).toEqual(["Early", "SG", "Late"]);
  });

  it("puts still-running events from earlier days on today", () => {
    const running = e({ date: "2026-11-06", start: "2026-11-06T01:00:00.000Z", end: "2026-11-08T10:00:00.000Z" });
    expect(buildTimetable([running], NOW)[0]!.main).toEqual([running]);
  });

  it("names branches by what they carry", () => {
    expect(spurLabel([e({ region: "sg" })])).toBe("OVERSEAS LINK");
    expect(spurLabel([e({ region: "online" })])).toBe("ONLINE LINK");
    expect(spurLabel([e({ region: "online" }), e({ region: "other" })])).toBe("OVERSEAS & ONLINE LINK");
  });
});
