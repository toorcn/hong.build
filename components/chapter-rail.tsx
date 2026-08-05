"use client";

import { BEATS } from "@/lib/story";
import { useStoryStore } from "@/lib/story-store";

/**
 * Chapter rail — six dots down the right edge tracking the journey.
 * Click a dot to scroll to that beat. The current chapter glows accent;
 * the rail fills to show continuous story progress between beats.
 */
export function ChapterRail() {
  const activeBeat = useStoryStore((s) => s.activeBeat);
  const storyT = useStoryStore((s) => s.storyT);
  const goToBeat = useStoryStore((s) => s.goToBeat);

  return (
    <nav
      aria-label="Chapters"
      style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
      className="entrance-hide fixed right-5 top-1/2 z-20 hidden -translate-y-1/2 sm:block"
    >
      <div className="relative flex flex-col items-center gap-5">
        {/* Track fill showing continuous progress. */}
        <div
          aria-hidden
          className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-line"
        />
        <div
          aria-hidden
          className="absolute left-1/2 top-0 w-px -translate-x-1/2 bg-accent transition-[height] duration-150"
          style={{ height: `${storyT * 100}%` }}
        />
        {BEATS.map((beat) => {
          const active = beat.id === activeBeat;
          return (
            <button
              key={beat.id}
              type="button"
              onClick={() => goToBeat(beat.id)}
              aria-label={`${beat.label} — go to chapter`}
              aria-current={active}
              className="focus-ring group relative z-10 flex items-center"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  active
                    ? "h-2.5 w-2.5 bg-accent shadow-[0_0_12px_rgba(200,255,77,0.6)]"
                    : "h-1.5 w-1.5 bg-type-faint group-hover:bg-type-dim"
                }`}
              />
              <span
                className={`pointer-events-none absolute right-6 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-200 ${
                  active
                    ? "text-accent opacity-100"
                    : "text-type-faint opacity-0 group-hover:opacity-100"
                }`}
              >
                {beat.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
