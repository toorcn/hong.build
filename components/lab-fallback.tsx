"use client";

import { useLabStore } from "@/lib/store";

/**
 * The non-WebGL fallback is the concept's elegant free win: the five
 * resolved silhouettes themselves, rendered as static SVG. Visible until
 * the client confirms WebGL, and permanently when WebGL is unavailable.
 */
export function LabFallback() {
  const checked = useLabStore((s) => s.webglChecked);
  const available = useLabStore((s) => s.webglAvailable);

  // Before hydration we haven't checked yet: show the fallback so the
  // page is never empty. Once WebGL is confirmed, the canvas covers it.
  const visible = !checked || !available;

  return (
    <div
      data-lab-fallback
      className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <svg
        viewBox="0 0 1000 1000"
        className="h-[72vmin] w-[72vmin] text-accent"
        role="img"
        aria-label="The name HONG BING, resolved from a cloud of fragments"
      >
        <text
          x="500"
          y="430"
          textAnchor="middle"
          fill="currentColor"
          fontFamily="var(--font-display)"
          fontWeight="900"
          fontSize="218"
          letterSpacing="2"
        >
          HONG
        </text>
        <text
          x="500"
          y="640"
          textAnchor="middle"
          fill="currentColor"
          fontFamily="var(--font-display)"
          fontWeight="900"
          fontSize="218"
          letterSpacing="2"
        >
          BING
        </text>
      </svg>
    </div>
  );
}
