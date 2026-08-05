"use client";

import { useEffect } from "react";
import { useLabStore } from "@/lib/store";
import { sound } from "@/lib/sound";

const STORAGE_KEY = "lab.muted";

/**
 * Always-visible sound control. Default muted; the choice persists.
 * Sound only ever starts after this gesture.
 */
export function SoundToggle() {
  const muted = useLabStore((s) => s.muted);
  const setMuted = useLabStore((s) => s.setMuted);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      setMuted(saved === "1");
      sound.setMuted(saved === "1");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    sound.setMuted(next);
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    if (!next) {
      void sound.unlock();
      sound.tick();
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={!muted}
      aria-label={muted ? "Turn sound on" : "Turn sound off"}
      className="focus-ring flex items-center gap-2 border border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-type-dim transition-colors hover:border-accent hover:text-type"
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${muted ? "bg-type-faint" : "bg-accent"}`}
        aria-hidden="true"
      />
      {muted ? "sound off" : "sound on"}
    </button>
  );
}
