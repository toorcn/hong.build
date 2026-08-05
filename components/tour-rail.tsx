"use client";

import { useRouter } from "next/navigation";
import { NAV } from "@/content/site";
import { useLabStore, type TourStep } from "@/lib/store";
import { sound } from "@/lib/sound";

const STOPS = [
  { step: 0, code: "00", label: "CALIBRATE", route: "/" },
  { step: 1, code: "01", label: "IDENTITY", route: "/about" },
  { step: 2, code: "02", label: "WORK", route: "/work" },
  { step: 3, code: "03", label: "PROCESS", route: "/process" },
  { step: 4, code: "04", label: "SIGNALS", route: "/notes" },
  { step: 5, code: "05", label: "CONTACT", route: "/contact" },
] as const;

/**
 * Guided-route progress rail. The tour flies the camera between vantages
 * over the SAME scene and content — it's a recommended sequence, not a
 * second site. next / previous / exit / skip-to-destination always visible.
 */
export function TourRail() {
  const router = useRouter();
  const tourStep = useLabStore((s) => s.tourStep);
  const setTourStep = useLabStore((s) => s.setTourStep);

  if (tourStep < 0) return null;

  const idx = tourStep;

  const go = (step: TourStep) => {
    sound.tick();
    setTourStep(step);
    const target = STOPS[step as number];
    if (target) router.push(target.route);
  };

  const exit = () => {
    setTourStep(-1);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-6 sm:pb-8">
      <div className="pointer-events-auto flex items-center gap-1 border border-line bg-void/90 px-2 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => go(Math.max(0, idx - 1) as TourStep)}
          disabled={idx === 0}
          aria-label="Previous stop"
          className="focus-ring px-3 py-2 font-mono text-[11px] text-type-dim transition-colors hover:text-type disabled:opacity-30"
        >
          ←
        </button>

        <div className="flex items-center gap-1 px-1">
          {STOPS.map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => go(s.step as TourStep)}
              aria-label={`Stop ${s.code}: ${s.label}`}
              aria-current={s.step === idx ? "step" : undefined}
              className={`focus-ring px-2 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                s.step === idx ? "text-accent" : "text-type-faint hover:text-type-dim"
              }`}
            >
              <span className="hidden sm:inline">{s.code}·{s.label}</span>
              <span className="sm:hidden">{s.code}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(Math.min(STOPS.length - 1, idx + 1) as TourStep)}
          disabled={idx === STOPS.length - 1}
          aria-label="Next stop"
          className="focus-ring px-3 py-2 font-mono text-[11px] text-type-dim transition-colors hover:text-type disabled:opacity-30"
        >
          →
        </button>

        <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />

        <button
          type="button"
          onClick={exit}
          className="focus-ring px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-type-faint transition-colors hover:text-accent"
        >
          exit tour
        </button>
      </div>
    </div>
  );
}

/** Skip-to-destination list, shown during the tour on the home stop. */
export function TourSkipLinks() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {NAV.map((n) => (
        <a
          key={n.href}
          href={n.href}
          className="focus-ring font-mono text-[10px] uppercase tracking-[0.16em] text-type-faint underline decoration-line underline-offset-4 transition-colors hover:text-accent"
        >
          skip to {n.label.toLowerCase()}
        </a>
      ))}
    </div>
  );
}
