"use client";

import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLabStore } from "@/lib/store";
import { panelSignal, clearPanelSignal } from "@/lib/panel-signal";
import { sound } from "@/lib/sound";

/**
 * Motion for the reading layer.
 *
 * The world's grammar is fragments resolving out of noise, so content arrives
 * the same way — blurred and loose, settling sharp — rather than sliding in
 * from an edge like a marketing page. Everything here degrades to an instant
 * state change under prefers-reduced-motion.
 */

/** Shared observer: one instance for every row on the page, not one each. */
function useResolveOnView<T extends HTMLElement>(reducedMotion: boolean) {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    // Already in frame on load (above the fold) — resolve without waiting.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  return { ref, shown };
}

/**
 * `as` makes these components polymorphic, and TS intersects the props of
 * every possible intrinsic element down to `never`. Casting the tag is the
 * standard escape hatch — call sites still get checked against the element
 * they pass in.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const poly = (t: ElementType) => t as any;

/**
 * Resolves its children in when they reach the frame. `delay` staggers a
 * stack so a list assembles rather than popping as one slab.
 */
export function ResolveIn({
  children,
  as = "div",
  delay = 0,
  className = "",
  type = false,
  ...rest
}: {
  children: ReactNode;
  as?: ElementType;
  /** ms of stagger within a group. */
  delay?: number;
  className?: string;
  /** Also collapse letter-spacing — for short display type only. */
  type?: boolean;
} & Record<string, unknown>) {
  const reducedMotion = useLabStore((s) => s.reducedMotion);
  const { ref, shown } = useResolveOnView<HTMLElement>(reducedMotion);
  const Tag = poly(as);

  return (
    <Tag
      ref={ref}
      className={`resolve-in ${type ? "resolve-in-type" : ""} ${className}`}
      data-resolved={shown ? "1" : "0"}
      style={{ "--resolve-delay": `${delay}ms` } as React.CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * A row that reports itself to the scene. Hover or keyboard focus surges the
 * cloud behind the panel and ticks — the page and the world share one state,
 * so addressing a row here is visible out there.
 *
 * Pass `href` for a navigating row rather than `as={Link}`: these pages are
 * Server Components, and a component is a function, which cannot cross the
 * RSC boundary. `as` therefore only takes intrinsic tag names ("li", "div").
 */
export function LiveRow({
  children,
  as = "div",
  href,
  className = "",
  delay = 0,
  ...rest
}: {
  children: ReactNode;
  /** Intrinsic tag name only — see note above. */
  as?: keyof React.JSX.IntrinsicElements;
  /** When set, the row renders as a next/link anchor. */
  href?: string;
  className?: string;
  delay?: number;
} & Record<string, unknown>) {
  const reducedMotion = useLabStore((s) => s.reducedMotion);
  const { ref, shown } = useResolveOnView<HTMLElement>(reducedMotion);

  const engage = () => {
    panelSignal.energy = 1;
    sound.tick();
  };
  const release = () => {
    panelSignal.energy = 0;
  };

  const shared = {
    className: `panel-row resolve-in ${className}`,
    "data-resolved": shown ? "1" : "0",
    style: { "--resolve-delay": `${delay}ms` } as React.CSSProperties,
    onPointerEnter: engage,
    onPointerLeave: release,
    onFocus: engage,
    onBlur: release,
    ...rest,
  };

  if (href) {
    return (
      <Link href={href} ref={ref as React.Ref<HTMLAnchorElement>} {...shared}>
        {children}
      </Link>
    );
  }

  const Tag = poly(as);
  return (
    <Tag ref={ref} {...shared}>
      {children}
    </Tag>
  );
}

/**
 * The reading light — a soft accent pool that tracks the pointer across the
 * panel and feeds the same position to the scene. Cheap, and it's the thing
 * that stops a long column of type from feeling inert.
 */
export function ReadingLight() {
  const reducedMotion = useLabStore((s) => s.reducedMotion);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // A stale hover must not hold the cloud bright across a route change.
  useEffect(() => clearPanelSignal, [pathname]);

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let x = 0;
    let y = 0;
    let on = false;

    const write = () => {
      el.style.setProperty("--lx", `${x}px`);
      el.style.setProperty("--ly", `${y}px`);
      el.style.setProperty("--lo", on ? "1" : "0");
      panelSignal.px = (x / window.innerWidth) * 2 - 1;
      panelSignal.py = (y / window.innerHeight) * 2 - 1;
      raf = 0;
    };
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      on = true;
      if (!raf) raf = requestAnimationFrame(write);
    };
    const leave = () => {
      on = false;
      if (!raf) raf = requestAnimationFrame(write);
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;
  return <div ref={ref} className="reading-light" aria-hidden="true" />;
}

/**
 * Counts up to a figure once it's on screen. The run log's whole argument is
 * in the ratio between "entered" and "nothing", so the numbers earn the
 * emphasis — a static figure reads as decoration.
 */
export function CountUp({ to, duration = 900 }: { to: number; duration?: number }) {
  const reducedMotion = useLabStore((s) => s.reducedMotion);
  const { ref, shown } = useResolveOnView<HTMLSpanElement>(reducedMotion);
  const [n, setN] = useState(reducedMotion ? to : 0);

  useEffect(() => {
    if (!shown || reducedMotion) {
      if (reducedMotion) setN(to);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const step = (ts: number) => {
      start ??= ts;
      const p = Math.min((ts - start) / duration, 1);
      // Same ease as --ease-signal, so it lands with everything else.
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [shown, to, duration, reducedMotion]);

  return (
    <span ref={ref} className="tnum">
      {n}
    </span>
  );
}
