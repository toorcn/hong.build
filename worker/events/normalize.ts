import { eventId, normalizeUrl } from "./id";
import { isRegion, resolvePlace } from "./places";
import { DAY_S, localDate, parseDateText, parseIso, startOfLocalDay } from "./time";
import { isTopic, resolveTopic } from "./topics";
import type { NormalizedEvent, Region, Topic } from "./types";

export type NormalizeResult =
  | { ok: true; event: NormalizedEvent; warnings: string[] }
  | { ok: false; reason: string };

const fail = (reason: string): NormalizeResult => ({ ok: false, reason });
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const short = (v: unknown): string | null => str(v)?.slice(0, 200) ?? null;

export async function normalizeEvent(raw: unknown, nowS: number): Promise<NormalizeResult> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail("event must be an object");
  const r = raw as Record<string, unknown>;
  const warnings: string[] = [];

  const name = str(r.name);
  if (!name) return fail("missing name");
  if (name.length > 200) return fail("name is longer than 200 characters");
  const location = str(r.location_text);
  if (!location) return fail("missing location_text");
  const rawUrl = str(r.signup_url);
  if (!rawUrl) return fail("missing signup_url");
  const signupUrl = normalizeUrl(rawUrl);
  if (!signupUrl) return fail("signup_url must be an https URL");

  let startAt: number;
  let allDay: boolean;
  const start = str(r.start);
  const dateText = str(r.date_text);
  if (start) {
    const t = parseIso(start);
    if (t === null) return fail("start is not a valid ISO 8601 date-time");
    startAt = t;
    allDay = false;
  } else if (dateText) {
    const d = parseDateText(dateText);
    if (!d) return fail(`date_text not understood: "${dateText}"`);
    startAt = startOfLocalDay(d);
    allDay = true;
  } else {
    return fail("missing date_text or start");
  }

  let endAt: number | null = null;
  const end = str(r.end);
  if (end) {
    const t = parseIso(end);
    if (t === null) warnings.push("end ignored: not a valid ISO 8601 date-time");
    else if (t < startAt) return fail("end is before start");
    else endAt = t;
  }

  if ((endAt ?? startAt) < nowS - DAY_S) return fail("date is in the past");
  if (startAt > nowS + 365 * DAY_S) return fail("date is more than 365 days ahead");

  let region: Region | undefined;
  if (r.region !== undefined) {
    if (isRegion(r.region)) region = r.region;
    else warnings.push(`region "${String(r.region)}" ignored: use kv, sg, online or other`);
  }
  const place = resolvePlace(location, region);
  if (!place.known) {
    warnings.push(`location "${location}" not recognised; placed on the Klang Valley line (send "region" to override)`);
  }

  let topic: Topic | undefined;
  if (r.topic !== undefined) {
    if (isTopic(r.topic)) topic = r.topic;
    else warnings.push(`topic "${String(r.topic)}" ignored: use ai, founder, hack, design, hardware or community`);
  }

  if (r.kind !== undefined && r.kind !== "event" && r.kind !== "deadline") {
    warnings.push(`kind "${String(r.kind)}" ignored: use event or deadline`);
  }

  let imageUrl: string | null = null;
  const rawImage = str(r.image_url);
  if (rawImage) {
    imageUrl = normalizeUrl(rawImage);
    if (!imageUrl) warnings.push("image_url dropped: must be https");
  }

  return {
    ok: true,
    warnings,
    event: {
      id: await eventId(signupUrl),
      name,
      startAt,
      endAt,
      allDay,
      dateLocal: localDate(startAt),
      region: place.region,
      placeTag: place.placeTag,
      topic: resolveTopic(name, topic),
      kind: r.kind === "deadline" ? "deadline" : "event",
      locationText: location,
      signupUrl,
      organizer: short(r.organizer),
      price: short(r.price),
      imageUrl,
      raw: JSON.stringify(raw),
    },
  };
}
