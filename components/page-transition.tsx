"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useLabStore } from "@/lib/store";
import "./directory-transition.css";

/**
 * Route-change transitions. A few authored fades with consistent easing —
 * never scroll hijacking or long unskippable motion. Reduced motion swaps
 * to an immediate state change.
 *
 * Deliberately no `key={pathname}` remount: remounting home after a panel
 * return wiped the scroll restore and dumped the visitor back on 2017.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useLabStore((s) => s.reducedMotion);
  const [visible, setVisible] = useState(true);
  const first = useRef(true);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      prevPath.current = pathname;
      return;
    }
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    if (reducedMotion) return;

    setVisible(false);
    const t = window.setTimeout(() => setVisible(true), 40);
    return () => window.clearTimeout(t);
  }, [pathname, reducedMotion]);

  return (
    <div
      className="transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {pathname === "/humans" || pathname === "/agents" ? (
        <div key={pathname} className="directory-transition">{children}</div>
      ) : children}
    </div>
  );
}
