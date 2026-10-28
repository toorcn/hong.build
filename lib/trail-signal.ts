/**
 * The pointer is over the walk's track. The scene works out which way the
 * track runs under the pointer (screen angle, and whether it heads into or
 * out of the screen) and which chapter it leads to; the cursor turns into
 * an arrow along it with the destination beside.
 */
export type TrailDir = "forward" | "back";
export type TrailDepth = "in" | "out";

export const trailSignal: {
  hot: boolean;
  /** Screen angle of the track under the pointer, degrees. */
  angle: number;
  dir: TrailDir;
  depth: TrailDepth;
  /** Destination beat id, or -1. */
  dest: number;
  destCode: string;
  destLabel: string;
} = {
  hot: false,
  angle: 0,
  dir: "forward",
  depth: "in",
  dest: -1,
  destCode: "",
  destLabel: "",
};

export const TRAIL_HOT_EVENT = "psite:trail-hot";

export function setTrailHot(hot: boolean): void {
  if (trailSignal.hot === hot) return;
  trailSignal.hot = hot;
  if (typeof document === "undefined") return;
  document.documentElement.toggleAttribute("data-trail-hot", hot);
  document.documentElement.dataset.trailDir = hot ? trailSignal.dir : "";
  window.dispatchEvent(new Event(TRAIL_HOT_EVENT));
}

export function setTrailVector(v: {
  angle: number;
  dir: TrailDir;
  depth: TrailDepth;
  dest: number;
  destCode: string;
  destLabel: string;
}): void {
  trailSignal.angle = v.angle;
  trailSignal.depth = v.depth;
  trailSignal.dest = v.dest;
  trailSignal.destCode = v.destCode;
  trailSignal.destLabel = v.destLabel;
  if (trailSignal.dir === v.dir) return;
  trailSignal.dir = v.dir;
  if (typeof document !== "undefined" && trailSignal.hot)
    document.documentElement.dataset.trailDir = v.dir;
}

export function resetTrailSignal(): void {
  trailSignal.hot = false;
  trailSignal.dir = "forward";
  trailSignal.depth = "in";
  trailSignal.angle = 0;
  trailSignal.dest = -1;
  trailSignal.destCode = "";
  trailSignal.destLabel = "";
  if (typeof document === "undefined") return;
  document.documentElement.removeAttribute("data-trail-hot");
  delete document.documentElement.dataset.trailDir;
  window.dispatchEvent(new Event(TRAIL_HOT_EVENT));
}
