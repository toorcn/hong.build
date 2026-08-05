"use client";

import { useRouter } from "next/navigation";
import { VANTAGES, type VantageId } from "@/lib/vantages";
import { useLabStore } from "@/lib/store";
import { sound } from "@/lib/sound";

/**
 * Touch-friendly segmented control that flies directly to each vantage.
 * Shown only on small screens where drag precision is unreliable —
 * touch targets never depend on hover or fine pointer movement.
 */
export function VantageSwitcher() {
  const router = useRouter();
  const setTourStep = useLabStore((s) => s.setTourStep);
  const setIntroPlaying = useLabStore((s) => s.setIntroPlaying);
  const locked = useLabStore((s) => s.locked);
  const webglAvailable = useLabStore((s) => s.webglAvailable);

  if (!webglAvailable) return null;

  const jump = (id: VantageId) => {
    sound.tick();
    setIntroPlaying(false);
    // Reuse the tour fly-over to move the camera to the vantage.
    setTourStep((id + 1) as 1 | 2 | 3 | 4 | 5);
    window.setTimeout(() => {
      const s = useLabStore.getState();
      if (s.tourStep === id + 1) s.setTourStep(-1);
    }, 1600);
  };

  const enterLocked = () => {
    if (locked === null) return;
    sound.enter();
    router.push(VANTAGES[locked]!.route);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 pb-24 sm:hidden">
      <div className="pointer-events-auto mx-auto flex max-w-md items-stretch justify-center gap-1 px-5">
        {VANTAGES.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => jump(v.id)}
            aria-label={`Fly to ${v.label}`}
            className={`focus-ring flex-1 border px-1 py-2.5 font-mono text-[9px] uppercase tracking-[0.1em] transition-colors ${
              locked === v.id
                ? "border-accent text-accent"
                : "border-line text-type-faint"
            }`}
          >
            {v.code}
          </button>
        ))}
        <button
          type="button"
          onClick={enterLocked}
          disabled={locked === null}
          aria-label="Enter resolved vantage"
          className="focus-ring flex-1 border border-accent bg-accent px-1 py-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-void transition-colors disabled:opacity-30"
        >
          enter
        </button>
      </div>
    </div>
  );
}
