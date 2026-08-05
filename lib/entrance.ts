"use client";

import { create } from "zustand";

/**
 * COLD START — the first-load entrance.
 *
 * The site's thesis is that fragments mean nothing until you find the angle.
 * The entrance states that once, at full volume, and then hands over the
 * controls: fragments ignite from a point, land as noise at a deliberately
 * useless camera angle, hold there, and then the camera finds the angle while
 * the wordmark sets itself left-to-right out of the dust.
 *
 * Two channels, deliberately separate:
 *  - `useEntranceStore` holds coarse state the DOM needs (phase, load bytes).
 *    It changes a handful of times, so React re-renders are cheap.
 *  - `entranceSignal` is a module singleton of continuous per-frame values.
 *    The rig and the cloud live inside the <Canvas> tree and read it from
 *    useFrame, so it must never go through React.
 */

export type EntrancePhase =
  /** Void plus the status log. Nothing is drawn yet. */
  | "boot"
  /** Waiting on fragments.bin. The log reports real bytes. */
  | "load"
  /** Fragments ignite from centre and fill in as noise. */
  | "arrival"
  /** Held at the wrong angle — beautiful and meaningless. */
  | "wrong"
  /** The camera finds the angle; the mark resolves left-to-right. */
  | "snap"
  /** The resolved mark alone, no chrome. */
  | "hold"
  /** Entrance over; the journey owns the camera. */
  | "done";

/**
 * Phase durations in ms. Total after download is ~2.5s, and every phase is
 * skippable — see ColdStart's skip gestures.
 */
export const ENTRANCE_TIMING = {
  boot: 120,
  /** Floor on the load phase so a warm cache doesn't flash it. */
  loadMin: 200,
  arrival: 680,
  wrong: 460,
  snap: 920,
  hold: 240,
  /** No-WebGL path: the SVG wordmark wipes in over this instead of snapping. */
  wipe: 760,
} as const;

/**
 * The useless angle: high above and well off-axis, and pulled back.
 *
 * The beat-0 targets are unprojected from a camera at azimuth 0 / elevation
 * 10 with +-3.4 of depth jitter along each view ray, so looking down from
 * here foreshortens the wordmark into an unreadable smear. The distance
 * matters as much as the angle: the cloud's corners reach a radius of ~8.5,
 * so anything nearer puts the camera inside it and gl_PointSize blows the
 * near fragments up into blur instead of dust. Sitting well outside keeps
 * them small and sharp — a coherent object seen the wrong way, which is the
 * point, rather than mush.
 */
export const WRONG_ANGLE = {
  azimuthDeg: 46,
  elevationDeg: 62,
  distance: 17,
} as const;

/**
 * How far apart fragments are staggered during the resolve sweep — the width
 * of the leading edge as a fraction of the resolve ramp. 0 disables the sweep
 * entirely, which is what the journey uses so its beat-to-beat morphs keep
 * their existing organic seed stagger.
 */
export const SWEEP_SPREAD = 0.5;

/** How much the upper line of the wordmark leads the lower one. */
export const SWEEP_Y_LEAD = 0.22;

/**
 * The sweep window, as fractions of the snap. It starts late so meaning
 * arrives suddenly rather than fading up, and closes just before the camera
 * settles — the resolution has to read as a consequence of finding the angle,
 * not a separate event.
 *
 * uResolve travels this window linearly. Easing it as well would be wrong:
 * each fragment already smoothsteps its own resolve in the shader, and an
 * eased ramp on top compresses the whole sweep into a few frames.
 */
export const RESOLVE_FROM = 0.46;
export const RESOLVE_TO = 0.86;

/** How far past 1 fragments contract before relaxing into the mask. */
export const OVER_CONTRACT = 0.045;

/**
 * Continuous entrance signals, read per-frame inside the <Canvas>.
 * Mutated by ColdStart's rAF clock; never read during React render.
 */
export const entranceSignal = {
  /** 1 while the entrance drives the camera and cloud, 0 once handed off. */
  authority: 1,
  /** 0..1 — fragments igniting from a point at the centre of frame. */
  birth: 0,
  /** 0..1 — fraction of the fragment pool drawn. */
  density: 0,
  /** 0..1(+) — cloud resolution. Overshoots slightly at the snap. */
  resolve: 0,
  /** 0..1 — eased progress of the camera swing from wrong angle to origin. */
  snap: 0,
  /** Per-fragment resolve stagger; >0 enables the left-to-right sweep. */
  staggerSpread: 0,
};

/** Put the signal in the state the journey expects to inherit. */
export function resolveSignal(): void {
  entranceSignal.authority = 0;
  entranceSignal.birth = 1;
  entranceSignal.density = 1;
  entranceSignal.resolve = 1;
  entranceSignal.snap = 1;
  entranceSignal.staggerSpread = 0;
}

interface EntranceState {
  phase: EntrancePhase;
  /** Bytes of fragments.bin received so far. */
  loaded: number;
  /** Total bytes, from Content-Length. 0 until known. */
  total: number;
  /** True once the payload has fully decoded (or failed). */
  loadDone: boolean;
  /** ms the download took, for the log. */
  loadMs: number;
  setPhase: (phase: EntrancePhase) => void;
  setProgress: (loaded: number, total: number) => void;
  finishLoad: (ms: number) => void;
}

export const useEntranceStore = create<EntranceState>()((set) => ({
  phase: "boot",
  loaded: 0,
  total: 0,
  loadDone: false,
  loadMs: 0,
  setPhase: (phase) => set({ phase }),
  setProgress: (loaded, total) => set({ loaded, total }),
  finishLoad: (loadMs) => set({ loadDone: true, loadMs }),
}));

/* ---------- easing ---------- */

export function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Ease-in-out with a small overshoot at both ends. Drives the camera swing:
 * it eases out of the wrong angle rather than bolting from it, and settles
 * back from a few degrees past the authored one.
 *
 * A plain ease-out is wrong here — it puts the camera at the right angle
 * while the cloud is still noise, so the reveal splits into two unrelated
 * events instead of one cause and effect.
 */
export function easeInOutBack(t: number, overshoot = 0.5): number {
  const c = overshoot * 1.525;
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c + 1) * (2 * t - 2) + c) + 2) / 2;
}

export function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}
