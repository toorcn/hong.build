"use client";

import Link from "next/link";
import { BEATS, resolveAmount, storyPosition } from "@/lib/story";
import { useStoryStore } from "@/lib/story-store";

/** How resolved the chapter must be before its door is offered. */
const OPEN_AT = 0.72;

/**
 * The visible way into a chapter's detail route. The tablet in the scene
 * is the diegetic door; this is the plain one, for anyone who doesn't
 * think to click the room. Only shows while the chapter is resolved.
 */
export function BeatOpen() {
  const storyT = useStoryStore((s) => s.storyT);
  const { from, to, mix } = storyPosition(storyT);
  const resolved = resolveAmount(storyT);
  const beat = BEATS[mix < 0.5 ? from : to];
  if (!beat?.route) return null;
  const shown = resolved > OPEN_AT;

  return (
    <div
      style={{ "--reveal-delay": "360ms" } as React.CSSProperties}
      className="entrance-hide pointer-events-none fixed z-20 max-sm:inset-x-0 max-sm:bottom-[7.5rem] max-sm:flex max-sm:justify-center sm:bottom-6 sm:left-auto sm:right-6 lg:bottom-[22%] lg:left-8 lg:right-auto"
      aria-hidden={!shown}
    >
      <Link
        href={beat.route}
        tabIndex={shown ? 0 : -1}
        data-cursor="link"
        className="focus-ring beat-open pointer-events-auto"
        style={{ opacity: shown ? 1 : 0 }}
        aria-label={`Open ${beat.routeLabel}`}
      >
        <span className="beat-open-kicker">open</span>
        <span className="beat-open-label">{beat.routeLabel}</span>
        <span className="beat-open-arrow" aria-hidden="true">
          →
        </span>
      </Link>
    </div>
  );
}
