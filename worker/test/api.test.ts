import { describe, expect, it } from "vitest";
import { handleEventIcs, handleEventsApi, handleFeedIcs, handlePlanIcs } from "../events/api";
import type { EventsResponse } from "../events/types";
import { ev, ingest, makeEnv, NOW } from "./helpers/events";

async function seeded() {
  const env = makeEnv();
  await ingest(env, {
    events: [
      ev(1),
      ev(2, { date_text: "1 June 2027" }),
      ev(3, { start: "2026-11-08T19:00:00+08:00", location_text: "Singapore" }),
    ],
  });
  return env;
}

describe("GET /api/events", () => {
  it("returns visible events from today to 180 days ahead, in start order", async () => {
    const env = await seeded();
    const res = await handleEventsApi(env, NOW);
    expect(res.headers.get("cache-control")).toBe("public, max-age=60");
    const body = (await res.json()) as EventsResponse;
    expect(body.tz).toBe("Asia/Kuala_Lumpur");
    expect(body.last_ingest_at).toBe(new Date(NOW).toISOString());
    expect(body.events.map((e) => e.name)).toEqual(["Event 3", "Event 1"]);
    expect(body.events[0]).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{16}$/), name: "Event 3", start: "2026-11-08T11:00:00.000Z", end: null,
      all_day: false, date: "2026-11-08", region: "sg", place_tag: "SG", topic: "community", kind: "event",
      location: "Singapore", url: "https://luma.com/e3", organizer: null, price: null, image: null,
    });
  });

  it("leaves out hidden events", async () => {
    const env = await seeded();
    await ingest(env, { events: [ev(1), ev(2, { date_text: "1 June 2027" })] });
    const body = (await (await handleEventsApi(env, NOW)).json()) as EventsResponse;
    expect(body.events.map((e) => e.name)).toEqual(["Event 1"]);
  });
});

describe("running events", () => {
  it("keeps a timed event with no end that started before midnight, until the day after", async () => {
    const env = makeEnv();
    // Fri 6 Nov 23:30 MYT (15:30Z)
    await ingest(env, { events: [ev(1, { start: "2026-11-06T23:30:00+08:00" }), ev(2)] });
    const names = async (iso: string) =>
      ((await (await handleEventsApi(env, Date.parse(iso))).json()) as EventsResponse).events.map((e) => e.name);
    // Sat 00:30 MYT: still running for the client's 3 h window
    expect(await names("2026-11-06T16:30:00Z")).toContain("Event 1");
    // Sun 00:30 MYT: long over
    expect(await names("2026-11-07T16:30:00Z")).not.toContain("Event 1");
  });
});

describe("calendar endpoints", () => {
  it("serves the subscription feed", async () => {
    const env = await seeded();
    const res = await handleFeedIcs(env, NOW);
    expect(res.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
    const text = await res.text();
    expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });

  it("serves one event as a download, or 404", async () => {
    const env = await seeded();
    const body = (await (await handleEventsApi(env, NOW)).json()) as EventsResponse;
    const id = body.events[0]!.id;
    const res = await handleEventIcs(id, env, NOW);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toBe(`attachment; filename="${id}.ics"`);
    expect(await res.text()).toContain(`UID:${id}@events.hong.build`);
    expect((await handleEventIcs("ffffffffffffffff", env, NOW)).status).toBe(404);
  });

  it("bundles kept tickets into one file", async () => {
    const env = await seeded();
    const body = (await (await handleEventsApi(env, NOW)).json()) as EventsResponse;
    const ids = body.events.map((e) => e.id).join(",");
    const res = await handlePlanIcs(new URL(`https://events.hong.build/api/events/plan.ics?ids=${ids},nonsense`), env, NOW);
    expect(res.status).toBe(200);
    expect((await res.text()).match(/BEGIN:VEVENT/g)).toHaveLength(2);
    const bad = await handlePlanIcs(new URL("https://events.hong.build/api/events/plan.ics?ids=nope"), env, NOW);
    expect(bad.status).toBe(400);
  });

  it("accepts up to 200 ids and rejects more with 400", async () => {
    const env = await seeded();
    const body = (await (await handleEventsApi(env, NOW)).json()) as EventsResponse;
    const real = body.events.map((e) => e.id);
    const filler = Array.from({ length: 198 }, (_, i) => i.toString(16).padStart(16, "0"));
    const ok = await handlePlanIcs(new URL(`https://events.hong.build/api/events/plan.ics?ids=${[...real, ...filler].join(",")}`), env, NOW);
    expect(ok.status).toBe(200);
    expect((await ok.text()).match(/BEGIN:VEVENT/g)).toHaveLength(2);
    const more = Array.from({ length: 201 }, (_, i) => i.toString(16).padStart(16, "0"));
    const bad = await handlePlanIcs(new URL(`https://events.hong.build/api/events/plan.ics?ids=${more.join(",")}`), env, NOW);
    expect(bad.status).toBe(400);
  });
});
