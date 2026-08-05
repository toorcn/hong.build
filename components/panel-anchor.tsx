"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BEATS, beatForRoute } from "@/lib/story";

/**
 * Panel chrome derived from the route, not retyped per page.
 *
 * A content route is a beat held open, so both of these read the beat out of
 * the pathname — the label can't drift from the journey the way a hardcoded
 * "chapter 01 — work" string could.
 */

/** `// chapter 01 — work` above the panel title. */
export function PanelEyebrow({ sub, beat: given }: { sub?: string; beat?: number }) {
  // On the in-scene plane the beat is handed in — the pathname is authoritative
  // only on the flat fallback.
  const fromRoute = beatForRoute(usePathname());
  const beat = given ?? fromRoute;
  if (beat === null || beat === undefined) return null;
  const { code, label } = BEATS[beat]!;

  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
      {`// chapter ${code} — ${label.toLowerCase()}`}
      {sub ? <span className="text-type-faint">{` / ${sub}`}</span> : null}
    </p>
  );
}

/**
 * Bottom-left orientation cue: the journey is paused on this beat, not
 * exited. Borrows the ChapterRail's dot grammar laid flat so the two read as
 * one instrument, and doubles as the route back — the spine restores the
 * beat you left from.
 */
export function PanelAnchor({ beat: given }: { beat?: number } = {}) {
  const fromRoute = beatForRoute(usePathname());
  const held = given ?? fromRoute;
  if (held === null || held === undefined) return null;

  return (
    <Link
      href="/"
      aria-label={`Return to the journey at chapter ${BEATS[held]!.code} — ${BEATS[held]!.label}`}
      className="focus-ring group fixed bottom-5 left-5 z-20 hidden sm:block"
    >
      <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-type-faint transition-colors group-hover:text-accent">
        ← holding
      </span>
      <span className="mt-2 flex items-center gap-1.5" aria-hidden="true">
        {BEATS.map((beat) => (
          <span
            key={beat.id}
            className={`block rounded-full transition-all duration-300 ${
              beat.id === held
                ? "h-1.5 w-1.5 bg-accent shadow-[0_0_10px_rgba(200,255,77,0.6)]"
                : "h-1 w-1 bg-type-faint"
            }`}
          />
        ))}
      </span>
    </Link>
  );
}
