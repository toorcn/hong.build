import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { LINES } from "../lib/lines";
import type { Topic } from "../types";
import { Icon, type IconName } from "./Icon";

const shot = (name: string) => `${import.meta.env.BASE_URL}guide/${name}.jpg`;
const FEED = "https://events.hong.build/events.ics";

function Step({ icon, title, img, alt, children }: { icon: IconName; title: string; img?: string; alt?: string; children: ReactNode }) {
  return (
    <section className="gd-step">
      <h3>
        <Icon name={icon} size={15} />
        {title}
      </h3>
      <div className="gd-text">{children}</div>
      {img && <img className="gd-shot" src={shot(img)} alt={alt ?? ""} loading="lazy" decoding="async" />}
    </section>
  );
}

const STATUSES: [string, string, string][] = [
  ["LIVE NOW", "s-live", "happening right now"],
  ["BOARDING · 20 MIN", "s-board", "starts within the hour"],
  ["CLOSES IN 5D", "s-board", "an application or grant deadline"],
  ["DEPARTED", "s-dep", "already finished today"],
];

/** How to ride the line: the things people don't discover by tapping around. */
export function Guide({ onClose }: { onClose(): void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <article className="gd" data-testid="guide">
      <header className="gd-top">
        <h2 ref={heading} tabIndex={-1}>How to ride the Builder Line</h2>
        <button type="button" className="tk-close" onClick={onClose} aria-label="Close guide">
          <Icon name="x" size={15} />
        </button>
      </header>
      <p className="gd-lede">Every builder, startup and tech event around KL, drawn as a train line. Days are stations; each event branches off its day.</p>

      <Step icon="hand" title="Ride the train" img="train" alt="The red train on the line with the platform display above it">
        <p>Drag the red train, or just scroll. It rides along the top of the line and the platform display shows that day's departures. Arrow keys work too.</p>
      </Step>

      <Step icon="pin" title="Read the line">
        <p>Each colour is a topic:</p>
        <ul className="gd-legend">
          {(Object.keys(LINES) as Topic[]).map((t) => (
            <li key={t} style={{ "--c": LINES[t].color } as CSSProperties}>
              <i><Icon name={LINES[t].icon} size={11} /></i>
              {LINES[t].name}
            </li>
          ))}
        </ul>
        <p>A <b className="gd-teal">teal branch</b> splits off on days with events in Singapore, online or further away. KL events stay on the main line.</p>
      </Step>

      <Step icon="clock" title="Know what's on now">
        <ul className="gd-status">
          {STATUSES.map(([label, cls, text]) => (
            <li key={label}>
              <span className={`tk-status ${cls}`}>{label}</span>
              {text}
            </li>
          ))}
        </ul>
      </Step>

      <Step icon="bookmark" title="Keep events, then add them all at once" img="ticket" alt="An event ticket with Sign up, Calendar, Keep and Share">
        <p>Tap any station to open its ticket. Press <b>Keep</b> on the ones you want; they collect in <b>My Journey</b> (the ticket button, top right).</p>
      </Step>

      <Step icon="calendar-plus" title="Put your plan in your calendar" img="wallet" alt="My Journey with kept events and the Add to my calendar button">
        <p>Open My Journey and tap <b>Add to my calendar</b>. You get one file with every kept event, which Google Calendar, Apple Calendar and Outlook all open. For a single event, use <b>Calendar</b> on its ticket.</p>
      </Step>

      <Step icon="bell" title="Subscribe so new events just appear">
        <p>Subscribing adds the whole line to your calendar and keeps it updated as new events land.</p>
        <ul className="gd-how">
          <li><b>Apple Calendar or iPhone:</b> tap <a href={`webcal://events.hong.build/events.ics`}>subscribe</a>, then confirm.</li>
          <li>
            <b>Google Calendar:</b> on a computer, go to Other calendars, choose <b>+</b> then <b>From URL</b>, and paste <code>{FEED}</code>.
          </li>
          <li><b>Outlook:</b> Add calendar, then Subscribe from web, and paste the same link.</li>
        </ul>
      </Step>

      <Step icon="link" title="Share an event">
        <p>The <b>Share</b> button on a ticket sends a link that opens straight to that event. It's handy for group chats.</p>
      </Step>

      <Step icon="moon" title="Night service and the chime">
        <p>The moon switches to the dark theme; the bell turns on a two-tone station chime as the train arrives. Both are remembered on this device.</p>
      </Step>

      <p className="gd-foot">Kept events live in this browser only. Clearing your browser data clears them too, so add them to your calendar if they matter.</p>
    </article>
  );
}
