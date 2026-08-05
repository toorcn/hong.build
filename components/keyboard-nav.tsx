"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { VANTAGES, VANTAGE_COUNT, type VantageId } from "@/lib/vantages";
import { bestVantage, useLabStore } from "@/lib/store";
import { sound } from "@/lib/sound";

/**
 * Keyboard access to the scene: ←/→ step between vantages, Enter opens
 * the current one. Every destination is also a plain link, so this is a
 * spatial convenience layered on conventional navigation, never a gate.
 */
export function KeyboardNav() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const state = useLabStore.getState();
      if (!state.webglAvailable || state.tourStep >= 0) return;
      // Don't steal keys from form fields or content routes.
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      if (window.location.pathname !== "/") return;

      const weights = state.weights;
      const { id } = bestVantage(weights);

      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const nextId = ((id + dir + VANTAGE_COUNT) % VANTAGE_COUNT) as VantageId;
        // Nudge the camera toward the next vantage by setting weights;
        // the rig reads tourStep=-1 so we snap via a transient tour step.
        sound.tick();
        useLabStore.getState().setTourStep((nextId + 1) as 1 | 2 | 3 | 4 | 5);
        // Return control to free orbit shortly after the fly-over.
        window.setTimeout(() => {
          const s = useLabStore.getState();
          if (s.tourStep >= 0) s.setTourStep(-1);
        }, 1600);
      }

      if (e.key === "Enter") {
        const { id: bestId, weight } = bestVantage(useLabStore.getState().weights);
        if (weight >= 0.5) {
          e.preventDefault();
          sound.enter();
          router.push(VANTAGES[bestId]!.route);
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
