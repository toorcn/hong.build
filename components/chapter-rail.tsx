"use client";

import { BEATS, BEAT_T } from "@/lib/story";
import { useStoryStore } from "@/lib/story-store";

/**
 * Chapter rail — the journey as a time axis down the right edge.
 *
 * Rows are positioned by BEAT_T rather than spaced evenly, which is the whole
 * reason this is worth building. BEAT_T mirrors real elapsed time, so the rail
 * shows the shape of the story before you have read a word of it: one mark in
 * 2017, a long empty stretch, then eleven years of life compressed into the
 * bottom third. Evenly spaced dots actively lied about that — and they also
 * meant the progress fill never lined up with the row it was supposedly at,
 * because the fill tracks storyT and storyT is not uniform.
 *
 * Each row carries its year, always visible, and its phase name on hover or
 * when active. The year is what makes the gaps legible as time.
 */
export function ChapterRail() {
  const activeBeat = useStoryStore((s) => s.activeBeat);
  const storyT = useStoryStore((s) => s.storyT);
  const goToBeat = useStoryStore((s) => s.goToBeat);

  return (
    <nav
      aria-label="Chapters"
      data-rail="desktop"
      style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
      className="entrance-hide fixed right-6 top-1/2 z-20 hidden -translate-y-1/2 sm:block"
    >
      {/* Fixed-height axis so BEAT_T can position rows proportionally. Capped
          against the viewport so short screens don't push rows off-screen. */}
      <div className="relative h-[min(440px,58vh)] w-px">
        <div aria-hidden className="absolute inset-y-0 right-0 w-px bg-line" />
        {/* Fuse burn — glowing trail + breathing ember at the leading edge.
            storyT is the burn progress; the head sits at the tip. */}
        <div
          aria-hidden
          className="rail-fuse rail-fuse--y absolute right-0 top-0"
          data-lit={storyT > 0.002 ? "1" : "0"}
          style={{ height: `${storyT * 100}%` }}
        >
          <span className="rail-fuse-trail" />
          <span className="rail-fuse-heat" />
          <span className="rail-fuse-head" />
        </div>

        {BEATS.map((beat) => {
          const active = beat.id === activeBeat;
          return (
            <button
              key={beat.id}
              type="button"
              onClick={() => goToBeat(beat.id)}
              aria-label={`${beat.year} — ${beat.label}`}
              aria-current={active ? "step" : undefined}
              style={{ top: `${(BEAT_T[beat.id] ?? 0) * 100}%` }}
              className="focus-ring group absolute right-0 z-10 flex -translate-y-1/2 items-center justify-end gap-3 py-1"
            >
              <span
                className={`whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] transition-opacity duration-200 ${
                  active
                    ? "text-accent opacity-100"
                    : "text-type-faint opacity-0 group-hover:opacity-100"
                }`}
              >
                {beat.label}
              </span>
              <span
                className={`w-[42px] whitespace-nowrap text-right font-mono text-[9px] tracking-[0.08em] tabular-nums transition-colors duration-200 ${
                  active ? "text-type" : "text-type-faint group-hover:text-type-dim"
                }`}
              >
                {beat.year}
              </span>
              {/* A tick crossing the axis rather than a dot beside it — the rail
                  is a scale now, so it should be marked like one. */}
              <span
                className={`block h-px transition-all duration-300 ${
                  active
                    ? "w-4 bg-accent shadow-[0_0_10px_rgba(200,255,77,0.7)]"
                    : "w-2 bg-type-faint group-hover:w-3 group-hover:bg-type-dim"
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
