import { LabFallback } from "@/components/lab-fallback";
import { LabCanvasClient } from "@/components/lab-canvas-client";

/**
 * Server shell for the persistent scene.
 *
 * With JS the entrance holds the frame and the canvas takes over once WebGL
 * is confirmed; LabFallback appears only when it isn't. Without JS neither
 * runs, so the <noscript> copy carries the identity on its own.
 */
export function LabScene() {
  return (
    <div className="lab-canvas-root" aria-hidden="true">
      <LabFallback />
      <LabCanvasClient />
      <noscript>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-[14vmin] font-black leading-[0.9] tracking-tight text-accent">
            HONG
            <br />
            BING
          </span>
        </div>
      </noscript>
    </div>
  );
}
