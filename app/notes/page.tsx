import type { Metadata } from "next";
import { ContentPanel } from "@/components/content-panel";
import { AWARDS, WIN_COUNT } from "@/content/awards";

export const metadata: Metadata = {
  title: "Signals",
  description: "The run log — hackathons, awards, and the occasional note.",
};

export default function SignalsPage() {
  const byYear = new Map<number, typeof AWARDS[number][]>();
  for (const a of AWARDS) {
    const list = byYear.get(a.year) ?? [];
    list.push(a);
    byYear.set(a.year, list);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <ContentPanel title="Run log" wide>
      <p className="max-w-xl text-base leading-relaxed text-type-dim">
        {WIN_COUNT} wins and counting, mostly on ~24 hours of sleep and too
        much coffee. Hackathons are where I learned to build — the log is
        the honest record.
      </p>

      <div className="mt-14 space-y-14">
        {years.map((year) => (
          <section key={year}>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-type-faint">
              {year}
            </h2>
            <ul className="panel-rows mt-5">
              {byYear.get(year)!.map((a) => (
                <li
                  key={`${a.event}-${a.result}`}
                  className="panel-row grid gap-2 px-5 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-baseline sm:gap-6"
                >
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
                      a.win ? "text-accent" : "text-type-faint"
                    }`}
                  >
                    {a.win ? "● win" : "○"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug text-type">{a.event}</p>
                    {a.note ? (
                      <p className="mt-1 text-xs leading-relaxed text-type-faint">{a.note}</p>
                    ) : null}
                  </div>
                  <span className="text-sm text-type-dim sm:text-right">{a.result}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-14 font-mono text-[11px] leading-relaxed tracking-[0.06em] text-type-faint">
        {"// sep 2026: SF → Yale → Harvard → MIT → Tokyo. say hi if you're around."}
      </p>
    </ContentPanel>
  );
}
