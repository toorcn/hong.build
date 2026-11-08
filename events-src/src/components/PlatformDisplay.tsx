import { useEffect, useMemo, useState } from "react";
import { useFlap } from "../hooks/useFlap";
import { LINES } from "../lib/lines";
import { eventStatus } from "../lib/status";
import { dayLabel, timeLabel } from "../lib/time";
import { dayEvents, type Day } from "../lib/timetable";

interface Props {
  day: Day | undefined;
  todayKey: string;
  now: number;
  reduced: boolean;
  /** Service notice (offline / stale), shown under the departure. */
  notice: string | null;
  /** Second line when the day has no departures. */
  fallback: string;
  onOpen(id: string): void;
}

/** Floating split-flap board. Decorative for screen readers: the list carries the same facts. */
export function PlatformDisplay({ day, todayKey, now, reduced, notice, fallback, onOpen }: Props) {
  const list = useMemo(() => (day ? dayEvents(day) : []), [day]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (list.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % list.length), 3200);
    return () => clearInterval(id);
  }, [list]);

  const event = list[index % Math.max(list.length, 1)];
  const shown = useFlap(event ? event.name.toUpperCase() : "NO SERVICE SCHEDULED", reduced);
  const header = day ? `${day.key === todayKey ? "NOW" : "STATION"} · ${dayLabel(day.key)}` : "";
  const status = event ? eventStatus(event, now) : null;
  const line = event ? LINES[event.topic] : null;
  const when = event ? (event.all_day ? "ALL DAY" : `${timeLabel(event.start)}${event.region === "sg" ? " SGT" : ""}`) : "";
  const place = event && event.location.toUpperCase() !== "ONLINE" ? ` · ${event.location.toUpperCase()}` : "";

  return (
    <div className="pids" data-testid="pids" aria-hidden="true" onClick={() => event && onOpen(event.id)}>
      <div className="pids-k">
        <span>{header}</span>
        <span className="pids-pg">
          {list.length > 1 && list.map((e, i) => <i key={e.id} className={i === index ? "on" : undefined} />)}
        </span>
      </div>
      <div className="pids-n">{shown}</div>
      <div className="pids-m">
        {event && line && status ? (
          <>
            {event.place_tag && <span className="p-sg">{event.place_tag} · </span>}
            {when}
            {place} · <span style={{ color: line.color, filter: "brightness(1.5)" }}>{line.name.toUpperCase()}</span>
            {status.chip && (
              <>
                {" · "}
                <span className={`s-${status.kind}`}>{status.label}</span>
              </>
            )}
          </>
        ) : (
          fallback
        )}
      </div>
      {notice && <div className="pids-x">{notice}</div>}
    </div>
  );
}
