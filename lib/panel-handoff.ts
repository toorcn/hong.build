/**
 * The rift hand-off.
 *
 * Clicking a chapter in the cloud opens a preview card under the cursor. When
 * the route then opens, the in-scene window should grow out of that card
 * rather than appear from nowhere — so the card's rect and contents are held
 * here across the navigation, keyed by a token the URL carries (`?rift=`),
 * and PanelSurface adopts it: the window starts at the card's rect and the
 * card's text releases as the real content resolves in.
 *
 * Phases: pending (route loading) → preflight (window posed and sized to
 * the card) → claimed (corners verified against the card) → adopting
 * (window animating out of the card) → ready (settled; the hand-off clears
 * on the next frame).
 *
 * Module state with a subscribe/snapshot pair so components can read it
 * through useSyncExternalStore, and the html dataset mirrors the phase so
 * CSS can hide the card and the window at the right moments.
 */

/** What the cursor's preview card shows for a chapter that opens a route. */
export interface HandoffPreview {
  route: string;
  code: string;
  label: string;
  title: string;
  excerpt: string;
}

export type HandoffPhase = "pending" | "preflight" | "claimed" | "adopting" | "ready";

export interface PanelHandoff {
  token: number;
  beat: number;
  preview: HandoffPreview;
  /** Viewport rect of the cursor preview card at the moment of the click. */
  sourceRect: { left: number; top: number; width: number; height: number };
  phase: HandoffPhase;
}

let lastToken = 0;
let current: PanelHandoff | null = null;
let detachPop: (() => void) | null = null;
const listeners = new Set<() => void>();

function write(next: PanelHandoff | null): void {
  current = next;
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (next) {
      root.dataset.panelHandoff = next.phase;
      root.dataset.panelHandoffToken = String(next.token);
    } else {
      delete root.dataset.panelHandoff;
      delete root.dataset.panelHandoffToken;
      detachPop?.();
      detachPop = null;
    }
  }
  listeners.forEach((l) => l());
}

export function getHandoff(): PanelHandoff | null {
  return current;
}

export function getHandoffServer(): PanelHandoff | null {
  return null;
}

export function subscribeHandoff(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Capture the open preview card as the source of a hand-off to `preview.route`.
 * Returns the token to put in the URL, or null when there is nothing to hand
 * off (reduced motion, no card on screen, or one already in flight).
 */
export function beginHandoff(
  beat: number,
  preview: HandoffPreview,
  reducedMotion: boolean,
): number | null {
  if (reducedMotion) {
    clearHandoff();
    return null;
  }
  if (current) return null;
  const card = document.querySelector(".site-cursor-preview");
  const rect = card?.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) return null;

  const token = ++lastToken;
  write({
    token,
    beat,
    preview: { ...preview },
    sourceRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    phase: "pending",
  });

  // Back out before the route lands and the hand-off would otherwise wait
  // forever for a window that is never going to open.
  const onPop = () => {
    if (current?.token === token && location.pathname !== preview.route) clearHandoff(token);
  };
  window.addEventListener("popstate", onPop);
  detachPop = () => window.removeEventListener("popstate", onPop);
  return token;
}

/** Move the hand-off from one phase to the next, if it is still the live one. */
export function advanceHandoff(
  token: number,
  from: HandoffPhase,
  to: HandoffPhase,
): boolean {
  if (!current || current.token !== token || current.phase !== from) return false;
  write({ ...current, phase: to });
  return true;
}

/** The window has settled: drop the token from the URL and retire the hand-off. */
export function completeHandoff(token: number): void {
  if (!advanceHandoff(token, "adopting", "ready")) return;
  const url = new URL(window.location.href);
  if (url.searchParams.get("rift") === String(token)) {
    url.searchParams.delete("rift");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }
  requestAnimationFrame(() => {
    if (current?.token === token && current.phase === "ready") write(null);
  });
}

export function clearHandoff(token?: number): void {
  if (current && (token === undefined || current.token === token)) write(null);
}
