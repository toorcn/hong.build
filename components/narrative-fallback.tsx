"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BEATS } from "@/lib/story";
import { SILHOUETTES } from "@/assets/silhouettes";
import { useEntranceStore } from "@/lib/entrance";
import { useLabStore } from "@/lib/store";

/**
 * No-WebGL narrative fallback. The journey becomes a normal reading page:
 * each beat is a full-height section with its resolved silhouette rendered
 * as a static SVG, the caption, and its detail link. Scroll still travels
 * the story — the morph is simply replaced by stacking.
 */
export function NarrativeFallback() {
  const [off, setOff] = useState<boolean | null>(null);
  const checked = useLabStore((s) => s.webglChecked);
  const available = useLabStore((s) => s.webglAvailable);
  const phase = useEntranceStore((s) => s.phase);

  useEffect(() => {
    if (checked) setOff(!available);
  }, [checked, available]);

  // Render nothing until we know. Held back through the entrance too: it wipes
  // the wordmark in over the void, and this page's first section is that same
  // mark — showing both at once puts two copies of the name on screen.
  if (off !== true || phase !== "done") return null;

  return (
    <div className="relative z-10">
      {BEATS.map((beat) => (
        <section
          key={beat.id}
          className="flex min-h-screen flex-col items-center justify-center px-6 py-24 text-center"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
            {beat.code} — {beat.label}
            <span className="ml-3 text-type-faint">{beat.when}</span>
          </p>
          <div
            className="mt-8 h-[52vmin] w-[52vmin] text-accent [&_svg]:h-full [&_svg]:w-full"
            role="img"
            aria-label={`${beat.label} silhouette`}
            // The silhouettes are authored constants in assets/silhouettes.ts.
            dangerouslySetInnerHTML={{ __html: SILHOUETTES[beat.silhouette] ?? "" }}
          />
          {/* Both lines, stacked. Without the dissolve to carry the turn,
              the fallback simply reads it as the next paragraph — which is
              what makes this path a real essay rather than six icons. */}
          <p className="mt-8 max-w-md text-balance font-display text-2xl leading-snug text-type">
            {beat.line}
          </p>
          <p className="mt-4 max-w-md text-balance text-base leading-relaxed text-type-dim">
            {beat.turn}
          </p>
          {beat.route ? (
            <Link
              href={beat.route}
              className="focus-ring mt-5 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-type-dim underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              {beat.routeLabel} →
            </Link>
          ) : null}
        </section>
      ))}
    </div>
  );
}
