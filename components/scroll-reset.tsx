"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { scrollToY } from "@/lib/smooth-scroll";

/**
 * Keeps window scroll honest across route changes. The home page is a tall
 * scroll spine; detail routes are normal-length. When you land on a detail
 * route the browser may restore the spine's deep scrollY, leaving you
 * mid-page — this snaps to top on any non-home route.
 */
export function ScrollReset() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname !== "/") {
      scrollToY(0);
    }
  }, [pathname]);
  return null;
}
