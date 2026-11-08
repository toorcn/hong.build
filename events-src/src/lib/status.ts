import type { PublicEvent } from "../types";
import { dayDiff, endOfDayMs, mytDateKey } from "./time";

export type StatusKind = "live" | "board" | "dep" | "today" | "soon" | "closed";
export interface Status {
  label: string;
  kind: StatusKind;
  /** Whether stations show it as a chip (routine "TODAY / IN 4D" stay quiet). */
  chip: boolean;
}

const HOUR = 60 * 60 * 1000;
const soon = (days: number): Status => ({ label: days === 1 ? "TOMORROW" : `IN ${days}D`, kind: "soon", chip: false });
const TODAY: Status = { label: "TODAY", kind: "today", chip: false };
const DEPARTED: Status = { label: "DEPARTED", kind: "dep", chip: true };

export function eventStatus(e: PublicEvent, nowMs: number): Status {
  const days = dayDiff(mytDateKey(nowMs), e.date);
  if (e.kind === "deadline") {
    const closes = e.all_day ? endOfDayMs(e.date) : Date.parse(e.start);
    if (nowMs >= closes) return { label: "CLOSED", kind: "closed", chip: true };
    return { label: days <= 0 ? "CLOSES TODAY" : `CLOSES IN ${days}D`, kind: "board", chip: true };
  }
  if (e.all_day) {
    if (nowMs >= (e.end ? Date.parse(e.end) : endOfDayMs(e.date))) return DEPARTED;
    return days <= 0 ? TODAY : soon(days);
  }
  const start = Date.parse(e.start);
  const end = e.end ? Date.parse(e.end) : start + 3 * HOUR;
  if (nowMs >= end) return DEPARTED;
  if (nowMs >= start) return { label: "LIVE NOW", kind: "live", chip: true };
  if (start - nowMs <= HOUR) {
    return { label: `BOARDING · ${Math.ceil((start - nowMs) / 60_000)} MIN`, kind: "board", chip: true };
  }
  return days <= 0 ? TODAY : soon(days);
}
