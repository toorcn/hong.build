"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme-boot";

/**
 * Which scheme is showing. The source of truth is `data-theme` on <html> —
 * absent means light, "dark" means dark — because CSS has to read it before
 * any script runs (see theme-boot.ts). This is the React view of that
 * attribute, shared by the chrome and the WebGL scene.
 */
export type Scheme = "light" | "dark";

const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (!observer) {
    observer = new MutationObserver(() => listeners.forEach((l) => l()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) {
      observer?.disconnect();
      observer = null;
    }
  };
}

export function readScheme(): Scheme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function useScheme(): Scheme {
  return useSyncExternalStore<Scheme>(subscribe, readScheme, () => "light");
}

export function setScheme(next: Scheme) {
  const root = document.documentElement;
  if (next === "dark") root.dataset.theme = "dark";
  else delete root.dataset.theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Private mode: the choice just doesn't outlive the tab.
  }
}
