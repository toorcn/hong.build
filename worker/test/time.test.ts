import { describe, expect, it } from "vitest";
import { localDate, parseDateText, parseIso, startOfLocalDay } from "../events/time";

describe("parseDateText", () => {
  it.each([
    ["Wednesday, 11 November 2026", "2026-11-11"],
    ["11 November 2026", "2026-11-11"],
    ["11 Nov 2026", "2026-11-11"],
    ["Wed 11 Nov. 2026", "2026-11-11"],
    ["Nov 11, 2026", "2026-11-11"],
    ["November 11 2026", "2026-11-11"],
    ["2026-11-11", "2026-11-11"],
    ["  saturday,  7   november   2026 ", "2026-11-07"],
    ["1 Sept 2026", "2026-09-01"],
  ])("reads %j", (input, expected) => {
    expect(parseDateText(input)).toBe(expected);
  });

  it.each(["32 November 2026", "Smarch 3 2026", "next tuesday", "11/11/2026", "Ma 3 2026", ""])(
    "rejects %j",
    (input) => {
      expect(parseDateText(input)).toBeNull();
    },
  );
});

describe("parseIso", () => {
  it("honours an explicit offset", () => {
    expect(parseIso("2026-11-11T19:00:00+08:00")).toBe(Date.parse("2026-11-11T11:00:00Z") / 1000);
    expect(parseIso("2026-11-11T11:00:00Z")).toBe(Date.parse("2026-11-11T11:00:00Z") / 1000);
    expect(parseIso("2026-11-11T19:00:00+0800")).toBe(Date.parse("2026-11-11T11:00:00Z") / 1000);
  });

  it("treats a time without an offset as Malaysia time", () => {
    expect(parseIso("2026-11-11T19:00")).toBe(Date.parse("2026-11-11T11:00:00Z") / 1000);
  });

  it("rejects things that are not ISO date-times", () => {
    expect(parseIso("tomorrow 7pm")).toBeNull();
    expect(parseIso("2026-11-11")).toBeNull();
  });
});

describe("local day helpers", () => {
  it("rolls over at midnight Malaysia time", () => {
    expect(localDate(Date.parse("2026-11-07T15:59:59Z") / 1000)).toBe("2026-11-07");
    expect(localDate(Date.parse("2026-11-07T16:00:00Z") / 1000)).toBe("2026-11-08");
  });

  it("finds the start of a local day", () => {
    expect(startOfLocalDay("2026-11-11")).toBe(Date.parse("2026-11-10T16:00:00Z") / 1000);
  });
});
