import type { EventsEnv } from "./env";
import { buildCalendar } from "./ics";
import { DAY_S, localDate, startOfLocalDay } from "./time";
import type { EventsResponse, Kind, PublicEvent, Region, Topic } from "./types";

interface EventRow {
  id: string; name: string; start_at: number; end_at: number | null; all_day: number; date_local: string;
  region: Region; place_tag: string | null; topic: Topic; kind: Kind; location_text: string;
  signup_url: string; organizer: string | null; price: string | null; image_url: string | null;
}

const COLUMNS =
  "id, name, start_at, end_at, all_day, date_local, region, place_tag, topic, kind, location_text, signup_url, organizer, price, image_url";

function rowToPublic(r: EventRow): PublicEvent {
  return {
    id: r.id, name: r.name, start: new Date(r.start_at * 1000).toISOString(),
    end: r.end_at === null ? null : new Date(r.end_at * 1000).toISOString(), all_day: r.all_day === 1,
    date: r.date_local, region: r.region, place_tag: r.place_tag, topic: r.topic, kind: r.kind,
    location: r.location_text, url: r.signup_url, organizer: r.organizer, price: r.price, image: r.image_url,
  };
}

/** Visible events starting in [fromS, toS), plus ones that started earlier and are still running. */
async function listEvents(db: D1Database, fromS: number, toS: number): Promise<PublicEvent[]> {
  const { results } = await db
    .prepare(
      `SELECT ${COLUMNS} FROM events
       WHERE removed = 0 AND start_at < ? AND (start_at >= ? OR COALESCE(end_at, CASE WHEN all_day = 1 THEN start_at + 86400 ELSE start_at + 10800 END) > ?)
       ORDER BY start_at, name`,
    )
    .bind(toS, fromS, fromS)
    .all<EventRow>();
  return results.map(rowToPublic);
}

const todayStartS = (nowMs: number) => startOfLocalDay(localDate(Math.floor(nowMs / 1000)));

function calendarResponse(body: string, filename: string, attachment: boolean) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `${attachment ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}

export async function handleEventsApi(env: EventsEnv, nowMs = Date.now()): Promise<Response> {
  const today = todayStartS(nowMs);
  const events = await listEvents(env.DB, today, today + 181 * DAY_S);
  const last = await env.DB.prepare("SELECT MAX(at) AS at FROM event_ingests WHERE status = 'ok'").first<{ at: number | null }>();
  const body: EventsResponse = {
    generated_at: new Date(nowMs).toISOString(),
    last_ingest_at: last?.at ? new Date(last.at).toISOString() : null,
    tz: "Asia/Kuala_Lumpur",
    events,
  };
  return Response.json(body, {
    headers: { "Cache-Control": "public, max-age=60", "Access-Control-Allow-Origin": "*" },
  });
}

export async function handleFeedIcs(env: EventsEnv, nowMs = Date.now()): Promise<Response> {
  const today = todayStartS(nowMs);
  const events = await listEvents(env.DB, today - 30 * DAY_S, today + 181 * DAY_S);
  return calendarResponse(buildCalendar(events, nowMs), "builder-line.ics", false);
}

export async function handleEventIcs(id: string, env: EventsEnv, nowMs = Date.now()): Promise<Response> {
  const row = await env.DB.prepare(`SELECT ${COLUMNS} FROM events WHERE id = ? AND removed = 0`).bind(id).first<EventRow>();
  if (!row) return new Response("That event has left the line.", { status: 404 });
  return calendarResponse(buildCalendar([rowToPublic(row)], nowMs, row.name), `${id}.ics`, true);
}

const MAX_PLAN_IDS = 200;

export async function handlePlanIcs(url: URL, env: EventsEnv, nowMs = Date.now()): Promise<Response> {
  const ids = (url.searchParams.get("ids") ?? "").split(",").filter((id) => /^[0-9a-f]{16}$/.test(id));
  if (ids.length === 0) return new Response("No valid event ids.", { status: 400 });
  if (ids.length > MAX_PLAN_IDS) return new Response(`At most ${MAX_PLAN_IDS} events per file.`, { status: 400 });
  const { results } = await env.DB.prepare(
    `SELECT ${COLUMNS} FROM events WHERE removed = 0 AND id IN (SELECT value FROM json_each(?)) ORDER BY start_at`,
  )
    .bind(JSON.stringify(ids))
    .all<EventRow>();
  return calendarResponse(buildCalendar(results.map(rowToPublic), nowMs, "My Journey — Builder Line"), "my-journey.ics", true);
}
