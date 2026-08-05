import { LabFallback } from "@/components/lab-fallback";
import { LabCanvasClient } from "@/components/lab-canvas-client";

/**
 * Server shell for the persistent scene.
 *
 * Renders the static silhouette fallback immediately (so the page is
 * meaningful before JS and usable without WebGL), then hydrates the
 * client canvas which replaces the fallback only if WebGL is available.
 */
export function LabScene() {
  return (
    <div className="lab-canvas-root" aria-hidden="true">
      <LabFallback />
      <LabCanvasClient />
    </div>
  );
}
