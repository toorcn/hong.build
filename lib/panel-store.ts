"use client";

import { create } from "zustand";
import type { ReactNode } from "react";

/**
 * Hand-off for the in-scene reading surface.
 *
 * Content routes are Server Components rendering into `main`, but the panel
 * has to be a child of <Canvas> to be projected by the real camera. Rather
 * than duplicate the markup, ContentPanel registers its rendered children
 * here and PanelSurface — which lives inside the Canvas — renders them.
 *
 * Holding React elements in a store is fine: they're inert descriptors, and
 * RSC output passed as `children` to a Client Component crosses the boundary
 * as data. Nothing here is a function.
 */
export interface PanelPayload {
  beat: number;
  title: string;
  sub?: string;
  wide: boolean;
  body: ReactNode;
}

interface PanelState {
  panel: PanelPayload | null;
  /**
   * Set when the route has gone but the plane still has to collapse back into
   * the artifact. PanelSurface clears `panel` once the outro finishes — if the
   * portal cleared it directly the plane would vanish on the same frame the
   * route changed, which is exactly the page-swap feel this is meant to avoid.
   */
  closing: boolean;
  setPanel: (p: PanelPayload) => void;
  beginClose: () => void;
  clear: () => void;
}

export const usePanelStore = create<PanelState>()((set) => ({
  panel: null,
  closing: false,
  setPanel: (panel) => set({ panel, closing: false }),
  beginClose: () => set({ closing: true }),
  clear: () => set({ panel: null, closing: false }),
}));
