"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useEntranceStore } from "@/lib/entrance";
import { beatT, nearestBeat } from "@/lib/story";
import { useLabStore } from "@/lib/store";
import { useStoryStore } from "@/lib/story-store";

/**
 * How long scroll must be quiet before the magnet fires. Short enough to
 * feel intentional, long enough that trackpad inertia isn't fighting it
 * mid-fling.
 */
const SETTLE_MS = 220;

/**
 * storyT distance below which we're already on the chapter — don't
 * micro-correct and re-trigger the lock chord.
 */
const SNAP_EPS = 0.01;

/**
 * Soft magnet duration. Scaled by how far we still are from the beat so a
 * near-miss drifts in gently and a mid-dissolve take has room to breathe.
 */
const MAGNET_MS_MIN = 1100;
const MAGNET_MS_MAX = 1800;
const MAGNET_DIST_FOR_MAX = 0.08;

/**
 * The scroll spine — a tall, invisible region whose scrollY drives storyT.
 * Rendered as a sibling of the canvas so the page actually scrolls while
 * the 3D canvas stays fixed. N = BEAT_COUNT viewport-heights of scroll.
 *
 * When the visitor stops mid-dissolve, a soft magnet pulls them to the
 * nearest chapter so the silhouette reads cleanly instead of hanging as
 * half-formed noise.
 */
export function StorySpine({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const setStoryT = useStoryStore((s) => s.setStoryT);

  // The route change lands before PageTransition swaps content, so the spine
  // outlives the journey by a beat. Ignore scroll once we're leaving —
  // otherwise ScrollReset's snap-to-top would overwrite storyT with 0 and
  // the journey position would be lost before the rig can remember it.
  const active = pathname === "/";

  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;

    let raf = 0;
    let settleTimer = 0;
    // Beat we're already smooth-scrolling toward — skip re-arming the same
    // magnet if a settle fires mid-animation, but allow a new target if the
    // visitor keeps going and stops nearer a different chapter.
    let pendingSnap: number | null = null;
    // Skip the settle that follows an originT restore.
    let suppressSettle = false;

    const storyTFromScroll = () => {
      const total = el.offsetHeight - window.innerHeight;
      const y = Math.min(Math.max(window.scrollY - el.offsetTop, 0), total);
      return total > 0 ? y / total : 0;
    };

    const update = () => {
      setStoryT(storyTFromScroll());
      raf = 0;
    };

    const tryMagnet = () => {
      settleTimer = 0;
      if (suppressSettle) {
        suppressSettle = false;
        return;
      }
      // Entrance still owns the frame; a content plane owns scroll; reduced
      // motion keeps every beat resolved so there's nothing to clarify.
      if (useEntranceStore.getState().phase !== "done") return;
      if (document.documentElement.dataset.inScene === "1") return;
      const lab = useLabStore.getState();
      if (!lab.webglAvailable || lab.reducedMotion) return;

      const t = storyTFromScroll();
      const beat = nearestBeat(t);
      if (Math.abs(t - beatT(beat)) < SNAP_EPS) {
        pendingSnap = null;
        return;
      }
      if (pendingSnap === beat) return;

      const dist = Math.abs(t - beatT(beat));
      const duration =
        MAGNET_MS_MIN +
        Math.min(1, dist / MAGNET_DIST_FOR_MAX) * (MAGNET_MS_MAX - MAGNET_MS_MIN);

      pendingSnap = beat;
      useStoryStore.getState().goToBeat(beat, {
        duration,
        onCancel: () => {
          pendingSnap = null;
        },
      });
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
      if (settleTimer) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(tryMagnet, SETTLE_MS);
    };

    // Returning from a content route: land back at the beat we left from,
    // before the first update reads scrollY and reports ORIGIN.
    const { originT, setOriginT } = useStoryStore.getState();
    if (originT > 0) {
      const total = el.offsetHeight - window.innerHeight;
      suppressSettle = true;
      pendingSnap = null;
      window.scrollTo(0, el.offsetTop + originT * total);
      setOriginT(0);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      if (settleTimer) window.clearTimeout(settleTimer);
    };
  }, [setStoryT, active]);

  return (
    <div ref={ref} id="story-spine" className="relative">
      {children}
    </div>
  );
}
