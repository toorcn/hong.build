"use client";

import { useEffect } from "react";
import { setScheme, useScheme, type Scheme } from "@/lib/theme";
import { THEME_COLOR } from "@/lib/theme-boot";
import { sound } from "@/lib/sound";

/**
 * Light / dark control, drawn as a sky dial — the companion to the record
 * player beside it. A sun and a moon ride opposite ends of one wheel behind a
 * small round window: turn it and the sun sets as the moon comes up.
 *
 * The dial's look is driven by `data-theme` on <html> in CSS, not by React
 * state, so it is already right on first paint for a visitor who chose dark.
 *
 * Turning it also turns the page: where the browser supports view
 * transitions the new scheme opens outward from the dial in a circle, and the
 * scene underneath is live inside it.
 */
export function ThemeToggle() {
  const scheme = useScheme();
  const dark = scheme === "dark";

  // The browser-chrome colour can't follow a CSS variable.
  useEffect(() => {
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute("content", THEME_COLOR[scheme]));
  }, [scheme]);

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const next: Scheme = dark ? "light" : "dark";
    sound.tick();

    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof document.startViewTransition !== "function") {
      setScheme(next);
      return;
    }

    // Open from the dial's centre, far enough to reach the furthest corner.
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    root.style.setProperty("--reveal-x", `${x}px`);
    root.style.setProperty("--reveal-y", `${y}px`);
    root.style.setProperty("--reveal-r", `${r}px`);
    root.dataset.themeReveal = "1";

    // Synchronous on purpose. The new view is live, so the scene swapping its
    // sky a frame later happens inside a circle still a few pixels wide —
    // and waiting on animation frames here would hang the page in a tab that
    // isn't being painted.
    const transition = document.startViewTransition(() => setScheme(next));
    void transition.finished.finally(() => {
      delete root.dataset.themeReveal;
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Switch to light" : "Switch to dark"}
      title={dark ? "Night — switch to day" : "Day — switch to night"}
      className="focus-ring sky-dial"
    >
      <SkyDialFace />
    </button>
  );
}

export function SkyDialFace() {
  return (
    <span className="sky-dial-window" aria-hidden="true">
      <span className="sky-dial-day" />
      <span className="sky-dial-night" />
      <span className="sky-dial-wheel">
        <span className="sky-dial-sun" />
        <span className="sky-dial-moon" />
      </span>
      <span className="sky-dial-cloud" />
      <span className="sky-dial-ground" />
    </span>
  );
}
