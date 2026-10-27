"use client";

import { useStoryStore } from "@/lib/story-store";

/**
 * Scroll cue shown at the very start, dissolving once you begin — and again
 * at the last chapter, where the next scroll is the one that says hi.
 */
export function ScrollCue() {
  const storyT = useStoryStore((s) => s.storyT);
  const endPull = useStoryStore((s) => s.endPull);
  const atEnd = storyT >= 0.96 && endPull < 0.18;
  const shown = storyT <= 0.01 || atEnd;
  return (
    <div
      aria-hidden={!shown}
      // Last thing to arrive — the invitation to travel, once there is
      // something to travel through.
      style={{ "--reveal-delay": "480ms" } as React.CSSProperties}
      className={`entrance-hide pointer-events-none fixed inset-x-0 bottom-[4.5rem] z-10 flex flex-col items-center gap-2 transition-opacity duration-500 sm:bottom-6 ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-type-faint">
        {atEnd ? "scroll to say hi" : "scroll to travel"}
      </span>
      <span className="block h-5 w-px animate-pulse bg-gradient-to-b from-accent to-transparent sm:h-8" />
    </div>
  );
}
