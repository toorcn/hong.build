"use client";

import { create } from "zustand";
import { BEAT_COUNT } from "@/lib/story";

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
  /** Scroll to a beat's position on the spine. */
  goToBeat: (beat: number) => void;
}

export const useStoryStore = create<StoryState>()((set) => ({
  storyT: 0,
  activeBeat: 0,
  originT: 0,
  setStoryT: (storyT) => set({ storyT }),
  setBeat: (activeBeat) => set({ activeBeat }),
  setOriginT: (originT) => set({ originT }),
  goToBeat: (beat) => {
    const clamped = Math.min(Math.max(beat, 0), BEAT_COUNT - 1);
    const t = clamped / (BEAT_COUNT - 1);
    // Scroll the window so the spine observer picks it up and animates.
    const spine = document.getElementById("story-spine");
    if (spine) {
      const y = spine.offsetTop + t * (spine.offsetHeight - window.innerHeight);
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    set({ storyT: t });
  },
}));
