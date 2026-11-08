import type { ReactNode, RefObject } from "react";
import type { Day } from "../lib/timetable";
import { DayStation } from "./DayStation";
import { Spur } from "./Spur";
import { Stop } from "./Stop";

export interface LineProps {
  days: Day[];
  todayKey: string;
  now: number;
  current: number;
  kept: ReadonlySet<string>;
  reduced: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  onSelectDay(index: number): void;
  onOpen(id: string): void;
  emptyMessage: ReactNode;
}

export function Line({ days, todayKey, now, current, kept, reduced, scrollRef, onSelectDay, onOpen, emptyMessage }: LineProps) {
  return (
    <div className="tx-map" ref={scrollRef}>
      <div className="tx-inner">
        <div className="tx-rail" aria-hidden="true" />
        <ol className="days" aria-label="Upcoming events by day">
          {days.map((day, i) => (
            <li key={day.key}>
              <DayStation day={day} todayKey={todayKey} at={i === current} onSelect={() => onSelectDay(i)} />
              {day.branch.length > 0 && (
                <Spur day={day} now={now} kept={kept} active={i === current} reduced={reduced} onOpen={onOpen} />
              )}
              {day.main.length > 0 && (
                <ul className="stops">
                  {day.main.map((e) => (
                    <li key={e.id}>
                      <Stop event={e} now={now} kept={kept.has(e.id)} branch={false} onOpen={onOpen} />
                    </li>
                  ))}
                </ul>
              )}
              {day.isToday && day.main.length + day.branch.length === 0 && emptyMessage}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
