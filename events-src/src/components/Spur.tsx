import { useLayoutEffect, useRef, useState } from "react";
import { spurLabel, type Day } from "../lib/timetable";
import { Stop } from "./Stop";

interface Props {
  day: Day;
  now: number;
  kept: ReadonlySet<string>;
  /** The train is at this day: send the little teal train out along the branch. */
  active: boolean;
  reduced: boolean;
  onOpen(id: string): void;
}

/** A branch that curves off the main line under its day, runs right, then down past its stations. */
export function Spur({ day, now, kept, active, reduced, onOpen }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const label = spurLabel(day.branch);
  const allOnline = day.branch.every((e) => e.region === "online");
  const right = size ? size.w - 20 : 0;
  const curve = size ? `M20 0 C20 10 28 13 42 13 L${right - 22} 13 C${right - 6} 13 ${right} 19 ${right} 34` : "";
  const run = size ? `${curve} L${right} ${size.h - 22}` : "";

  return (
    <div ref={ref} className={`spur${allOnline ? " on" : ""}${active && !reduced ? " go" : ""}`}>
      {size && (
        <svg className="spur-svg" viewBox={`0 0 ${size.w} 40`} preserveAspectRatio="none" aria-hidden="true">
          <path className="spur-p" d={curve} />
        </svg>
      )}
      <span className="spur-l" aria-hidden="true">{label}</span>
      <i className="spur-rail" aria-hidden="true" />
      <i className="spur-end" aria-hidden="true" />
      {size && <i className="spur-train" aria-hidden="true" style={{ offsetPath: `path("${run}")` }} />}
      <ul className="stops" aria-label={label.toLowerCase()}>
        {day.branch.map((e) => (
          <li key={e.id}>
            <Stop event={e} now={now} kept={kept.has(e.id)} branch onOpen={onOpen} />
          </li>
        ))}
      </ul>
    </div>
  );
}
