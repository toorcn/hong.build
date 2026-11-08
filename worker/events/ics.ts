import type { PublicEvent } from "./types";

const CRLF = "\r\n";
const HOURS_3 = 3 * 60 * 60 * 1000;

export function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** RFC 5545 §3.1: lines longer than 75 octets continue on the next line after a space. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const n = encoder.encode(ch).length;
    if (bytes + n > limit) {
      out.push(current);
      current = ch;
      bytes = n;
      limit = 74; // the leading space counts
    } else {
      current += ch;
      bytes += n;
    }
  }
  out.push(current);
  return out.join(`${CRLF} `);
}

const utc = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const compactDate = (date: string) => date.replace(/-/g, "");
function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function buildCalendar(events: PublicEvent[], nowMs: number, name = "Builder Line — KL builder events"): string {
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//hong.build//Builder Line//EN", "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH", `X-WR-CALNAME:${icsEscape(name)}`, "X-WR-TIMEZONE:Asia/Kuala_Lumpur",
  ];
  for (const e of events) {
    lines.push("BEGIN:VEVENT", `UID:${e.id}@events.hong.build`, `DTSTAMP:${utc(nowMs)}`);
    if (e.all_day) {
      lines.push(`DTSTART;VALUE=DATE:${compactDate(e.date)}`, `DTEND;VALUE=DATE:${compactDate(nextDay(e.date))}`);
    } else {
      const start = Date.parse(e.start);
      const end = e.end ? Date.parse(e.end) : start + HOURS_3;
      lines.push(`DTSTART:${utc(start)}`, `DTEND:${utc(end)}`);
    }
    const description = [e.organizer ? `Hosted by ${e.organizer}` : null, `Sign up: ${e.url}`, "Listed on events.hong.build"]
      .filter(Boolean)
      .join("\n");
    lines.push(
      `SUMMARY:${icsEscape(e.name)}`, `LOCATION:${icsEscape(e.location)}`, `URL:${e.url}`,
      `DESCRIPTION:${icsEscape(description)}`, "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join(CRLF) + CRLF;
}
