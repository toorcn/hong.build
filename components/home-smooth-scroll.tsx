"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useEntranceStore } from "@/lib/entrance";
import { attachScrollDriver, detachScrollDriver } from "@/lib/smooth-scroll";
import { useLabStore } from "@/lib/store";

/**
 * Inertial scroll for the journey on desktop pointers. The camera rides
 * scrollY, so a stepped mouse wheel reads as the camera lurching between
 * notches; Lenis smooths the wheel into one continuous travel.
 *
 * Off for touch (native momentum is already smooth), narrow screens,
 * reduced motion, and without WebGL — the fallback is a plain reading page.
 * Waits for the entrance so it never fights the cold start's scroll lock.
 */
const SMOOTH_QUERY =
  "(min-width: 769px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

export function HomeSmoothScroll() {
  const entranceDone = useEntranceStore((s) => s.phase === "done");
  const webgl = useLabStore((s) => s.webglAvailable);

  useEffect(() => {
    if (!entranceDone || !webgl) return;
    const mq = window.matchMedia(SMOOTH_QUERY);
    let lenis: Lenis | null = null;

    const stop = () => {
      if (!lenis) return;
      const l = lenis;
      lenis = null;
      detachScrollDriver(l);
      l.destroy();
    };

    const sync = () => {
      if (!mq.matches) {
        stop();
        return;
      }
      if (lenis) return;
      lenis = new Lenis({
        autoRaf: true,
        anchors: true,
        lerp: 0.08,
        smoothWheel: true,
        syncTouch: false,
        respectReducedMotion: true,
        stopInertiaOnNavigate: true,
      });
      attachScrollDriver(lenis);
    };

    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      stop();
    };
  }, [entranceDone, webgl]);

  return null;
}
