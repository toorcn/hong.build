import type { Metadata } from "next";
import { ContentPanel } from "@/components/content-panel";
import { RunFrequency } from "@/components/run-frequency";
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
  title: "Run log",
  description:
    "Every event entered since October 2022 — including the ones that produced nothing.",
};

/** Three honest states, three glyphs. An empty result is data, not a gap. */
function glyphFor(a: Award): { mark: string; className: string } {
  if (a.mentored) return { mark: "◐ mentor", className: "text-type-dim" };
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
  const years = [...byYear.keys()].sort((a, b) => a - b);

  const stats: readonly { n: number; k: string }[] = [
    { n: EVENT_COUNT, k: "entered" },
    { n: PLACEMENT_COUNT, k: "placed" },
    { n: NO_PLACEMENT_COUNT, k: "nothing" },
    { n: CHAMPION_COUNT, k: "won outright" },
  ];

  return (
    <ContentPanel title="Run log" wide>
      <p className="max-w-xl text-base leading-relaxed text-type-dim">
        Every event I've entered since October 2022 — including the ones
        that produced nothing, because the blanks are the point. The first
        five entries have no placement at all, and the sixth result wasn't
        mine: I coached a team across the line a year before I got there
        myself. Take the blanks out and the rest reads as talent, which
        isn't the true story.
      </p>

      <dl className="mt-10 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
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
                      className="grid gap-2 px-5 py-4 sm:grid-cols-[3.5rem_5.5rem_1fr_auto] sm:items-baseline sm:gap-5"
                    >
                      <span className="font-mono text-[10px] lowercase tracking-[0.16em] text-type-faint">
                        {a.month}
                      </span>
                      <span
                        className={`font-mono text-[10px] uppercase tracking-[0.16em] ${g.className}`}
                      >
                        {g.mark}
                      </span>
                      <div className="min-w-0">
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
                        {a.note ? (
                          <p className="mt-1 text-xs leading-relaxed text-type-dim">{a.note}</p>
                        ) : null}
                      </div>
                      <span
                        className={`text-sm sm:text-right ${
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
