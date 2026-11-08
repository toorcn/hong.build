import type { PublicEvent } from "../types";
import { mytDateKey } from "./time";

export interface Day {
  key: string;
  isToday: boolean;
  /** Klang Valley stations on the main line. */
  main: PublicEvent[];
  /** Singapore / online / elsewhere: drawn on that day's branch. */
  branch: PublicEvent[];
}

const byStart = (a: PublicEvent, b: PublicEvent) => a.start.localeCompare(b.start) || a.name.localeCompare(b.name);

export function buildTimetable(events: PublicEvent[], nowMs: number): Day[] {
  const today = mytDateKey(nowMs);
  const days = new Map<string, PublicEvent[]>([[today, []]]);
  for (const e of events) {
    const key = e.date < today ? today : e.date;
    const list = days.get(key) ?? [];
    list.push(e);
    days.set(key, list);
  }
  return [...days.keys()].sort().map((key) => {
    const list = days.get(key)!.sort(byStart);
    return {
      key,
      isToday: key === today,
      main: list.filter((e) => e.region === "kv"),
      branch: list.filter((e) => e.region !== "kv"),
    };
  });
}

export const dayEvents = (day: Day) => [...day.main, ...day.branch].sort(byStart);

export function spurLabel(branch: PublicEvent[]): string {
  const online = branch.filter((e) => e.region === "online").length;
  if (online === branch.length) return "ONLINE LINK";
  return online > 0 ? "OVERSEAS & ONLINE LINK" : "OVERSEAS LINK";
}
