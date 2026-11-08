import { useEffect, useRef, type CSSProperties } from "react";
import { LINES } from "../lib/lines";
import { eventStatus } from "../lib/status";
import { dayShort, timeLabel } from "../lib/time";
import type { PublicEvent } from "../types";

interface Props {
  event: PublicEvent;
  now: number;
  kept: boolean;
  onToggleKeep(): void;
  onShare(): void;
  onClose(): void;
}

export function Ticket({ event, now, kept, onToggleKeep, onShare, onClose }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [event.id]);

  const line = LINES[event.topic];
  const status = eventStatus(event, now);
  const zone = event.region === "sg" ? "SGT" : "MYT";
  const time = event.all_day ? "All day" : `${timeLabel(event.start)}${event.end ? `–${timeLabel(event.end)}` : ""} ${zone}`;

  return (
    <article className={`tk${kept ? " kept" : ""}`} style={{ "--c": line.color } as CSSProperties} data-testid="ticket">
      <div className="tk-band">
        <span className="ln">
          <i>{line.code}</i>
          {line.name.toUpperCase()}
          {event.place_tag ? ` · ${event.place_tag}` : ""}
        </span>
        <span>{status.label}</span>
      </div>
      <button type="button" className="tk-close" onClick={onClose} aria-label="Close ticket">×</button>
      <span className="tk-stamp" aria-hidden="true">KEPT ★</span>
      <div className="tk-body">
        <h2 ref={heading} tabIndex={-1}>{event.name}</h2>
        <dl className="tk-grid">
          <div><dt>DATE</dt><dd>{dayShort(event.date)}</dd></div>
          <div><dt>TIME</dt><dd>{time}</dd></div>
          <div><dt>STATION</dt><dd>{event.location}</dd></div>
          <div><dt>HOST</dt><dd>{event.organizer ?? "—"}</dd></div>
          {event.price && <div><dt>PRICE</dt><dd>{event.price}</dd></div>}
        </dl>
        <div className="tk-perf" />
        <div className="tk-btns">
          <a className="p" href={event.url} target="_blank" rel="noopener noreferrer">Sign up ↗</a>
          <a href={`/e/${event.id}.ics`} download>+ Calendar</a>
          <button type="button" className={`keep${kept ? " on" : ""}`} aria-pressed={kept} onClick={onToggleKeep}>
            {kept ? "🎟 Kept" : "🎟 Keep"}
          </button>
          <button type="button" onClick={onShare} aria-label="Share this event">Share</button>
        </div>
      </div>
    </article>
  );
}
