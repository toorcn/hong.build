"use client";

import { useRouter } from "next/navigation";
import { nextRouteBeat } from "@/lib/story";
import { useStoryStore } from "@/lib/story-store";
import { useLabStore } from "@/lib/store";
import { sound } from "@/lib/sound";

/**
 * "Next chapter" at the foot of a content route. With the scene live it
 * doesn't jump straight there: it returns to this chapter and travels the
 * journey to the next one, so the rooms in between go past on the way.
 */
export function SceneNext({ beat }: { beat: number }) {
  const router = useRouter();
  const next = nextRouteBeat(beat);
  if (!next?.route) return null;
  const route = next.route;

  return (
    <button
      type="button"
      className="scene-next"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        sound.enter();
        const lab = useLabStore.getState();
        if (lab.webglAvailable && !lab.reducedMotion) {
          useStoryStore.getState().beginChapterTravel(beat, next.id, route);
          router.push("/");
        } else {
          router.push(route);
        }
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <span className="scene-next-kicker">next chapter</span>
      <span className="scene-next-title">{next.routeLabel ?? next.label}</span>
      <span className="scene-next-arrow" aria-hidden="true">
        →
      </span>
    </button>
  );
}
