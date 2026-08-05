/**
 * Eased window scroll along the story spine.
 *
 * Browser `behavior: "smooth"` is opaque and usually too snappy for a
 * magnetic settle — this owns duration and easing so the pull into a
 * chapter can feel slow and soft rather than like a CSS snap.
 */

let raf = 0;
let detachAbort: (() => void) | null = null;
let onCancelCb: (() => void) | null = null;

/** Soft ease-in-out — slow to leave, slower to arrive. */
function easeInOutQuint(t: number): number {
  return t < 0.5
    ? 16 * t * t * t * t * t
    : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

export function cancelSpineScroll(opts?: { silent?: boolean }): void {
  const had = raf !== 0;
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  detachAbort?.();
  detachAbort = null;
  const cb = onCancelCb;
  onCancelCb = null;
  // Replacements (new scrollSpineTo) pass silent so the outgoing magnet
  // doesn't clear the incoming pendingSnap before it arms.
  if (had && !opts?.silent) cb?.();
}

export interface SpineScrollOpts {
  /** Animation length in ms. */
  duration?: number;
  /** Fired if the visitor interrupts (wheel / touch / key). */
  onCancel?: () => void;
}

/**
 * Animate window scrollY to `top`. Any wheel / touch / key from the
 * visitor cancels so the magnet never fights intentional travel.
 */
export function scrollSpineTo(top: number, opts: SpineScrollOpts = {}): void {
  const { duration = 1100, onCancel } = opts;
  cancelSpineScroll({ silent: true });
  onCancelCb = onCancel ?? null;

  const from = window.scrollY;
  const delta = top - from;
  if (Math.abs(delta) < 1) {
    onCancelCb = null;
    return;
  }

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    window.scrollTo(0, top);
    onCancelCb = null;
    return;
  }

  const start = performance.now();
  const ms = Math.max(400, duration);

  const abort = () => cancelSpineScroll();
  window.addEventListener("wheel", abort, { passive: true });
  window.addEventListener("touchstart", abort, { passive: true });
  window.addEventListener("keydown", abort);
  detachAbort = () => {
    window.removeEventListener("wheel", abort);
    window.removeEventListener("touchstart", abort);
    window.removeEventListener("keydown", abort);
    detachAbort = null;
  };

  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / ms);
    window.scrollTo(0, from + delta * easeInOutQuint(p));
    if (p < 1) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
      detachAbort?.();
      onCancelCb = null;
    }
  };
  raf = requestAnimationFrame(tick);
}
