import { useEffect, useRef, type CSSProperties } from "react";
import { LINES } from "../lib/lines";
import { dayShort, timeLabel } from "../lib/time";
import type { PublicEvent } from "../types";

interface Props {
  events: PublicEvent[];
  onOpen(id: string): void;
}

export function Wallet({ events, onOpen }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="wl" data-testid="wallet">
      <h2 ref={heading} tabIndex={-1}>🎟 My Journey</h2>
      {events.length === 0 ? (
        <p className="wl-empty">No tickets yet. Tap a station and press <b>Keep</b>.</p>
      ) : (
        <>
          <ul>
            {events.map((e) => (
              <li key={e.id}>
                <button type="button" className="wl-t" style={{ "--c": LINES[e.topic].color } as CSSProperties} onClick={() => onOpen(e.id)}>
                  <b>{e.name}</b>
                  <small>{dayShort(e.date)} · {e.all_day ? "All day" : timeLabel(e.start)} · {e.location}</small>
                </button>
              </li>
            ))}
          </ul>
          <a className="wl-cta" href={`/api/events/plan.ics?ids=${events.map((e) => e.id).join(",")}`} download>
            Add {events.length} to my calendar
          </a>
        </>
      )}
      <a className="wl-sub" href="webcal://events.hong.build/events.ics">Subscribe to the whole line</a>
    </div>
  );
}
