import type { EventsEnv } from "./env";
import { normalizeEvent } from "./normalize";
import { DAY_S, localDate, startOfLocalDay } from "./time";
import type { NormalizedEvent } from "./types";

const MAX_BYTES = 1_000_000;
const MAX_EVENTS = 1000;
const PRUNE_AFTER_S = 30 * DAY_S;

export interface IngestReport {
  dry_run: boolean;
  received: number;
  added: number;
  updated: number;
  removed: number;
  rejected: { index: number; signup_url: string | null; reason: string }[];
  warnings: { index: number; message: string }[];
}

type LogStatus = "ok" | "dry_run" | "shrink_guard" | "invalid";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

/** Compares digests so the time taken doesn't reveal how much of the token matched. */
async function authorized(request: Request, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  const [a, b] = await Promise.all([sha256(given), sha256(token)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0 && given.length > 0;
}

type LogEntry = {
  at: number;
  source: string | null;
  status: LogStatus;
  dryRun: boolean;
  counts?: Omit<IngestReport, "dry_run" | "rejected" | "warnings"> & { rejected: number };
  detail: unknown;
};

/** The ingest-log INSERT as a statement, so a push can include it in its atomic batch. */
function ingestLog(env: EventsEnv, entry: LogEntry): D1PreparedStatement {
  const c = entry.counts ?? { received: 0, added: 0, updated: 0, removed: 0, rejected: 0 };
  return env.DB.prepare(
    `INSERT INTO event_ingests (at, source, status, dry_run, received, added, updated, removed, rejected, detail)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(entry.at, entry.source, entry.status, entry.dryRun ? 1 : 0, c.received, c.added, c.updated, c.removed, c.rejected, JSON.stringify(entry.detail));
}

async function invalid(env: EventsEnv, nowMs: number, status: number, error: string, source: string | null = null) {
  await ingestLog(env, { at: nowMs, source, status: "invalid", dryRun: false, detail: { error } }).run();
  return json({ error }, status);
}

/** Every upsert in ONE statement over a JSON parameter: D1 counts each statement against its per-invocation query limit. */
function upsertAll(db: D1Database, events: NormalizedEvent[], nowMs: number) {
  const rows = events.map((e) => ({
    id: e.id, name: e.name, start_at: e.startAt, end_at: e.endAt, all_day: e.allDay ? 1 : 0, date_local: e.dateLocal,
    region: e.region, place_tag: e.placeTag, topic: e.topic, kind: e.kind, location_text: e.locationText,
    signup_url: e.signupUrl, organizer: e.organizer, price: e.price, image_url: e.imageUrl, raw: e.raw,
  }));
  const col = (name: string) => `json_extract(value, '$.${name}')`;
  return db
    .prepare(
      `INSERT INTO events (id, name, start_at, end_at, all_day, date_local, region, place_tag, topic, kind,
         location_text, signup_url, organizer, price, image_url, raw, first_seen, last_seen, removed)
       SELECT ${["id", "name", "start_at", "end_at", "all_day", "date_local", "region", "place_tag", "topic", "kind",
         "location_text", "signup_url", "organizer", "price", "image_url", "raw"].map(col).join(", ")}, ?, ?, 0
       FROM json_each(?) WHERE true
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, start_at = excluded.start_at, end_at = excluded.end_at,
         all_day = excluded.all_day, date_local = excluded.date_local, region = excluded.region,
         place_tag = excluded.place_tag, topic = excluded.topic, kind = excluded.kind,
         location_text = excluded.location_text, signup_url = excluded.signup_url,
         organizer = excluded.organizer, price = excluded.price, image_url = excluded.image_url,
         raw = excluded.raw, last_seen = excluded.last_seen, removed = 0`,
    )
    .bind(nowMs, nowMs, JSON.stringify(rows));
}

function signupOf(raw: unknown): string | null {
  const v = raw && typeof raw === "object" ? (raw as Record<string, unknown>).signup_url : null;
  return typeof v === "string" ? v : null;
}

export async function handleIngest(request: Request, env: EventsEnv, nowMs = Date.now()): Promise<Response> {
  if (!(await authorized(request, env.EVENTS_INGEST_TOKEN))) return json({ error: "unauthorized" }, 401);

  if (Number(request.headers.get("content-length") ?? "0") > MAX_BYTES) {
    return invalid(env, nowMs, 413, "body is larger than 1 MB");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BYTES) return invalid(env, nowMs, 413, "body is larger than 1 MB");

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return invalid(env, nowMs, 400, "body is not valid JSON");
  }
  if (!body || typeof body !== "object" || !Array.isArray((body as { events?: unknown }).events)) {
    return invalid(env, nowMs, 400, "body.events must be an array");
  }
  const b = body as { events: unknown[]; source?: unknown; dry_run?: unknown; allow_shrink?: unknown };
  const source = typeof b.source === "string" ? b.source.slice(0, 60) : null;
  if (b.events.length > MAX_EVENTS) return invalid(env, nowMs, 413, "more than 1000 events", source);

  const dryRun = b.dry_run === true;
  const nowS = Math.floor(nowMs / 1000);
  const todayStart = startOfLocalDay(localDate(nowS));

  const rejected: IngestReport["rejected"] = [];
  const warnings: IngestReport["warnings"] = [];
  const accepted = new Map<string, { index: number; event: NormalizedEvent }>();
  for (const [index, raw] of b.events.entries()) {
    const res = await normalizeEvent(raw, nowS);
    if (!res.ok) {
      rejected.push({ index, signup_url: signupOf(raw), reason: res.reason });
      continue;
    }
    for (const message of res.warnings) warnings.push({ index, message });
    const previous = accepted.get(res.event.id);
    if (previous) warnings.push({ index, message: `duplicate of event at index ${previous.index}; this one was kept` });
    accepted.set(res.event.id, { index, event: res.event });
  }
  const events = [...accepted.values()].map((a) => a.event);

  const visible = await env.DB.prepare("SELECT id FROM events WHERE removed = 0 AND start_at >= ?")
    .bind(todayStart)
    .all<{ id: string }>();
  const visibleIds = new Set(visible.results.map((r) => r.id));
  const acceptedUpcoming = events.filter((e) => e.startAt >= todayStart).length;

  const shrinking = events.length === 0 || (visibleIds.size >= 4 && acceptedUpcoming < visibleIds.size * 0.5);
  if (shrinking && b.allow_shrink !== true) {
    await ingestLog(env, {
      at: nowMs, source, status: "shrink_guard", dryRun,
      counts: { received: b.events.length, added: 0, updated: 0, removed: 0, rejected: rejected.length },
      detail: { rejected, warnings, current: visibleIds.size, accepted: acceptedUpcoming },
    }).run();
    return json({ error: "shrink_guard", current: visibleIds.size, accepted: acceptedUpcoming }, 409);
  }

  const existing = await env.DB.prepare("SELECT id FROM events").all<{ id: string }>();
  const existingIds = new Set(existing.results.map((r) => r.id));
  const added = events.filter((e) => !existingIds.has(e.id)).length;
  // Hide by id, not by timestamp, so two pushes sharing a clock reading still behave.
  const toRemove = [...visibleIds].filter((id) => !accepted.has(id));
  const removed = toRemove.length;
  const report: IngestReport = {
    dry_run: dryRun, received: b.events.length, added, updated: events.length - added, removed, rejected, warnings,
  };
  const counts = { received: report.received, added, updated: report.updated, removed, rejected: rejected.length };
  const log = ingestLog(env, {
    at: nowMs, source, status: dryRun ? "dry_run" : "ok", dryRun, counts, detail: { rejected, warnings },
  });

  if (dryRun) {
    await log.run();
    return json(report);
  }

  // One batch is one transaction on D1: the whole push lands or nothing does.
  const statements: D1PreparedStatement[] = [];
  if (events.length > 0) statements.push(upsertAll(env.DB, events, nowMs));
  if (toRemove.length > 0) {
    statements.push(
      env.DB.prepare("UPDATE events SET removed = 1 WHERE id IN (SELECT value FROM json_each(?))").bind(JSON.stringify(toRemove)),
    );
  }
  statements.push(env.DB.prepare("DELETE FROM events WHERE COALESCE(end_at, start_at) < ?").bind(nowS - PRUNE_AFTER_S));
  statements.push(log);
  await env.DB.batch(statements);
  return json(report);
}
