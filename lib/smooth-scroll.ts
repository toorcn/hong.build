/**
 * The one place that moves the page.
 *
 * When Lenis is driving scroll, window.scrollTo lands but Lenis's own
 * animated position doesn't know about it and drags the page back on the
 * next frame. Everything that jumps the page routes through here so the
 * jump goes to Lenis when it's live and to the window when it isn't.
 */

interface ScrollDriver {
  scrollTo(target: number, opts: { immediate: boolean; force: boolean }): void;
}

let driver: ScrollDriver | null = null;

export function attachScrollDriver(d: ScrollDriver): void {
  driver = d;
}

export function detachScrollDriver(d: ScrollDriver): void {
  if (driver === d) driver = null;
}

export function scrollToY(y: number): void {
  if (driver) driver.scrollTo(y, { immediate: true, force: true });
  else window.scrollTo(0, y);
}
