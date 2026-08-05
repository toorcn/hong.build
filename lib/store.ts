"use client";

import { create } from "zustand";
import { VANTAGE_COUNT, VANTAGES, type VantageId } from "@/lib/vantages";

export type AlignmentState = "SEEKING" | "CLOSE" | "LOCKED";
export type TourStep = -1 | 0 | 1 | 2 | 3 | 4 | 5; // -1 = off, 0 = calibrate, 1..5 = stops

interface LabState {
  /** Live camera azimuth, degrees. */
  azimuthDeg: number;
  /** Live camera elevation, degrees. */
  elevationDeg: number;
  /** Per-vantage alignment weights 0..1 (index = vantage id). */
  weights: number[];
  /** Vantage currently locked, or null. */
  locked: VantageId | null;
  alignment: AlignmentState;
  /** True while the opening reverse-teach drift is playing. */
  introPlaying: boolean;
  /** Sound on/off. Persisted by the toggle component. */
  muted: boolean;
  /** Guided tour step; -1 = not touring. */
  tourStep: TourStep;
  /** True once WebGL availability has been determined on the client. */
  webglChecked: boolean;
  webglAvailable: boolean;
  /** True when the user prefers reduced motion (or we couldn't tell). */
  reducedMotion: boolean;

  setCamera: (azimuthDeg: number, elevationDeg: number) => void;
  setWeights: (weights: number[]) => void;
  setLocked: (locked: VantageId | null) => void;
  setAlignment: (a: AlignmentState) => void;
  setIntroPlaying: (playing: boolean) => void;
  setMuted: (muted: boolean) => void;
  setTourStep: (step: TourStep) => void;
  setWebgl: (available: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
}

export const useLabStore = create<LabState>()((set) => ({
  azimuthDeg: VANTAGES[0]!.azimuthDeg,
  elevationDeg: VANTAGES[0]!.elevationDeg,
  weights: new Array(VANTAGE_COUNT).fill(0),
  locked: null,
  alignment: "SEEKING",
  introPlaying: true,
  muted: true,
  tourStep: -1,
  webglChecked: false,
  webglAvailable: false,
  reducedMotion: false,

  setCamera: (azimuthDeg, elevationDeg) => set({ azimuthDeg, elevationDeg }),
  setWeights: (weights) => set({ weights }),
  setLocked: (locked) => set({ locked }),
  setAlignment: (alignment) => set({ alignment }),
  setIntroPlaying: (introPlaying) => set({ introPlaying }),
  setMuted: (muted) => set({ muted }),
  setTourStep: (tourStep) => set({ tourStep }),
  setWebgl: (webglAvailable) => set({ webglAvailable, webglChecked: true }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}));

/** Best-aligned vantage id and its weight, derived from weights. */
export function bestVantage(weights: number[]): { id: VantageId; weight: number } {
  let id = 0 as VantageId;
  let weight = 0;
  for (let i = 0; i < weights.length; i++) {
    if ((weights[i] ?? 0) > weight) {
      weight = weights[i]!;
      id = i as VantageId;
    }
  }
  return { id, weight };
}

/**
 * High-frequency signal channel. The rig throttles live best-weight here
 * (~12fps) so the HUD's signal meter animates smoothly during a drag,
 * without touching the discrete lab store 60x/second. HUD-only.
 */
interface SignalState {
  bestWeight: number;
  setBestWeight: (w: number) => void;
}
export const useSignalStore = create<SignalState>()((set) => ({
  bestWeight: 0,
  setBestWeight: (bestWeight) => set({ bestWeight }),
}));
