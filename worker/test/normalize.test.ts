import { describe, expect, it } from "vitest";
import { normalizeEvent } from "../events/normalize";
import { startOfLocalDay } from "../events/time";

const NOW_S = Date.parse("2026-11-07T10:52:00Z") / 1000;
const sample = {
  name: "Code Meets Animation - SwiftLah! Community x LottieFiles",
  date_text: "Wednesday, 11 November 2026",
  location_text: "Petaling Jaya",
  signup_url: "https://luma.com/cwe18vhn",
};

async function ok(raw: unknown) {
  const res = await normalizeEvent(raw, NOW_S);
  if (!res.ok) throw new Error(`expected ok, got: ${res.reason}`);
  return res;
}
async function reason(raw: unknown) {
  const res = await normalizeEvent(raw, NOW_S);
  if (res.ok) throw new Error("expected a rejection");
  return res.reason;
}

describe("normalizeEvent", () => {
  it("accepts OpenClaw's current four-field shape as an all-day event", async () => {
    const { event, warnings } = await ok(sample);
    expect(warnings).toEqual([]);
    expect(event).toMatchObject({
      name: sample.name,
      allDay: true,
      dateLocal: "2026-11-11",
      startAt: startOfLocalDay("2026-11-11"),
      endAt: null,
      region: "kv",
      placeTag: null,
      topic: "design",
      kind: "event",
      locationText: "Petaling Jaya",
      signupUrl: "https://luma.com/cwe18vhn",
      organizer: null,
      price: null,
      imageUrl: null,
    });
    expect(event.id).toMatch(/^[0-9a-f]{16}$/);
    expect(JSON.parse(event.raw)).toEqual(sample);
  });

  it("uses start/end when given", async () => {
    const { event } = await ok({ ...sample, start: "2026-11-11T19:00:00+08:00", end: "2026-11-11T22:00:00+08:00" });
    expect(event.allDay).toBe(false);
    expect(event.startAt).toBe(Date.parse("2026-11-11T11:00:00Z") / 1000);
    expect(event.endAt).toBe(Date.parse("2026-11-11T14:00:00Z") / 1000);
    expect(event.dateLocal).toBe("2026-11-11");
  });

  it("keeps optional extras and explicit choices", async () => {
    const { event } = await ok({
      ...sample, organizer: "SwiftLah! × LottieFiles", price: "Free", kind: "deadline",
      topic: "ai", region: "sg", image_url: "https://images.lu.ma/cover.png",
    });
    expect(event).toMatchObject({
      organizer: "SwiftLah! × LottieFiles", price: "Free", kind: "deadline", topic: "ai",
      region: "sg", placeTag: "SG", imageUrl: "https://images.lu.ma/cover.png",
    });
  });

  it.each([
    ["not an object", "event must be an object", "nope"],
    ["missing name", "missing name", { ...sample, name: " " }],
    ["long name", "name is longer than 200 characters", { ...sample, name: "x".repeat(201) }],
    ["missing location", "missing location_text", { ...sample, location_text: undefined }],
    ["missing url", "missing signup_url", { ...sample, signup_url: undefined }],
    ["http url", "signup_url must be an https URL", { ...sample, signup_url: "http://luma.com/x" }],
    ["unreadable date", 'date_text not understood: "next week"', { ...sample, date_text: "next week" }],
    ["no date at all", "missing date_text or start", { ...sample, date_text: undefined }],
    ["bad start", "start is not a valid ISO 8601 date-time", { ...sample, start: "7pm" }],
    ["past", "date is in the past", { ...sample, date_text: "1 November 2026" }],
    ["far future", "date is more than 365 days ahead", { ...sample, date_text: "1 January 2028" }],
    ["end before start", "end is before start", { ...sample, start: "2026-11-11T19:00", end: "2026-11-11T18:00" }],
  ])("rejects %s", async (_label, expected, raw) => {
    expect(await reason(raw)).toBe(expected);
  });

  it("warns instead of rejecting for fixable extras", async () => {
    const { event, warnings } = await ok({
      ...sample, location_text: "Somewhere Mysterious", image_url: "http://x.com/a.png",
      end: "later", region: "mars", topic: "cooking", kind: "party",
    });
    expect(event.region).toBe("kv");
    expect(event.imageUrl).toBeNull();
    expect(event.endAt).toBeNull();
    expect(warnings).toEqual([
      "end ignored: not a valid ISO 8601 date-time",
      'region "mars" ignored: use kv, sg, online or other',
      'location "Somewhere Mysterious" not recognised; placed on the Klang Valley line (send "region" to override)',
      'topic "cooking" ignored: use ai, founder, hack, design, hardware or community',
      'kind "party" ignored: use event or deadline',
      "image_url dropped: must be https",
    ]);
  });
});
