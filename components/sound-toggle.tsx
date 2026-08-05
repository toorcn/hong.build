"use client";

import { useEffect } from "react";
import { useLabStore } from "@/lib/store";
import { useEntranceStore } from "@/lib/entrance";
import { sound } from "@/lib/sound";

const STORAGE_KEY = "lab.muted";

/**
 * Sound control. Defaults to on; the choice persists.
 * Ambient only begins after the cold start releases it (or immediately on
 * returning visits). Browsers still need a gesture before audio can play.
 */
export function SoundToggle() {
  const muted = useLabStore((s) => s.muted);
  const setMuted = useLabStore((s) => s.setMuted);
  const phase = useEntranceStore((s) => s.phase);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === null) {
      setMuted(false);
      sound.setMuted(false);
      return;
    }
    const next = saved === "1";
    setMuted(next);
    sound.setMuted(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After the entrance (or when it was skipped), start the bed on the first
  // gesture if sound is preferred on. ColdStart also calls beginAmbient on
  // finish — this covers returning visits and autoplay-blocked finishes.
  useEffect(() => {
    if (muted || phase !== "done") return;

    const start = () => {
      sound.beginAmbient();
    };

    start();
    window.addEventListener("pointerdown", start, { passive: true });
    window.addEventListener("keydown", start);
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
  }, [muted, phase]);

  const toggle = () => {
    const next = !muted;
    setMuted(next);
    sound.setMuted(next);
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    if (!next) {
      void sound.unlock().then(() => {
        sound.beginAmbient();
        sound.tick();
      });
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
