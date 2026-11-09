import { BrandMark } from "./BrandMark";
import { Icon } from "./Icon";

/** End of the line: where the timetable comes from, who made it, and the fine print. */
export function Credits() {
  return (
    <section className="tx-credits" aria-label="Credits">
      <div className="tx-terminus" aria-hidden="true">
        <span />
        END OF LINE
      </div>
      <div className="tx-credit-brand">
        <BrandMark size={22} />
        <div>
          <b>Builder Line</b>
          <small>Builder, startup and tech events around Kuala Lumpur</small>
        </div>
      </div>
      <dl className="tx-credit-rows">
        <div>
          <dt>Timetable</dt>
          <dd>Gathered and refreshed daily by OpenClaw, an AI agent run by Hong Bing</dd>
        </div>
        <div>
          <dt>Built by</dt>
          <dd>
            <a href="https://hong.build">Hong Bing</a> · <a href="https://hong.build/hack/">Hackathon field manual</a>
          </dd>
        </div>
        <div>
          <dt>Events</dt>
          <dd>Details belong to each organiser. Check the event page before you go.</dd>
        </div>
        <div>
          <dt>Corrections</dt>
          <dd>
            <a href="mailto:hi@hong.build?subject=Builder%20Line">hi@hong.build</a>
          </dd>
        </div>
      </dl>
      <a className="tx-credit-sub" href="webcal://events.hong.build/events.ics">
        <Icon name="calendar-plus" size={14} />
        Subscribe to the whole line
      </a>
      <p className="tx-credit-fine">
        A transit map in spirit only, not affiliated with Rapid KL, Prasarana or MRT Corp. © {new Date().getFullYear()} Hong Bing.
      </p>
    </section>
  );
}
