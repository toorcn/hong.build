"use client";

import { useRouter } from "next/navigation";
import { useLabStore } from "@/lib/store";
import { sound } from "@/lib/sound";

/**
 * Entry action for the guided route. Starts the calibration sequence
 * over the same scene — flies to the first stop and raises the rail.
 */
export function StartTourButton() {
  const router = useRouter();
  const setTourStep = useLabStore((s) => s.setTourStep);
  const setIntroPlaying = useLabStore((s) => s.setIntroPlaying);

  const start = () => {
    sound.tick();
    setIntroPlaying(false);
    setTourStep(0);
    router.push("/");
  };

  return (
    <button
      type="button"
      onClick={start}
      className="focus-ring border border-accent bg-accent px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-void transition-colors hover:bg-transparent hover:text-accent"
    >
      Start calibration
    </button>
  );
}
