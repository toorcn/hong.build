import type { ReactNode } from "react";
import { PanelAnchor, PanelEyebrow } from "@/components/panel-anchor";

/**
 * Calm editorial panel rendered above the receded scene. Content pages stay
 * in semantic HTML and normal document scroll — the 3D world is atmosphere
 * behind them, never a container for them.
 *
 * The header sits in the scrim's open zone so the held silhouette still
 * reads behind the title; the threshold hairline marks where the document
 * proper begins. Chapter labelling comes from the route, not a prop.
 */
export function ContentPanel({
  title,
  children,
  sub,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  /** Extra path segment for detail routes, e.g. a project slug. */
  sub?: string;
  wide?: boolean;
}) {
  return (
    <div className="content-scrim min-h-screen">
      <div
        className={`mx-auto px-5 pb-32 pt-28 sm:px-8 sm:pt-36 ${
          wide ? "max-w-5xl" : "max-w-3xl"
        }`}
      >
        <PanelEyebrow sub={sub} />
        <h1 className="panel-title mt-3 font-display text-5xl font-black leading-[0.95] tracking-tight text-type sm:text-7xl">
          {title}
        </h1>
        <div className="panel-threshold mt-9" aria-hidden="true" />
        <div className="mt-10">{children}</div>
      </div>
      <PanelAnchor />
    </div>
  );
}
