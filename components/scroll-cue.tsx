"use client";

import { useStoryStore } from "@/lib/story-store";

/** Scroll cue shown only at the very start, dissolving once you begin. */
export function ScrollCue() {
  const storyT = useStoryStore((s) => s.storyT);
  const gone = storyT > 0.01;
  return (
    <div
      aria-hidden={gone}
      // Last thing to arrive — the invitation to travel, once there is
      // something to travel through.
      style={{ "--reveal-delay": "480ms" } as React.CSSProperties}
      className={`entrance-hide pointer-events-none fixed inset-x-0 bottom-6 z-10 flex flex-col items-center gap-2 transition-opacity duration-500 ${
        gone ? "opacity-0" : "opacity-100"
      }`}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-type-faint">
        scroll to travel
      </span>
      <span className="block h-8 w-px animate-pulse bg-gradient-to-b from-accent to-transparent" />
    </div>
  );
}
