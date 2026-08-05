import type { ReactNode } from "react";

/**
 * Calm editorial panel rendered above the dimmed scene. Content pages
 * stay in semantic HTML and normal document scroll — the 3D world is
 * atmosphere behind them, never a container for them.
 */
export function ContentPanel({
  code,
  title,
  children,
  wide = false,
}: {
  code: string;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="content-scrim min-h-screen">
      <div
        className={`mx-auto px-5 pb-32 pt-28 sm:px-8 sm:pt-36 ${
          wide ? "max-w-5xl" : "max-w-3xl"
        }`}
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
          {"// "}
          {code}
        </p>
        <h1 className="mt-3 font-display text-5xl font-black leading-[0.95] tracking-tight text-type sm:text-7xl">
          {title}
        </h1>
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}
