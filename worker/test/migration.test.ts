import { describe, expect, it } from "vitest";
import { createTestDb } from "./helpers/d1";

describe("migrations", () => {
  it("creates the events and event_ingests tables alongside the Q&A tables", async () => {
    const db = createTestDb();
    const { results } = await db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all<{ name: string }>();
    expect(results.map((r) => r.name)).toEqual(
      expect.arrayContaining(["events", "event_ingests", "qa_votes", "qa_rate"]),
    );
  });

  it("indexes visible events by start time", async () => {
    const db = createTestDb();
    const row = await db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'events_visible'")
      .first<{ name: string }>();
    expect(row?.name).toBe("events_visible");
  });
});
