"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/content/site";
import { BEATS, BEAT_T } from "@/lib/story";
import { useStoryStore } from "@/lib/story-store";
import { SoundToggle } from "@/components/sound-toggle";

/**
 * Narrative chrome: identity top-left, sound + contact top-right, and a
 * slim mobile chapter strip. The right-edge ChapterRail (rendered by the
 * page) handles desktop chapter navigation; this stays minimal so the
 * journey owns the frame.
 */
export function Chrome() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const activeBeat = useStoryStore((s) => s.activeBeat);
  const storyT = useStoryStore((s) => s.storyT);
  const goToBeat = useStoryStore((s) => s.goToBeat);
  const active = BEATS[activeBeat];

  return (
    <header className="lab-chrome pointer-events-none fixed inset-x-0 top-0 z-20">
      <div className="flex items-start justify-between px-5 py-4 sm:px-8 sm:py-6">
        <Link
          href="/"
          className="focus-ring entrance-hide pointer-events-auto group"
          aria-label={`${SITE.name} — home`}
        >
          <span className="block font-display text-lg font-black leading-none tracking-tight text-type">
            {SITE.shortName}
          </span>
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-type-faint transition-colors group-hover:text-accent">
            {SITE.title}
          </span>
        </Link>

        {/* The sound toggle is deliberately outside `entrance-hide`: sound must
            be controllable before anything is ever played, including during
            the entrance — click it there and the mark's lock chord sounds. */}
        <div className="pointer-events-auto flex items-center gap-4">
          {onHome ? (
            <Link
              href="/contact"
              className="focus-ring entrance-hide hidden border border-line px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-type-dim transition-colors hover:border-accent hover:text-type sm:block"
            >
              Contact
            </Link>
          ) : (
            <Link
              href="/"
              className="focus-ring entrance-hide hidden border border-line px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-type-dim transition-colors hover:border-accent hover:text-type sm:block"
            >
              ← Journey
            </Link>
          )}
          <SoundToggle />
        </div>
      </div>

      {/* Mobile chapter strip — bottom, only on the journey. Eleven evenly
          spaced dots would be an unreadable, untappable row, so this is the
          same proportional time axis as the desktop rail turned on its side,
          with the current year and phase named above it. */}
      {onHome && (
        <nav
          aria-label="Chapters"
          data-rail="mobile"
          style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
          className="entrance-hide pointer-events-auto fixed inset-x-0 bottom-0 z-20 border-t border-line bg-void/85 px-5 pb-3 pt-2 backdrop-blur sm:hidden"
        >
          <p className="mb-1 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-type-faint">
            <span className="text-accent">{active?.year}</span>
            <span className="mx-2 text-line">/</span>
            {active?.label}
          </p>
          <div className="relative h-7">
            <div aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-line" />
            <div
              aria-hidden
              className="absolute left-0 top-1/2 h-px bg-accent transition-[width] duration-150"
              style={{ width: `${storyT * 100}%` }}
            />
            {BEATS.map((beat) => {
              const on = beat.id === activeBeat;
              return (
                <button
                  key={beat.id}
                  type="button"
                  onClick={() => goToBeat(beat.id)}
                  aria-label={`${beat.year} — ${beat.label}`}
                  aria-current={on ? "step" : undefined}
                  style={{ left: `${(BEAT_T[beat.id] ?? 0) * 100}%` }}
                  className="focus-ring absolute top-0 flex h-7 w-6 -translate-x-1/2 items-center justify-center"
                >
                  <span
                    className={`block w-px transition-all duration-300 ${
                      on ? "h-3.5 bg-accent" : "h-2 bg-type-faint"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
