"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { OUTCOMES_BY_YEAR } from "@/content/awards";
import { useLabStore } from "@/lib/store";

/**
 * The frequency chart for the run log — entries per year, stacked by outcome.
 *
 * The run log's argument is the ratio between what produced something and
 * what produced nothing, so the chart breaks each year's bar into the same
 * three states the glyph column uses: placed, mentored, nothing. The bars
 * grow on scroll-in the way the cloud resolves — a height settle, not a
 * marketing slide — and the year totals count up with the same ease as the
 * stat cells above. Reduced motion renders the final state immediately.
 *
 * The data is OUTCOMES_BY_YEAR from content/awards.ts, which silhouette 9
 * also reads — one source of truth.
 */

type Outcome = "placed" | "mentored" | "nothing";

const SEGMENTS: readonly {
  key: Outcome;
  label: string;
  /** Tailwind text class for the inline label, matches glyphFor on /notes. */
  text: string;
  /** Inline fill — accent for wins, dim for mentored, faint for blanks. */
  fill: string;
}[] = [
  { key: "placed", label: "placed", text: "text-accent", fill: "var(--color-accent)" },
  { key: "mentored", label: "mentored", text: "text-accent-dim", fill: "var(--color-accent-dim)" },
  { key: "nothing", label: "nothing", text: "text-type-faint", fill: "var(--color-type-faint)" },
];

const MAX_TOTAL = Math.max(...OUTCOMES_BY_YEAR.map((y) => y.total));

/** Cubic ease matching --ease-signal, so bars land with everything else. */
function easeSignal(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function RunFrequency() {
  const reducedMotion = useLabStore((s) => s.reducedMotion);
  const { ref, shown } = useGrowOnView(reducedMotion);

  // Progress 0..1 across the grow animation. Height and numbers both read it.
  const [p, setP] = useState(reducedMotion ? 1 : 0);
  useEffect(() => {
    if (!shown || reducedMotion) {
      if (reducedMotion) setP(1);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const duration = 1100;
    const step = (ts: number) => {
      start ??= ts;
      const t = Math.min((ts - start) / duration, 1);
      setP(easeSignal(t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [shown, reducedMotion]);

  const rows = useMemo(() => OUTCOMES_BY_YEAR, []);

  return (
    <figure ref={ref} className="run-frequency mt-14">
      <figcaption className="font-mono text-[10px] uppercase tracking-[0.18em] text-type-faint">
        frequency · entries per year
      </figcaption>

      <div className="run-frequency-chart mt-6">
        <div className="run-frequency-grid" aria-hidden="true">
          {Array.from({ length: MAX_TOTAL + 1 }, (_, i) => i).map((t) => (
            <span key={t} className="run-frequency-gridline" style={{ "--tick": t } as React.CSSProperties} />
          ))}
        </div>

        <div className="run-frequency-bars">
          {rows.map((y) => (
            <Bar key={y.year} outcome={y} progress={p} max={MAX_TOTAL} />
          ))}
        </div>
      </div>

      <dl className="run-frequency-legend mt-5">
        {SEGMENTS.map((s) => (
          <div key={s.key} className="run-frequency-legend-item">
            <span className="run-frequency-swatch" style={{ background: s.fill }} />
            <dt className={`font-mono text-[10px] uppercase tracking-[0.16em] ${s.text}`}>
              {s.label}
            </dt>
          </div>
        ))}
      </dl>
    </figure>
  );
}

function Bar({
  outcome,
  progress,
  max,
}: {
  outcome: (typeof OUTCOMES_BY_YEAR)[number];
  progress: number;
  max: number;
}) {
  const full = outcome.total / max; // 0..1 of chart height
  const heightPct = full * progress * 100;

  return (
    <div className="run-frequency-bar-col">
      {/* The plot area is the bar's 100% — the count and year labels sit
          below it, so a full-height bar can't push them out of the chart. */}
      <div className="run-frequency-bar-plot">
        <div className="run-frequency-bar" style={{ height: `${heightPct}%` }}>
          {SEGMENTS.map((s) => {
            const count = outcome[s.key];
            if (count === 0) return null;
            const segPct = (count / outcome.total) * 100;
            return (
              <span
                key={s.key}
                className="run-frequency-seg"
                style={{ height: `${segPct}%`, background: s.fill }}
                title={`${s.label}: ${count}`}
              />
            );
          })}
        </div>
      </div>
      <span className="run-frequency-count tnum">
        {Math.round(outcome.total * progress)}
      </span>
      <span className="run-frequency-year">{outcome.year}</span>
    </div>
  );
}

/** View-driven grow trigger, same shape as useResolveOnView in panel-motion. */
function useGrowOnView(reducedMotion: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (reducedMotion) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);
  return { ref, shown };
}
