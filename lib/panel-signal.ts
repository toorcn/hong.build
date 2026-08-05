"use client";

/**
 * The panel → scene bridge.
 *
 * A content route is a beat held open behind a reading surface. Reading it
 * should disturb the world: addressing a row surges the cloud, and the
 * pointer carries a reading light across it. That coupling is what stops a
 * content page from feeling like a separate document parked over the scene.
 *
 * Same shape and reasoning as `entranceSignal` in lib/entrance.ts — a module
 * singleton of continuous per-frame values, deliberately NOT React state.
 * The rig and the cloud live inside the <Canvas> tree and read this from
 * useFrame, so it must never cause a re-render.
 */
export const panelSignal = {
  /**
   * Target interest, 0..1. Written by DOM handlers on hover/focus; the rig
   * eases toward it, so a flick across three rows reads as one swell rather
   * than three steps.
   */
  energy: 0,
  /** Pointer position over the panel, normalised -1..1 from centre. */
  px: 0,
  py: 0,
  /**
   * Scroll-out exit, 0..1. Driven by overscroll past the panel bottom (or an
   * authored fly-out on Escape). Only the floating window moves — chrome stays.
   */
  exit: 0,
};

/** Reset between routes so a stale hover can't hold the cloud bright. */
export function clearPanelSignal(): void {
  panelSignal.energy = 0;
  panelSignal.px = 0;
  panelSignal.py = 0;
  panelSignal.exit = 0;
}

/** Push exit progress onto the signal (0..1). */
export function setPanelExit(progress: number): void {
  panelSignal.exit = Math.min(1, Math.max(0, progress));
}
