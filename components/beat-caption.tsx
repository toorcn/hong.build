"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BEATS } from "@/lib/story";
import { useStoryStore } from "@/lib/story-store";

/**
 * In-world narrative captions. Each beat's short line sits low in the frame
 * and crossfades as the camera travels. The optional "read more" link opens
 * the detail route (which pauses the journey). Long-form reading lives on
 * those routes — captions stay punchy.
 */
export function BeatCaption() {
  const activeBeat = useStoryStore((s) => s.activeBeat);
  const storyT = useStoryStore((s) => s.storyT);
  const [visible, setVisible] = useState(0);

  // Crossfade the caption when the active beat changes.
  useEffect(() => {
    setVisible(0);
    const id = window.setTimeout(() => setVisible(1), 180);
    return () => window.clearTimeout(id);
  }, [activeBeat]);

  const beat = BEATS[activeBeat];
  if (!beat) return null;

  // Fade captions out near the very start (before first scroll).
  const introOpacity = storyT < 0.005 && activeBeat === 0 ? 0.95 : 1;

  return (
    <div
      // Revealed last: the resolved mark holds the frame alone for a beat
      // before the journey's copy arrives.
      style={{ "--reveal-delay": "300ms" } as React.CSSProperties}
      className="entrance-hide pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center px-6 pb-24 sm:pb-20"
    >
      <div
        className="max-w-md text-center transition-all duration-300"
        style={{
          opacity: visible * introOpacity,
          transform: `translateY(${(1 - visible) * 12}px)`,
        }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
          {beat.code} — {beat.label}
        </p>
        <p className="mt-3 text-balance font-display text-xl leading-snug text-type sm:text-2xl">
          {beat.caption}
        </p>
        {beat.route ? (
          <Link
            href={beat.route}
            className="focus-ring pointer-events-auto mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-type-dim underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
          >
            {beat.routeLabel} →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
