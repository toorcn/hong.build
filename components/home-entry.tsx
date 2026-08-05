"use client";

import { useEffect } from "react";
import { useLabStore } from "@/lib/store";

/**
 * On first mount, trigger the reverse-teach intro: the camera starts
 * resolved on V0 and drifts off-axis so the visitor watches the name
 * crumble into noise — the metaphor taught in two seconds, no copy.
 * Respects reduced motion (no drift).
 */
export function HomeEntry() {
  const reducedMotion = useLabStore((s) => s.reducedMotion);
  const setIntroPlaying = useLabStore((s) => s.setIntroPlaying);

  useEffect(() => {
    if (reducedMotion) {
      setIntroPlaying(false);
      return;
    }
    setIntroPlaying(true);
  }, [reducedMotion, setIntroPlaying]);

  return null;
}
