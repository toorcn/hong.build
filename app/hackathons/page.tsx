import type { Metadata } from "next";
import { ContentPanel } from "@/components/content-panel";
import { RunFrequency } from "@/components/run-frequency";
import { EventLogo, EventLogoFilters } from "@/components/event-logo";
import { CountUp, LiveRow, ResolveIn } from "@/components/panel-motion";
import {
  AWARDS,
  CHAMPION_COUNT,
  EVENT_COUNT,
  NO_PLACEMENT_COUNT,
  PLACEMENT_COUNT,
  type Award,
} from "@/content/awards";

export const metadata: Metadata = {
  title: "Hackathons & competitions",
  alternates: { canonical: "https://hong.build/hackathons" },
  description:
    "Every event entered since October 2022 — including the ones that produced nothing.",
};

const OUT_LINK =
  "focus-ring mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.16em] text-type-faint underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent";

/** A note that is just a link renders as one. */
function isUrl(s: string): boolean {
  return /^https?:\/\//.test(s);
}

/** Three honest states, three glyphs. An empty result is data, not a gap. */
function glyphFor(a: Award): { mark: string; className: string } {
  if (a.mentored) return { mark: "◐ mentor", className: "text-accent-dim" };
  if (a.result) return { mark: "● placed", className: "text-accent" };
  return { mark: "○", className: "text-type-faint" };
}

export default function RunLogPage() {
  const byYear = new Map<number, Award[]>();
  for (const a of AWARDS) {
    const list = byYear.get(a.year) ?? [];
    list.push(a);
    byYear.set(a.year, list);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  const stats: readonly { n: number; k: string }[] = [
    { n: EVENT_COUNT, k: "entered" },
    { n: PLACEMENT_COUNT, k: "placed" },
    { n: NO_PLACEMENT_COUNT, k: "nothing" },
    { n: CHAMPION_COUNT, k: "won outright" },
  ];

  return (
    <ContentPanel title="Hackathons & competitions" wide>
      <EventLogoFilters />
      <p className="max-w-xl text-base leading-relaxed text-type-dim">
        Every event I've entered since October 2022 — including the ones
        that produced nothing, because the blanks are the point. The first
        five entries have no placement at all, and the sixth result wasn't
        mine: I coached a team across the line a year before I got there
        myself. Take the blanks out and the rest reads as talent, which
        isn't the true story.
      </p>

      <dl className="mt-12 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
        {stats.map((s, i) => (
          <ResolveIn key={s.k} delay={i * 90} className="bg-void px-5 py-4">
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-type-faint">
              {s.k}
            </dt>
            <dd className="mt-1 font-display text-3xl font-black leading-none text-type">
              <CountUp to={s.n} />
            </dd>
          </ResolveIn>
        ))}
      </dl>

      <RunFrequency />

      <div className="mt-14 space-y-14">
        {years.map((year) => {
          const entries = byYear.get(year)!;
          return (
            <section key={year}>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-type-faint">
                {year}
                <span className="ml-3 text-type-faint/70">
                  {entries.length} entered
                </span>
              </h2>
              <ul className="panel-rows mt-5">
                {entries.map((a, i) => {
                  const g = glyphFor(a);
                  return (
                    <LiveRow
                      as="li"
                      key={`${a.event}-${a.month}`}
                      delay={Math.min(i, 6) * 55}
                      className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 gap-y-2 px-3 py-5 sm:grid-cols-[2.75rem_minmax(0,1fr)_minmax(6rem,11rem)] sm:px-5"
                    >
                      <EventLogo event={a.event} />
                      <div className="min-w-0">
                        <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em]">
                          <span className="text-type-faint">{a.month}</span>
                          <span className={g.className}>{g.mark}</span>
                        </div>
                        <p className="text-sm font-medium leading-snug text-type">
                          {a.event}
                          {a.compCode ? (
                            <span className="ml-2 border border-line px-1.5 py-0.5 align-middle font-mono text-[9px] uppercase tracking-[0.14em] text-type-faint">
                              comp
                            </span>
                          ) : null}
                        </p>
                        {a.org ? (
                          <p className="mt-0.5 text-xs leading-relaxed text-type-faint">{a.org}</p>
                        ) : null}
                        {a.note && isUrl(a.note) ? (
                          <a
                            href={a.note}
                            target="_blank"
                            rel="noreferrer"
                            className={OUT_LINK}
                          >
                            {new URL(a.note).host} ↗
                          </a>
                        ) : a.note ? (
                          <p className="mt-1 text-xs leading-relaxed text-type-dim">{a.note}</p>
                        ) : null}
                        {a.linkedin ? (
                          <a
                            href={a.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className={OUT_LINK}
                          >
                            story on linkedin ↗
                          </a>
                        ) : null}
                      </div>
                      <span
                        className={`col-start-2 text-sm sm:col-start-3 sm:pt-5 sm:text-right ${
                          a.result ? "text-type-dim" : "text-type-faint"
                        }`}
                      >
                        {a.result ?? "—"}
                      </span>
                    </LiveRow>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="mt-14 font-mono text-[11px] leading-relaxed tracking-[0.06em] text-type-faint">
        {"// two years between the first entry and the first win."}
      </p>
    </ContentPanel>
  );
}
