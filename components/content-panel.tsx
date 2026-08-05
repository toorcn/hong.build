import type { ReactNode } from "react";
import { PanelPortal } from "@/components/panel-portal";

/**
 * A content route's reading surface.
 *
 * Presentation is decided at runtime by capability, not here: with WebGL the
 * body becomes a plane standing in its chapter's room, projected by the real
 * camera (see PanelSurface). Without it, the same children render as an
 * ordinary scrolling document. Pages stay semantic and unaware of which.
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
    <PanelPortal title={title} sub={sub} wide={wide}>
      {children}
    </PanelPortal>
  );
}
