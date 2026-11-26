/** Malaysia (and Singapore) are UTC+8 all year. */
export const MYT_OFFSET_S = 8 * 60 * 60;
export const DAY_S = 24 * 60 * 60;

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function monthIndex(word: string): number | null {
  const w = word.toLowerCase().replace(/\.$/, "");
  if (w.length < 3) return null;
  const i = MONTH_NAMES.findIndex((m) => m.startsWith(w));
  return i === -1 ? null : i + 1;
}

function isoDate(y: number, m: number, d: number): string | null {
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return t.toISOString().slice(0, 10);
}

/** Reads OpenClaw's human date ("Wednesday, 11 November 2026") into YYYY-MM-DD, or null. */
export function parseDateText(text: string): string | null {
  const s = text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?,? /i, "");
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return isoDate(Number(m[1]), Number(m[2]), Number(m[3]));
  m = /^(\d{1,2}) ([a-z]+\.?),? (\d{4})$/i.exec(s);
  if (m) {
    const month = monthIndex(m[2]!);
    return month ? isoDate(Number(m[3]), month, Number(m[1])) : null;
  }
  m = /^([a-z]+\.?) (\d{1,2}),? (\d{4})$/i.exec(s);
  if (m) {
    const month = monthIndex(m[1]!);
    return month ? isoDate(Number(m[3]), month, Number(m[2])) : null;
  }
  return null;
}

/** ISO 8601 date-time → unix seconds. A missing offset means Malaysia time. */
export function parseIso(text: string): number | null {
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(:\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(text.trim());
  if (!m) return null;
  const [y, mo, d] = m[1]!.split("-").map(Number) as [number, number, number];
  if (isoDate(y, mo, d) === null) return null;
  const [hh, mm] = m[2]!.split(":").map(Number) as [number, number];
  const ss = m[3] ? Number(m[3].slice(1, 3)) : 0;
  if (hh > 23 || mm > 59 || ss > 59) return null;
  let zone = m[4] ?? "+08:00";
  if (/^[+-]\d{4}$/.test(zone)) zone = `${zone.slice(0, 3)}:${zone.slice(3)}`;
  const ms = Date.parse(`${m[1]}T${m[2]}${m[3] ?? ":00"}${zone}`);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

/** YYYY-MM-DD of a unix time, in Malaysia. */
export function localDate(unixSeconds: number): string {
  return new Date((unixSeconds + MYT_OFFSET_S) * 1000).toISOString().slice(0, 10);
}

/** Unix seconds of 00:00 Malaysia time on a local date. */
export function startOfLocalDay(dateLocal: string): number {
  return Date.parse(`${dateLocal}T00:00:00Z`) / 1000 - MYT_OFFSET_S;
}
