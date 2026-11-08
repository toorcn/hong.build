import { describe, expect, it } from "vitest";
import { buildCalendar, foldLine, icsEscape } from "../events/ics";
import type { PublicEvent } from "../events/types";

const base: PublicEvent = {
  id: "0123456789abcdef", name: "Code Meets Animation", start: "2026-11-10T16:00:00.000Z", end: null,
  all_day: true, date: "2026-11-11", region: "kv", place_tag: null, topic: "design", kind: "event",
  location: "Petaling Jaya", url: "https://luma.com/cwe18vhn", organizer: "SwiftLah!", price: null, image: null,
};
const NOW = Date.parse("2026-11-07T10:52:00Z");

describe("ics", () => {
  it("escapes text values", () => {
    expect(icsEscape("a;b,c\\d\ne")).toBe("a\\;b\\,c\\\\d\\ne");
  });

  it("folds long lines at 75 octets", () => {
    const folded = foldLine(`SUMMARY:${"é".repeat(60)}`);
    for (const line of folded.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(folded.split("\r\n").slice(1).every((l) => l.startsWith(" "))).toBe(true);
    expect(folded.replace(/\r\n /g, "")).toBe(`SUMMARY:${"é".repeat(60)}`);
  });

  it("writes all-day events as dates", () => {
    const cal = buildCalendar([base], NOW);
    expect(cal).toContain("DTSTART;VALUE=DATE:20261111\r\n");
    expect(cal).toContain("DTEND;VALUE=DATE:20261112\r\n");
    expect(cal).toContain("UID:0123456789abcdef@events.hong.build\r\n");
    expect(cal).toContain("DTSTAMP:20261107T105200Z\r\n");
    expect(cal.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(cal.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("gives timed events without an end three hours", () => {
    const cal = buildCalendar([{ ...base, all_day: false, start: "2026-11-11T11:00:00.000Z" }], NOW);
    expect(cal).toContain("DTSTART:20261111T110000Z\r\n");
    expect(cal).toContain("DTEND:20261111T140000Z\r\n");
  });
});
