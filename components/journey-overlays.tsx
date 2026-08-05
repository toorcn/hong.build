"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLabStore } from "@/lib/store";

/**
 * Renders the live-scene overlays (captions, chapter rail, scroll cue)
 * only when WebGL is available. When it's off, NarrativeFallback takes
 * over the story instead, so these fixed overlays stay out of the way.
 */
export function JourneyOverlays({ children }: { children: ReactNode }) {
  const [on, setOn] = useState(false);
  const checked = useLabStore((s) => s.webglChecked);
  const available = useLabStore((s) => s.webglAvailable);

  useEffect(() => {
    setOn(checked && available);
  }, [checked, available]);

  if (!on) return null;
  return <>{children}</>;
}

/**
 * The scroll-spine spacer, only present when the live scene runs. When
 * WebGL is off the NarrativeFallback sections supply the page height, so
 * this collapses to nothing instead of doubling the scroll length.
 */
export function WebglSpacer({ height }: { height: string }) {
  const [on, setOn] = useState<boolean | null>(null);
  const checked = useLabStore((s) => s.webglChecked);
  const available = useLabStore((s) => s.webglAvailable);

  useEffect(() => {
    if (checked) setOn(available);
  }, [checked, available]);

  // Before the check completes, render nothing — avoids a flash of a long
  // empty spine for the no-WebGL path.
  if (on !== true) return null;
  return <div style={{ height }} aria-hidden="true" />;
}
