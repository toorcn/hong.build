import type { Ref } from "react";
import type { Day } from "../lib/timetable";
import { dayLabel, dayShort, relativeHint } from "../lib/time";

interface Props {
  day: Day;
  todayKey: string;
  at: boolean;
  onSelect(): void;
  ref?: Ref<HTMLButtonElement>;
}

export function DayStation({ day, todayKey, at, onSelect, ref }: Props) {
  const count = day.main.length + day.branch.length;
  const cls = ["tx-day", day.isToday && "now", day.branch.length > 0 && "ix", at && "at"].filter(Boolean).join(" ");
  return (
    <button
      ref={ref}
      type="button"
      className={cls}
      onClick={onSelect}
      aria-label={`${dayShort(day.key)}${day.isToday ? ", today" : ""}: ${count} ${count === 1 ? "event" : "events"}`}
    >
      {dayLabel(day.key)}{" "}
      {day.isToday ? <span className="tx-here">You are here</span> : <small>{relativeHint(day.key, todayKey)}</small>}
    </button>
  );
}
