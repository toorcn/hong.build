import { describe, expect, it } from "vitest";
import { ev, ingest, makeEnv, NOW_S, type TestEnv } from "./helpers/events";

const rows = (env: ReturnType<typeof makeEnv>) =>
  env.DB.raw.prepare("SELECT id, name, removed FROM events ORDER BY name").all() as {
    id: string; name: string; removed: number;
  }[];
const lastLog = (env: ReturnType<typeof makeEnv>) =>
  env.DB.raw.prepare("SELECT * FROM event_ingests ORDER BY id DESC LIMIT 1").get() as Record<string, unknown>;

describe("POST /api/events/ingest", () => {
  it("rejects a wrong or unset token", async () => {
    const env = makeEnv();
    expect((await ingest(env, { events: [ev(1)] }, { token: "nope" })).status).toBe(401);
    const noToken = { ...env, EVENTS_INGEST_TOKEN: undefined };
    expect((await ingest(noToken, { events: [ev(1)] })).status).toBe(401);
    expect(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM event_ingests").get()).toEqual({ n: 0 });
  });

  it("rejects bodies that are not a usable payload, and logs them", async () => {
    const env = makeEnv();
    expect(await ingest(env, null, { raw: "{oops" })).toEqual({ status: 400, body: { error: "body is not valid JSON" } });
    expect(await ingest(env, { items: [] })).toEqual({ status: 400, body: { error: "body.events must be an array" } });
    expect(lastLog(env).status).toBe("invalid");
  });

  it("rejects more than 1000 events", async () => {
    const env = makeEnv();
    const events = Array.from({ length: 1001 }, (_, i) => ev(i));
    expect((await ingest(env, { events })).status).toBe(413);
  });

  it("adds events and logs the push", async () => {
    const env = makeEnv();
    const res = await ingest(env, { source: "openclaw", events: [ev(1), ev(2), ev(3)] });
    expect(res).toEqual({
      status: 200,
      body: { dry_run: false, received: 3, added: 3, updated: 0, removed: 0, rejected: [], warnings: [] },
    });
    expect(rows(env)).toHaveLength(3);
    expect(lastLog(env)).toMatchObject({ status: "ok", source: "openclaw", received: 3, added: 3 });
  });

  it("is idempotent when the same list is pushed again", async () => {
    const env = makeEnv();
    await ingest(env, { events: [ev(1), ev(2), ev(3)] });
    const res = await ingest(env, { events: [ev(1), ev(2), ev(3)] });
    expect(res.body).toMatchObject({ added: 0, updated: 3, removed: 0 });
    expect(rows(env)).toHaveLength(3);
  });

  it("hides upcoming events that drop out of the list", async () => {
    const env = makeEnv();
    await ingest(env, { events: [1, 2, 3, 4, 5].map((n) => ev(n)) });
    const res = await ingest(env, { events: [1, 2, 3, 4].map((n) => ev(n)) });
    expect(res.body).toMatchObject({ removed: 1 });
    expect(rows(env).find((r) => r.name === "Event 5")?.removed).toBe(1);
  });

  it("brings a hidden event back when it reappears", async () => {
    const env = makeEnv();
    await ingest(env, { events: [1, 2, 3, 4, 5].map((n) => ev(n)) });
    await ingest(env, { events: [1, 2, 3, 4].map((n) => ev(n)) });
    expect(rows(env).find((r) => r.name === "Event 5")?.removed).toBe(1);
    await ingest(env, { events: [1, 2, 3, 4, 5].map((n) => ev(n)) });
    expect(rows(env).every((r) => r.removed === 0)).toBe(true);
  });

  it("refuses a push that would hide more than half the timetable", async () => {
    const env = makeEnv();
    await ingest(env, { events: [1, 2, 3, 4, 5, 6].map((n) => ev(n)) });
    const res = await ingest(env, { events: [ev(1), ev(2)] });
    expect(res).toEqual({ status: 409, body: { error: "shrink_guard", current: 6, accepted: 2 } });
    expect(rows(env).every((r) => r.removed === 0)).toBe(true);
    expect(lastLog(env).status).toBe("shrink_guard");

    const forced = await ingest(env, { allow_shrink: true, events: [ev(1), ev(2)] });
    expect(forced.body).toMatchObject({ removed: 4 });
  });

  it("refuses an empty push", async () => {
    const env = makeEnv();
    expect((await ingest(env, { events: [] })).status).toBe(409);
  });

  it("reports without writing on a dry run", async () => {
    const env = makeEnv();
    const res = await ingest(env, { dry_run: true, events: [ev(1), ev(2)] });
    expect(res.body).toMatchObject({ dry_run: true, added: 2 });
    expect(rows(env)).toHaveLength(0);
    expect(lastLog(env)).toMatchObject({ status: "dry_run", dry_run: 1 });
  });

  it("accepts the good events and explains the bad ones", async () => {
    const env = makeEnv();
    const res = await ingest(env, {
      events: [ev(1), ev(2, { signup_url: "http://luma.com/e2" }), ev(3, { location_text: "Atlantis" })],
    });
    expect(res.body.rejected).toEqual([
      { index: 1, signup_url: "http://luma.com/e2", reason: "signup_url must be an https URL" },
    ]);
    expect(res.body.warnings).toEqual([
      { index: 2, message: 'location "Atlantis" not recognised; placed on the Klang Valley line (send "region" to override)' },
    ]);
    expect(rows(env)).toHaveLength(2);
  });

  it("keeps the last copy of a duplicated event", async () => {
    const env = makeEnv();
    const res = await ingest(env, { events: [ev(1), ev(1, { name: "Event 1 (renamed)" })] });
    expect(res.body.warnings).toEqual([{ index: 1, message: "duplicate of event at index 0; this one was kept" }]);
    expect(rows(env).map((r) => r.name)).toEqual(["Event 1 (renamed)"]);
  });

  it("prunes events that ended more than 30 days ago", async () => {
    const env = makeEnv();
    env.DB.raw
      .prepare(
        `INSERT INTO events (id, name, start_at, all_day, date_local, region, topic, location_text, signup_url, raw, first_seen, last_seen)
         VALUES ('old0000000000000', 'Old', ?, 1, '2026-10-01', 'kv', 'community', 'KL', 'https://luma.com/old', '{}', 0, 0)`,
      )
      .run(NOW_S - 31 * 86400);
    await ingest(env, { events: [ev(1)] });
    expect(rows(env).map((r) => r.name)).toEqual(["Event 1"]);
  });

  it("prunes by end time, so a long event still running is kept", async () => {
    const env = makeEnv();
    const insert = env.DB.raw.prepare(
      `INSERT INTO events (id, name, start_at, end_at, all_day, date_local, region, topic, location_text, signup_url, raw, first_seen, last_seen)
       VALUES (?, ?, ?, ?, 0, '2026-10-01', 'kv', 'community', 'KL', ?, '{}', 0, 0)`,
    );
    insert.run("long0000000000000", "Long running", NOW_S - 31 * 86400, NOW_S + 86400, "https://luma.com/long");
    insert.run("recent0000000000", "Recent", NOW_S - 10 * 86400, null, "https://luma.com/recent");
    await ingest(env, { events: [ev(1)] });
    expect(rows(env).map((r) => r.name)).toEqual(["Event 1", "Long running", "Recent"]);
  });

  it("publishes a push all-or-nothing", async () => {
    const env = makeEnv();
    const real = env.DB;
    // The same D1 look-alike, except every batch carries one statement that fails when it runs.
    const failing = {
      prepare: (sql: string) => real.prepare(sql),
      batch: (stmts: Parameters<typeof real.batch>[0]) =>
        real.batch([...stmts, real.prepare("INSERT INTO no_such_table (x) VALUES (1)")]),
    };
    const broken = { ...env, DB: failing } as unknown as TestEnv;
    await expect(ingest(broken, { events: [ev(1), ev(2)] })).rejects.toThrow();
    expect(rows(env)).toHaveLength(0);
    expect(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM event_ingests WHERE status = 'ok'").get()).toEqual({ n: 0 });
  });
});

describe("batch size", () => {
  it("lands a 1000-event push in at most 6 statements", async () => {
    const env = makeEnv();
    const sizes: number[] = [];
    const batch = env.DB.batch.bind(env.DB);
    env.DB.batch = (async (statements: unknown[]) => {
      sizes.push(statements.length);
      return batch(statements as never);
    }) as typeof env.DB.batch;
    const events = Array.from({ length: 1000 }, (_, i) => ev(i));
    const res = await ingest(env, { events });
    expect(res.status).toBe(200);
    expect(rows(env)).toHaveLength(1000);
    // second push removes some and updates the rest
    await ingest(env, { events: events.slice(0, 600) });
    expect(rows(env).filter((r) => r.removed === 1)).toHaveLength(400);
    expect(sizes).toHaveLength(2);
    for (const n of sizes) expect(n).toBeLessThanOrEqual(6);
  });
});
