"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { beatForRoute } from "@/lib/story";
import { useLabStore } from "@/lib/store";
import { usePanelStore, type PanelPayload } from "@/lib/panel-store";
import { PanelAnchor, PanelEyebrow } from "@/components/panel-anchor";
import { ReadingLight, ResolveIn } from "@/components/panel-motion";
import { SceneNext } from "@/components/scene-next";
import { clearHandoff, getHandoff } from "@/lib/panel-handoff";

/**
 * Routes a content page either into the scene or onto a flat surface.
 *
 * With WebGL the body is registered for PanelSurface to render as a plane the
 * real camera projects. Without it — or under reduced motion, where a floating
 * tilted window is exactly the wrong idea — the same children render as an
 * ordinary document. One set of markup, two presentations; the page never
 * knows which it got.
 */
export function PanelPortal({
  title,
  sub,
  wide,
  children,
}: Omit<PanelPayload, "body" | "beat" | "handoffToken" | "handoffPreview"> & {
  children: ReactNode;
}) {
  const checked = useLabStore((s) => s.webglChecked);
  const available = useLabStore((s) => s.webglAvailable);
  const reducedMotion = useLabStore((s) => s.reducedMotion);
  const setPanel = usePanelStore((s) => s.setPanel);
  const beginClose = usePanelStore((s) => s.beginClose);

  // Which room this route belongs to — the same mapping the rig uses to hold
  // the chapter, so panel and camera can never disagree about where we are.
  const pathname = usePathname();
  const beat = beatForRoute(pathname);
  const inScene = checked && available && !reducedMotion && beat !== null;

  useEffect(() => {
    if (!inScene) {
      // Capability flipped (reduced motion toggled, WebGL lost) while a plane
      // was up — retire it, or it would hang in the room behind the flat page.
      beginClose();
      clearHandoff();
      return;
    }
    // Adopt the cursor's preview card only if it was opened for this route
    // and this is the navigation it started (the URL carries its token).
    const handoff = getHandoff();
    const token = Number(new URLSearchParams(window.location.search).get("rift"));
    const adopt =
      handoff?.token === token && handoff.beat === beat && handoff.preview.route === pathname;
    if (handoff && !adopt) clearHandoff(handoff.token);
    setPanel({
      beat: beat!,
      handoffToken: adopt ? handoff.token : undefined,
      handoffPreview: adopt ? handoff.preview : undefined,
      title,
      sub,
      wide,
      body: children,
    });
    // The plane owns scrolling, so the document must not also scroll.
    document.documentElement.dataset.inScene = "1";
    return () => {
      // Hand the plane an outro instead of yanking it: PanelSurface collapses
      // it back into the artifact and clears the store when it's done.
      beginClose();
      delete document.documentElement.dataset.inScene;
    };
  }, [inScene, beat, pathname, title, sub, wide, children, setPanel, beginClose]);

  // The scene owns the presentation; nothing to lay out here. Rendered as a
  // bare marker so the route still has a main landmark for assistive tech.
  if (inScene) {
    return (
      <>
        {/* The plane carries the visible copy; this keeps the route's landmark
            and full text in the document for assistive tech and crawlers. */}
        <div className="sr-only">
          <h1>{title}</h1>
          {children}
        </div>
        {/* Viewport chrome, deliberately not on the plane — position:fixed
            inside a CSS-3D-transformed root resolves against the transform. */}
        <PanelAnchor beat={beat ?? undefined} />
      </>
    );
  }

  // Flat fallback — the pre-existing document panel.
  return (
    <div className="content-scrim min-h-screen">
      <div
        className={`mx-auto px-5 pb-32 pt-28 sm:px-8 sm:pt-36 ${
          wide ? "max-w-5xl" : "max-w-3xl"
        }`}
      >
        <ResolveIn>
          <PanelEyebrow sub={sub} />
        </ResolveIn>
        <ResolveIn
          as="h1"
          delay={90}
          type
          className="panel-title mt-3 font-display text-5xl font-black leading-[0.95] tracking-tight text-type sm:text-7xl"
        >
          {title}
        </ResolveIn>
        <ResolveIn delay={220} className="mt-9">
          <div className="panel-threshold" aria-hidden="true" />
        </ResolveIn>
        <div className="mt-10">{children}</div>
        {beat !== null && (
          <div className="scene-next-dock scene-next-dock-flat">
            <SceneNext beat={beat} />
          </div>
        )}
      </div>
      <ReadingLight />
      <PanelAnchor />
    </div>
  );
}
