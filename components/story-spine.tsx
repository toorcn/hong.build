"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useStoryStore } from "@/lib/story-store";

/**
 * The scroll spine — a tall, invisible region whose scrollY drives storyT.
 * Rendered as a sibling of the canvas so the page actually scrolls while
 * the 3D canvas stays fixed. N = BEAT_COUNT viewport-heights of scroll.
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
    const update = () => {
      const total = el.offsetHeight - window.innerHeight;
      const y = Math.min(Math.max(window.scrollY - el.offsetTop, 0), total);
      const t = total > 0 ? y / total : 0;
      setStoryT(t);
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    // Returning from a content route: land back at the beat we left from,
    // before the first update reads scrollY and reports ORIGIN.
    const { originT, setOriginT } = useStoryStore.getState();
    if (originT > 0) {
      const total = el.offsetHeight - window.innerHeight;
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
    };
  }, [setStoryT, active]);

  return (
    <div ref={ref} id="story-spine" className="relative">
      {children}
    </div>
  );
}
