const OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const title = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export const mytDateKey = (ms: number) => new Date(ms + OFFSET_MS).toISOString().slice(0, 10);

function parts(key: string) {
  const d = new Date(`${key}T00:00:00Z`);
  return { wd: WEEKDAYS[d.getUTCDay()]!, day: d.getUTCDate(), mo: MONTHS[d.getUTCMonth()]! };
}

export function dayLabel(key: string): string {
  const p = parts(key);
  return `${p.wd} ${p.day} ${p.mo}`;
}

export function dayShort(key: string): string {
  const p = parts(key);
  return `${title(p.wd)} ${p.day} ${title(p.mo)}`;
}

export const dayDiff = (fromKey: string, toKey: string) =>
  Math.round((Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) / DAY_MS);

export const timeLabel = (iso: string) => new Date(Date.parse(iso) + OFFSET_MS).toISOString().slice(11, 16);

export const endOfDayMs = (key: string) => Date.parse(`${key}T00:00:00Z`) - OFFSET_MS + DAY_MS;

export function relativeHint(key: string, todayKey: string): string {
  const n = dayDiff(todayKey, key);
  return n === 1 ? "tomorrow" : `in ${n} days`;
}
