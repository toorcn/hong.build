import { useEffect, useRef, type CSSProperties } from "react";
import { LINES } from "../lib/lines";
import { eventStatus } from "../lib/status";
import { dayShort, timeLabel } from "../lib/time";
import type { PublicEvent } from "../types";
import { Icon, type IconName } from "./Icon";

interface Props {
  event: PublicEvent;
  now: number;
  kept: boolean;
  onToggleKeep(): void;
  onShare(): void;
  onClose(): void;
}

function Row({ icon, label, children }: { icon: IconName; label: string; children: string }) {
  return (
    <div className="tk-row">
      <Icon name={icon} size={15} />
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
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
      <header className="tk-top">
        <span className="tk-line">
          <i className="tk-code" aria-hidden="true">{line.code}</i>
          <span>
            {line.name.toUpperCase()}
            {event.place_tag ? ` · ${event.place_tag}` : ""}
          </span>
        </span>
        <span className={`tk-status s-${status.kind}`}>{status.label}</span>
        <button type="button" className="tk-close" onClick={onClose} aria-label="Close ticket">
          <Icon name="x" size={15} />
        </button>
      </header>

      <div className="tk-body">
        <h2 ref={heading} tabIndex={-1}>{event.name}</h2>
        <dl className="tk-rows">
          <Row icon="calendar" label="Date">{dayShort(event.date)}</Row>
          <Row icon="clock" label="Time">{time}</Row>
          <Row icon="pin" label="Station">{event.location}</Row>
          {event.organizer && <Row icon="user" label="Host">{event.organizer}</Row>}
          {event.price && <Row icon="tag" label="Price">{event.price}</Row>}
        </dl>
      </div>

      <footer className="tk-foot">
        <a className="tk-primary" href={event.url} target="_blank" rel="noopener noreferrer">
          Sign up
          <Icon name="arrow-up-right" size={15} />
        </a>
        <div className="tk-tools">
          <a href={`/e/${event.id}.ics`} download>
            <Icon name="calendar-plus" size={16} />
            Calendar
          </a>
          <button type="button" className={kept ? "on" : undefined} aria-pressed={kept} onClick={onToggleKeep}>
            <Icon name="bookmark" size={16} className={kept ? "filled" : undefined} />
            {kept ? "Kept" : "Keep"}
          </button>
          <button type="button" onClick={onShare} aria-label="Share this event">
            <Icon name="share" size={16} />
            Share
          </button>
        </div>
      </footer>
    </article>
  );
}
