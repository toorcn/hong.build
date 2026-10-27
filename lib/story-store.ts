"use client";

import { create } from "zustand";
import { BEAT_COUNT, beatT, scrollForStory } from "@/lib/story";
import { scrollSpineTo } from "@/lib/spine-scroll";

interface StoryState {
  /** Continuous scroll position through the journey, 0..1. */
  storyT: number;
  /** How far into the outro past the last chapter, 0..1. */
  endPull: number;
  /** The beat the camera is currently nearest to (for chrome). */
  activeBeat: number;
  /**
   * Journey position to restore when leaving a content route. `null` means
   * nothing pending — must not use `0` as empty, or returning from beat 0
   * would look identical to "no restore" and dump you at the origin by luck.
   * Consumed (cleared to null) by the spine once applied.
   */
  originT: number | null;
  /**
   * A chapter-to-chapter trip queued from a content route: return to
   * `fromBeat`, travel the journey to `toBeat`, then open `route`.
   */
  pendingJourney: { fromBeat: number; toBeat: number; route: string } | null;
  setStoryT: (t: number) => void;
  setEndPull: (p: number) => void;
  setBeat: (beat: number) => void;
  setOriginT: (t: number | null) => void;
  /**
   * Remember a chapter as the return point, and park storyT there so the
   * camera is already on that beat when "/" remounts — not at ORIGIN while
   * the spine catches up.
   */
  markReturnBeat: (beat: number) => void;
  /** Return to `from` and queue the trip to `to`'s route ("next chapter"). */
  beginChapterTravel: (from: number, to: number, route: string) => void;
  clearJourney: () => void;
  /**
   * Scroll to a beat's position on the spine.
   * `duration` overrides the default eased settle (ms) — magnets pass a
   * longer one so the pull feels soft rather than snapped.
   * `onCancel` fires if the visitor interrupts the eased scroll;
   * `onComplete` once it lands.
   */
  goToBeat: (
    beat: number,
    opts?: { duration?: number; onCancel?: () => void; onComplete?: () => void },
  ) => void;
}

/** Default for intentional rail / chrome jumps — still eased, not instant. */
const GOTO_MS = 900;

export const useStoryStore = create<StoryState>()((set) => ({
  storyT: 0,
  endPull: 0,
  activeBeat: 0,
  originT: null,
  pendingJourney: null,
  setStoryT: (storyT) => set({ storyT }),
  setEndPull: (endPull) => set({ endPull }),
  setBeat: (activeBeat) => set({ activeBeat }),
  setOriginT: (originT) => set({ originT }),
  markReturnBeat: (beat) => {
    const t = beatT(Math.min(Math.max(beat, 0), BEAT_COUNT - 1));
    set({ originT: t, storyT: t, endPull: 0, activeBeat: beat });
  },
  beginChapterTravel: (from, to, route) => {
    const beat = Math.min(Math.max(from, 0), BEAT_COUNT - 1);
    const t = beatT(beat);
    set({
      originT: t,
      storyT: t,
      endPull: 0,
      activeBeat: beat,
      pendingJourney: { fromBeat: beat, toBeat: to, route },
    });
  },
  clearJourney: () => set({ pendingJourney: null }),
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
      const range = spine.offsetHeight - window.innerHeight;
      scrollSpineTo(scrollForStory(t, spine.offsetTop, range), {
        duration: opts?.duration ?? GOTO_MS,
        onCancel: opts?.onCancel,
        onComplete: opts?.onComplete,
      });
    } else {
      set({ storyT: t, endPull: 0 });
      opts?.onComplete?.();
    }
  },
}));
