"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/content/site";
import { BEATS, BEAT_T, beatForRoute } from "@/lib/story";
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
  const markReturnBeat = useStoryStore((s) => s.markReturnBeat);
  const active = BEATS[activeBeat];
  const heldBeat = beatForRoute(pathname);

  const returnToJourney = () => {
    if (heldBeat !== null) markReturnBeat(heldBeat);
  };

  return (
    <header className="lab-chrome pointer-events-none">
      <div className="flex items-start justify-between px-5 py-4 sm:px-8 sm:py-6">
        <Link
          href="/"
          onClick={returnToJourney}
          className="focus-ring entrance-hide pointer-events-auto group"
          aria-label={`${SITE.name} — home`}
        >
          <span className="block font-display text-lg font-black leading-none tracking-tight text-type">
            {SITE.shortName}
          </span>
          <span className="mt-1 block max-w-[140px] font-mono text-[10px] uppercase tracking-[0.18em] text-type-faint transition-colors group-hover:text-accent sm:max-w-none">
            {SITE.title}
          </span>
        </Link>

        {/* Whole chrome cluster stays behind entrance-hide so the cold start
            owns the frame — sound arrives with the rest of the app. */}
        <div className="entrance-hide pointer-events-auto flex items-center gap-4">
          <Link
            href="/humans"
            aria-current={pathname === "/humans" ? "page" : undefined}
            className="focus-ring whitespace-nowrap px-1 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-type-dim transition-colors hover:text-accent aria-[current=page]:text-accent sm:tracking-[0.18em]"
          >
            For humans
          </Link>
          {onHome ? (
            <>
              <Link
                href="/agents"
                className="focus-ring hidden px-1 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-type-faint transition-colors hover:text-accent sm:block"
              >
                For agents
              </Link>
              <Link
                href="/contact"
                className="focus-ring hidden border border-line px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-type-dim transition-colors hover:border-accent hover:text-type sm:block"
              >
                Contact
              </Link>
            </>
          ) : (
            <Link
              href="/"
              onClick={returnToJourney}
              className="focus-ring hidden border border-line px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-type-dim transition-colors hover:border-accent hover:text-type sm:block"
            >
              ← Journey
            </Link>
          )}
          <SoundToggle />
        </div>
      </div>

      {onHome && <Link href="/guestbook/sign" className="entrance-hide focus-ring pointer-events-auto fixed bottom-28 left-5 z-30 flex items-center gap-3 rounded-full border border-accent/40 bg-void/90 px-5 py-3 text-sm text-type backdrop-blur transition-colors hover:border-accent hover:text-accent sm:bottom-7 sm:left-8"><span aria-hidden="true">✦</span> Sign my guestbook <span aria-hidden="true">↗</span></Link>}

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
              className="rail-fuse rail-fuse--x absolute left-0 top-1/2"
              data-lit={storyT > 0.002 ? "1" : "0"}
              style={{ width: `${storyT * 100}%` }}
            >
              <span className="rail-fuse-trail" />
              <span className="rail-fuse-heat" />
              <span className="rail-fuse-head" />
            </div>
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
                  className="focus-ring absolute -top-2 flex h-11 w-7 -translate-x-1/2 items-center justify-center"
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
