import { describe, expect, it } from "vitest";
import { dayDiff, dayLabel, dayShort, endOfDayMs, mytDateKey, relativeHint, timeLabel } from "../../src/lib/time";

describe("time", () => {
  it("keys days in Malaysia time", () => {
    expect(mytDateKey(Date.parse("2026-11-07T15:59:00Z"))).toBe("2026-11-07");
    expect(mytDateKey(Date.parse("2026-11-07T16:00:00Z"))).toBe("2026-11-08");
  });
  it("labels days", () => {
    expect(dayLabel("2026-11-07")).toBe("SAT 7 NOV");
    expect(dayShort("2026-11-11")).toBe("Wed 11 Nov");
  });
  it("counts and describes days between keys", () => {
    expect(dayDiff("2026-11-07", "2026-11-11")).toBe(4);
    expect(relativeHint("2026-11-08", "2026-11-07")).toBe("tomorrow");
    expect(relativeHint("2026-11-11", "2026-11-07")).toBe("in 4 days");
  });
  it("shows local clock times and day ends", () => {
    expect(timeLabel("2026-11-07T11:30:00.000Z")).toBe("19:30");
    expect(endOfDayMs("2026-11-07")).toBe(Date.parse("2026-11-07T16:00:00Z"));
  });
});
