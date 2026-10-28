"use client";

import Image from "next/image";
import { nearestBeat, resolveAmount } from "@/lib/story";
import { useStoryStore } from "@/lib/story-store";

export interface Memory {
  src: string;
  ratio: "portrait" | "landscape" | "square" | "wide";
}

const RATIO = {
  portrait: "aspect-[4/5]",
  landscape: "aspect-[3/2]",
  square: "aspect-square",
  wide: "aspect-[16/10]",
} as const;

/**
 * A photograph from the chapter, surfacing like a memory under the caption
 * once the cloud has resolved. Only beats with a photo in `ready` get one;
 * the rest stay text.
 */
export function BeatMemory({ ready }: { ready: Partial<Record<number, Memory>> }) {
  const storyT = useStoryStore((s) => s.storyT);
  const resolved = resolveAmount(storyT);
  const memory = ready[nearestBeat(storyT)];
  if (!memory) return null;
  const opacity = 0.72 * Math.max(0, (resolved - 0.55) / 0.45);

  return (
    <div
      aria-hidden
      style={{ "--reveal-delay": "220ms", opacity } as React.CSSProperties}
      className="entrance-hide pointer-events-none fixed inset-x-0 bottom-0 z-[8] flex justify-center px-6 pb-[16.5rem] transition-opacity duration-300 sm:pb-36"
    >
      <figure className="dream-plate dream-plate--memory w-full max-w-lg">
        <div className={`dream-plate-frame ${RATIO[memory.ratio]}`}>
          <Image
            src={memory.src}
            alt=""
            fill
            sizes="(min-width: 640px) 34rem, 86vw"
            className="dream-plate-img"
          />
          <div className="dream-plate-veil" />
          <div className="dream-plate-glow" />
        </div>
      </figure>
    </div>
  );
}
