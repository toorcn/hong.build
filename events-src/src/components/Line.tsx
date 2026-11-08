import {
  useCallback, useLayoutEffect, useRef, useState,
  type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject,
} from "react";
import { dayShort } from "../lib/time";
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
  /** Train arrives at a day (click, keyboard, or end of a drag). */
  onSelectDay(index: number): void;
  /** Train passes a day while being dragged. */
  onPassDay(index: number): void;
  onOpen(id: string): void;
  emptyMessage: ReactNode;
}

export function Line({
  days, todayKey, now, current, kept, reduced, scrollRef, onSelectDay, onPassDay, onOpen, emptyMessage,
}: LineProps) {
  const stations = useRef<(HTMLButtonElement | null)[]>([]);
  const innerRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef(current);
  currentRef.current = current;
  const grab = useRef(0);
  const passing = useRef(current);
  const [restY, setRestY] = useState(0);
  const [dragY, setDragY] = useState<number | null>(null);
  const [used, setUsed] = useState(false);
  const [placed, setPlaced] = useState(false);

  /** Train top that lines up with a day's interchange circle. */
  const top = useCallback((i: number) => (stations.current[i]?.offsetTop ?? 0) - 3, []);

  useLayoutEffect(() => {
    setRestY(top(current));
  }, [current, days, top]);

  // Park the train without animating from the top on first paint; glide only afterwards.
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => setPlaced(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setRestY(top(currentRef.current)));
    observer.observe(el);
    return () => observer.disconnect();
  }, [top]);

  const nearest = (y: number) => {
    let best = 0;
    let bestDistance = Infinity;
    days.forEach((_, i) => {
      const d = Math.abs(top(i) - y);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    });
    return best;
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    grab.current = e.clientY - e.currentTarget.getBoundingClientRect().top;
    passing.current = current;
    setUsed(true);
    setDragY(restY);
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragY === null) return;
    const map = scrollRef.current;
    const inner = innerRef.current;
    if (!map || !inner) return;
    const box = map.getBoundingClientRect();
    if (e.clientY > box.bottom - 40) map.scrollTop += 10;
    else if (e.clientY < box.top + 150) map.scrollTop -= 10;
    const y = Math.max(top(0), Math.min(top(days.length - 1), e.clientY - inner.getBoundingClientRect().top - grab.current));
    setDragY(y);
    const i = nearest(y);
    if (i !== passing.current) {
      passing.current = i;
      onPassDay(i);
    }
  };

  const onUp = () => {
    if (dragY === null) return;
    setDragY(null);
    onSelectDay(passing.current);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    setUsed(true);
    const i = Math.max(0, Math.min(days.length - 1, current + step));
    if (i === current) return;
    onSelectDay(i);
    stations.current[i]?.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div className="tx-map" ref={scrollRef}>
      <div className="tx-inner" ref={innerRef}>
        <div className="tx-rail" aria-hidden="true" />
        <div
          className={`tx-train${dragY !== null ? " drag" : ""}${used ? " used" : ""}`}
          style={{ top: dragY ?? restY, ...(placed ? null : { transition: "none" }) }}
          role="slider"
          tabIndex={0}
          aria-label="Train: choose a day"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, days.length - 1)}
          aria-valuenow={current}
          aria-valuetext={days[current] ? dayShort(days[current].key) : ""}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={onKey}
        />
        <ol className="days" aria-label="Upcoming events by day">
          {days.map((day, i) => (
            <li key={day.key}>
              <DayStation
                ref={(el) => {
                  stations.current[i] = el;
                }}
                day={day}
                todayKey={todayKey}
                at={i === current}
                onSelect={() => onSelectDay(i)}
              />
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
