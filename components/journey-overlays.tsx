"use client";

import type { ReactNode } from "react";
import { useLabStore } from "@/lib/store";

/**
 * Renders the live-scene overlays (captions, chapter rail, scroll cue)
 * only when WebGL is available. When it's off, NarrativeFallback takes
 * over the story instead, so these fixed overlays stay out of the way.
 */
export function JourneyOverlays({ children }: { children: ReactNode }) {
  const checked = useLabStore((s) => s.webglChecked);
  const available = useLabStore((s) => s.webglAvailable);
  if (!checked || !available) return null;
  return <>{children}</>;
}

/**
 * The scroll-spine spacer, only present when the live scene runs. When
 * WebGL is off the NarrativeFallback sections supply the page height, so
 * this collapses to nothing instead of doubling the scroll length.
 *
 * Reads the lab store synchronously — a deferred local flag used to blank
 * the spacer for one frame on every remount, which made return-from-panel
 * restore against height 0, write storyT to ORIGIN, and dump the visitor
 * back on 2017.
 */
export function WebglSpacer({ height }: { height: string }) {
  const checked = useLabStore((s) => s.webglChecked);
  const available = useLabStore((s) => s.webglAvailable);
  // Before the check completes, render nothing — avoids a flash of a long
  // empty spine for the no-WebGL path.
  if (!checked || !available) return null;
  return <div style={{ height }} aria-hidden="true" />;
}
