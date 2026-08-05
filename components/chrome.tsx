"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/content/site";
import { BEATS } from "@/lib/story";
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
  const goToBeat = useStoryStore((s) => s.goToBeat);

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

      {/* Mobile chapter strip — bottom, only on the journey. */}
      {onHome && (
        <nav
          aria-label="Chapters"
          style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
          className="entrance-hide pointer-events-auto fixed inset-x-0 bottom-0 z-20 flex items-center justify-center gap-4 border-t border-line bg-void/85 px-2 py-3 backdrop-blur sm:hidden"
        >
          {BEATS.map((beat) => {
            const active = beat.id === activeBeat;
            return (
              <button
                key={beat.id}
                type="button"
                onClick={() => goToBeat(beat.id)}
                aria-label={beat.label}
                aria-current={active}
                className="focus-ring flex h-7 items-center justify-center"
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    active ? "h-2 w-2 bg-accent" : "h-1.5 w-1.5 bg-type-faint"
                  }`}
                />
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
