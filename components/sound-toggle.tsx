"use client";

import { useEffect } from "react";
import { useLabStore } from "@/lib/store";
import { useEntranceStore } from "@/lib/entrance";
import { MUTED_STORAGE_KEY as STORAGE_KEY, sound } from "@/lib/sound";

/**
 * Sound control, drawn as a small record player: the arm drops onto a
 * spinning record while the bed is running and lifts off when muted.
 * Defaults to on; the choice persists.
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
    window.addEventListener("pointerdown", start, { passive: true, once: true });
    window.addEventListener("keydown", start, { once: true });
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
      data-on={muted ? "0" : "1"}
      aria-pressed={!muted}
      aria-label={muted ? "Turn sound on" : "Turn sound off"}
      title={muted ? "Sound off" : "Sound on"}
      className="focus-ring sound-disc"
    >
      <span className="sound-disc-platter" aria-hidden="true">
        <span className="sound-disc-index" />
        <span className="sound-disc-scan" />
        <span className="sound-disc-record" />
        <span className="sound-disc-label" />
        <span className="sound-disc-arm" />
      </span>
      <span className="sound-disc-caption" aria-hidden="true">
        <span className="sound-disc-caption-label">ambient</span>
        <span className="sound-disc-meter">
          <i />
          <i />
          <i />
        </span>
        <span className="sound-disc-caption-state">{muted ? "muted" : "running"}</span>
      </span>
    </button>
  );
}
