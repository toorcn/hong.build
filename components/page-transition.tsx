"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useLabStore } from "@/lib/store";

/**
 * Route-change transitions. A few authored fades with consistent easing —
 * never scroll hijacking or long unskippable motion. Reduced motion swaps
 * to an immediate state change.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useLabStore((s) => s.reducedMotion);
  const [displayed, setDisplayed] = useState(pathname);
  const [visible, setVisible] = useState(true);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (pathname === displayed) return;

    if (reducedMotion) {
      // Immediate crossfade: swap and show, no travel.
      setDisplayed(pathname);
      return;
    }

    setVisible(false);
    const t = window.setTimeout(() => {
      setDisplayed(pathname);
      setVisible(true);
    }, 160);
    return () => window.clearTimeout(t);
  }, [pathname, displayed, reducedMotion]);

  return (
    <div
      key={displayed}
      className="transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {children}
    </div>
  );
}
