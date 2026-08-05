"use client";

import { create } from "zustand";
import { BEAT_COUNT, beatT } from "@/lib/story";
import { scrollSpineTo } from "@/lib/spine-scroll";

interface StoryState {
  /** Continuous scroll position through the journey, 0..1. */
  storyT: number;
  /** The beat the camera is currently nearest to (for chrome). */
  activeBeat: number;
  /**
   * Journey position at the moment a content route was opened, so returning
   * puts you back where you left instead of at ORIGIN. Consumed (reset to 0)
   * by the spine once restored.
   */
  originT: number;
  setStoryT: (t: number) => void;
  setBeat: (beat: number) => void;
  setOriginT: (t: number) => void;
  /**
   * Scroll to a beat's position on the spine.
   * `duration` overrides the default eased settle (ms) — magnets pass a
   * longer one so the pull feels soft rather than snapped.
   * `onCancel` fires if the visitor interrupts the eased scroll.
   */
  goToBeat: (
    beat: number,
    opts?: { duration?: number; onCancel?: () => void },
  ) => void;
}

/** Default for intentional rail / chrome jumps — still eased, not instant. */
const GOTO_MS = 900;

export const useStoryStore = create<StoryState>()((set) => ({
  storyT: 0,
  activeBeat: 0,
  originT: 0,
  setStoryT: (storyT) => set({ storyT }),
  setBeat: (activeBeat) => set({ activeBeat }),
  setOriginT: (originT) => set({ originT }),
  goToBeat: (beat, opts) => {
    const clamped = Math.min(Math.max(beat, 0), BEAT_COUNT - 1);
    // Beats are unevenly spaced along storyT (see lib/story.ts) — ask for
    // the position rather than assuming a uniform division.
    const t = beatT(clamped);
    // Scroll the window so the spine observer picks storyT up from scrollY.
    // Don't set storyT here: a premature jump would flash the resolved beat
    // then dissolve again as scroll events rewrite it.
    const spine = document.getElementById("story-spine");
    if (spine) {
      const y = spine.offsetTop + t * (spine.offsetHeight - window.innerHeight);
      scrollSpineTo(y, {
        duration: opts?.duration ?? GOTO_MS,
        onCancel: opts?.onCancel,
      });
    } else {
      set({ storyT: t });
    }
  },
}));
