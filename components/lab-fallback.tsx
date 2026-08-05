"use client";

import { usePathname } from "next/navigation";
import { useEntranceStore } from "@/lib/entrance";
import { useLabStore } from "@/lib/store";

/**
 * The non-WebGL fallback is the concept's elegant free win: the five
 * resolved silhouettes themselves, rendered as static SVG. Visible until
 * the client confirms WebGL, and permanently when WebGL is unavailable.
 */
export function LabFallback() {
  const pathname = usePathname();
  const checked = useLabStore((s) => s.webglChecked);
  const available = useLabStore((s) => s.webglAvailable);
  const phase = useEntranceStore((s) => s.phase);

  // On the journey this mark is the entrance's no-WebGL reveal: it wipes in
  // during the snap, holds, and then hands the story to NarrativeFallback,
  // whose first section is the same wordmark. Staying put would mean two
  // copies of the name on one screen. Content routes keep it as a backdrop.
  const supersededByStory = pathname === "/" && phase === "done";

  // Only once we know WebGL is unavailable. Showing it before the check would
  // flash the resolved name over the entrance and give away the reveal; COLD
  // START holds the frame meanwhile, and LabScene's <noscript> copy covers
  // the case where no script runs at all.
  const visible = checked && !available && !supersededByStory;

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
