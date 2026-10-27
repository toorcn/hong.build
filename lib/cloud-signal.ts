import type { HandoffPreview } from "@/lib/panel-handoff";

/**
 * Whether the pointer is over the fragment cloud, and whether what it's
 * over opens a route. Written by the scene's pointer probe, read by the
 * site cursor — module state plus a window event, because the writer runs
 * inside the render loop and must not re-render React to say so.
 */
export const cloudSignal: {
  hot: boolean;
  openable: boolean;
  preview: HandoffPreview | null;
} = { hot: false, openable: false, preview: null };

export const CLOUD_HOT_EVENT = "psite:cloud-hot";

export function setCloudHot(hot: boolean, preview: HandoffPreview | null = null): void {
  const next = hot ? preview : null;
  const openable = next !== null;
  if (cloudSignal.hot === hot && cloudSignal.openable === openable && cloudSignal.preview === next)
    return;
  cloudSignal.hot = hot;
  cloudSignal.openable = openable;
  cloudSignal.preview = next;
  if (typeof document === "undefined") return;
  document.documentElement.toggleAttribute("data-cloud-hot", hot);
  document.documentElement.toggleAttribute("data-cloud-openable", cloudSignal.openable);
  window.dispatchEvent(new Event(CLOUD_HOT_EVENT));
}

export function clearCloudHot(): void {
  setCloudHot(false);
}
