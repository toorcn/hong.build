"use client";

import { VANTAGES } from "@/lib/vantages";
import { bestVantage, useLabStore, useSignalStore } from "@/lib/store";

function signalBar(weight: number): string {
  const filled = Math.round(Math.min(weight, 1) * 7);
  return "▓".repeat(filled) + "░".repeat(7 - filled);
}

/**
 * Persistent orientation instrument. Always shows where you are, how
 * close you are to meaning, and what to do next. Mono, quiet, art-directed.
 */
export function Hud() {
  const azimuthDeg = useLabStore((s) => s.azimuthDeg);
  const weights = useLabStore((s) => s.weights);
  const locked = useLabStore((s) => s.locked);
  const alignment = useLabStore((s) => s.alignment);
  const webglAvailable = useLabStore((s) => s.webglAvailable);

  // Discrete vantage from the lab store (updates on lock/alignment changes);
  // live weight from the signal channel (updates ~12fps for a smooth meter).
  const { id } = bestVantage(weights);
  const weight = useSignalStore((s) => s.bestWeight);
  const vantage = VANTAGES[id]!;
  const az = ((azimuthDeg % 360) + 360) % 360;

  if (!webglAvailable) return null;

  return (
    <>
      {/* Compact mobile readout — sits above the vantage switcher. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-16 z-20 flex justify-center sm:hidden">
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-type-faint">
          <span className={alignment === "LOCKED" ? "text-accent" : "text-type-dim"}>
            {vantage.code}·{vantage.label}
          </span>
          {"  "}
          <span className="tnum">{signalBar(weight)}</span>
          {"  "}
          {alignment === "LOCKED" ? "tap enter" : "resolve"}
        </div>
      </div>

      {/* Full desktop instrument cluster. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 hidden sm:block">
      <div className="flex items-end justify-between px-8 pb-6">
        {/* Left: position + signal */}
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-type-faint">
          <div className="tnum">azimuth {az.toFixed(1)}°</div>
          <div className="mt-1.5 tnum">
            signal <span className="text-accent">{signalBar(weight)}</span> {weight.toFixed(2)}
          </div>
          <div className="mt-1.5">
            alignment:{" "}
            <span className={alignment === "LOCKED" ? "text-accent" : "text-type-dim"}>
              {alignment}
            </span>
          </div>
        </div>

        {/* Right: nearest vantage + next action */}
        <div className="text-right font-mono text-[10px] uppercase tracking-[0.18em]">
          <div className="text-type-faint">nearest</div>
          <div className={`mt-1.5 ${alignment === "LOCKED" ? "text-accent" : "text-type-dim"}`}>
            {vantage.code} / {vantage.label}
          </div>
          <div className="mt-1.5 text-type-faint">
            {alignment === "LOCKED" ? "double-click to enter →" : "drag to resolve"}
          </div>
          {locked !== null && (
            <div className="mt-1.5">
              <span className="text-accent">● {VANTAGES[locked]!.label} resolved</span>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
