"use client";

import { create } from "zustand";

/**
 * Scene capability store — what the environment supports. Narrative state
 * (storyT, activeBeat) lives in story-store.ts; this is only the flags the
 * scene shell and chrome need.
 */
interface LabState {
  /** Sound on/off. Persisted by the toggle component. */
  muted: boolean;
  /** True once WebGL availability has been determined on the client. */
  webglChecked: boolean;
  webglAvailable: boolean;
  /** True when the user prefers reduced motion (or we couldn't tell). */
  reducedMotion: boolean;

  setMuted: (muted: boolean) => void;
  setWebgl: (available: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
}

export const useLabStore = create<LabState>()((set) => ({
  muted: true,
  webglChecked: false,
  webglAvailable: false,
  reducedMotion: false,

  setMuted: (muted) => set({ muted }),
  setWebgl: (webglAvailable) => set({ webglAvailable, webglChecked: true }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}));
