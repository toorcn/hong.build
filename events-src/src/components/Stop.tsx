import type { CSSProperties } from "react";
import { LINES } from "../lib/lines";
import { eventStatus } from "../lib/status";
import { timeLabel } from "../lib/time";
import type { PublicEvent } from "../types";

interface Props {
  event: PublicEvent;
  now: number;
  kept: boolean;
  /** Drawn on a branch: mirrored to the right-hand line. */
  branch: boolean;
  onOpen(id: string): void;
}

const tagClass = (e: PublicEvent) => (e.region === "sg" ? "sg" : e.region === "online" ? "on" : "ot");

export function Stop({ event, now, kept, branch, onOpen }: Props) {
  const status = eventStatus(event, now);
  const cls = ["tx-stop", `r-${event.region}`, branch && "ov", status.kind === "dep" && "dep", kept && "kept"]
    .filter(Boolean)
    .join(" ");
  const chip = status.chip ? <i className={`st ${status.kind}`}>{status.label}</i> : null;
  const when = event.all_day ? "All day" : `${timeLabel(event.start)}${event.region === "sg" ? " SGT" : ""}`;
  return (
    <button
      type="button"
      className={cls}
      style={{ "--c": LINES[event.topic].color } as CSSProperties}
      onClick={() => onOpen(event.id)}
      data-event-id={event.id}
    >
      {status.kind === "live" && <i className="pulse" aria-hidden="true" />}
      {kept && <em className="kb" aria-label="kept">🎟</em>}
      <b>{event.name}</b>
      <span>
        {event.place_tag && <i className={`rg ${tagClass(event)}`}>{event.place_tag}</i>}
        {when} · {event.location}
        {!branch && chip}
      </span>
      {branch && chip && <span className="stl">{chip}</span>}
    </button>
  );
}
