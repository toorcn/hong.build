"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEntranceStore } from "@/lib/entrance";
import { scrollToY } from "@/lib/smooth-scroll";
import { sound } from "@/lib/sound";
import {
  SAY_HI_PULL,
  beatT,
  nearestBeat,
  scrollForStory,
  storyFromScroll,
} from "@/lib/story";
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
 * PageTransition remounts the home tree ~160ms after the route swap (key
 * flip). Keep the return bookmark alive past that so a second mount can
 * re-apply it instead of reading scrollY=0 and parking on 2017.
 */
const ORIGIN_HOLD_MS = 450;

/** End pull below which the magnet stays out of the outro. */
const OUTRO_MAGNET_EPS = 0.06;

/** "Next chapter" travel: long enough to read the rooms going past. */
const CHAPTER_TRAVEL_MS = 1700;

/**
 * The scroll spine — a tall, invisible region whose scrollY drives storyT.
 * Rendered as a sibling of the canvas so the page actually scrolls while
 * the 3D canvas stays fixed. BEAT_COUNT * 96vh of journey, then a 100vh
 * outro whose pull hands the visitor to /contact.
 *
 * When the visitor stops mid-dissolve, a soft magnet pulls them to the
 * nearest chapter so the silhouette reads cleanly instead of hanging as
 * half-formed noise.
 */
export function StorySpine({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const setStoryT = useStoryStore((s) => s.setStoryT);
  const setEndPull = useStoryStore((s) => s.setEndPull);
  const pendingJourney = useStoryStore((s) => s.pendingJourney);

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
    let retryRaf = 0;
    let releaseTimer = 0;
    // Beat we're already smooth-scrolling toward — skip re-arming the same
    // magnet if a settle fires mid-animation, but allow a new target if the
    // visitor keeps going and stops nearer a different chapter.
    let pendingSnap: number | null = null;
    // Skip the settle that follows an originT restore.
    let suppressSettle = false;
    // Re-armed once the pull falls back, so the outro only fires once per
    // approach rather than on every scroll event past the threshold.
    let sayHiArmed = true;

    const readScroll = () => {
      const total = el.offsetHeight - window.innerHeight;
      const y = Math.min(Math.max(window.scrollY - el.offsetTop, 0), total);
      return storyFromScroll(y, total);
    };

    /**
     * Apply a pending return-from-panel origin. Parks storyT immediately so
     * the camera stays on the chapter even when the spacer hasn't laid out
     * yet. Only releases the bookmark after the scroll has real height AND
     * the page-transition remount window has passed.
     */
    const tryRestore = () => {
      const { originT } = useStoryStore.getState();
      if (originT === null) return true;

      // Always park the camera on the chapter — never let a zero-height
      // frame write storyT back to ORIGIN over this.
      setStoryT(originT);
      setEndPull(0);

      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return false;

      suppressSettle = true;
      pendingSnap = null;
      sayHiArmed = true;
      scrollToY(scrollForStory(originT, el.offsetTop, total));

      if (!releaseTimer) {
        releaseTimer = window.setTimeout(() => {
          releaseTimer = 0;
          const still = useStoryStore.getState().originT;
          // Only clear if nothing newer was stamped meanwhile.
          if (still === originT) {
            useStoryStore.getState().setOriginT(null);
          }
        }, ORIGIN_HOLD_MS);
      }
      return true;
    };

    const update = () => {
      const { originT } = useStoryStore.getState();
      if (originT !== null) {
        tryRestore();
        raf = 0;
        return;
      }
      const { storyT, endPull } = readScroll();
      setStoryT(storyT);
      setEndPull(endPull);
      if (endPull < SAY_HI_PULL * 0.5) sayHiArmed = true;
      if (
        sayHiArmed &&
        endPull >= SAY_HI_PULL &&
        useEntranceStore.getState().phase === "done" &&
        document.documentElement.dataset.inScene !== "1"
      ) {
        sayHiArmed = false;
        sound.enter();
        router.push("/contact");
      }
      raf = 0;
    };

    const tryMagnet = () => {
      settleTimer = 0;
      if (suppressSettle) {
        suppressSettle = false;
        return;
      }
      if (useStoryStore.getState().originT !== null) return;
      // Entrance still owns the frame; a content plane owns scroll; reduced
      // motion keeps every beat resolved so there's nothing to clarify.
      if (useEntranceStore.getState().phase !== "done") return;
      if (document.documentElement.dataset.inScene === "1") return;
      const lab = useLabStore.getState();
      if (!lab.webglAvailable || lab.reducedMotion) return;

      const { storyT: t, endPull } = readScroll();
      // The outro is its own gesture — don't magnet the visitor back out of it.
      if (endPull > OUTRO_MAGNET_EPS) {
        pendingSnap = null;
        return;
      }
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

    const onResize = () => {
      tryRestore();
      onScroll();
    };

    if (!tryRestore()) {
      const retry = () => {
        if (tryRestore()) {
          retryRaf = 0;
          return;
        }
        retryRaf = requestAnimationFrame(retry);
      };
      retryRaf = requestAnimationFrame(retry);
    } else if (useStoryStore.getState().originT === null) {
      update();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
      if (retryRaf) cancelAnimationFrame(retryRaf);
      if (settleTimer) window.clearTimeout(settleTimer);
      // Don't clear releaseTimer's originT on unmount — the remount needs it.
      if (releaseTimer) window.clearTimeout(releaseTimer);
    };
  }, [setStoryT, setEndPull, active, router]);

  // "Next chapter" from a content route: once the return to the origin
  // chapter has landed, travel the journey to the next one and open it.
  useEffect(() => {
    if (!active || !pendingJourney) return;
    const el = ref.current;
    if (!el) return;
    const { fromBeat, toBeat, route } = pendingJourney;
    let done = false;
    let raf = 0;
    const tick = () => {
      if (done) return;
      const total = el.offsetHeight - window.innerHeight;
      if (
        total <= 0 ||
        (useStoryStore.getState().originT !== null &&
          Math.abs(
            window.scrollY - scrollForStory(beatT(fromBeat), el.offsetTop, total),
          ) > 4)
      ) {
        raf = requestAnimationFrame(tick);
        return;
      }
      done = true;
      useStoryStore.getState().setOriginT(null);
      useStoryStore.getState().clearJourney();
      useStoryStore.getState().goToBeat(toBeat, {
        duration: CHAPTER_TRAVEL_MS,
        onComplete: () => router.push(route),
      });
    };
    raf = requestAnimationFrame(tick);
    return () => {
      done = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [active, pendingJourney, router]);

  return (
    <div ref={ref} id="story-spine" className="relative">
      {children}
    </div>
  );
}
