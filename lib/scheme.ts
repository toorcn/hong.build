"use client";

import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScheme, type Scheme } from "@/lib/theme";

/**
 * The WebGL scene's side of the theme: CSS reads `data-theme` through its
 * tokens (app/globals.css), but shaders can't, so the scene's colours and
 * blending are switched here from the same value (lib/theme.ts).
 */
export { useScheme };
export type { Scheme };

export interface SkyPalette {
  top: string;
  mid: string;
  low: string;
  glow: string;
}

interface Inks {
  accent: string;
  slate: string;
}

interface ScenePalette extends Inks {
  /** Clear colour, and what shows before the sky has drawn. */
  ground: string;
  /** The route between rooms. Its own inks where the shared ones lose it. */
  trail?: Inks;
  /** A sky behind the scene instead of the flat ground (components/lab-sky.tsx). */
  sky?: SkyPalette;
}

/**
 * Scene colours per scheme. Keep in step with the tokens in app/globals.css.
 *
 * Light is a dawn sky: indigo ink on blue falling to peach. The trail gets
 * heavier inks than the dust it runs through, because a thread of pale motes
 * is a glow on black but nearly nothing on a bright sky.
 */
export const SCENE: Record<Scheme, ScenePalette> = {
  light: {
    ground: "#dfe6f6",
    accent: "#27248f",
    slate: "#9aa6cf",
    trail: { accent: "#1d1a7a", slate: "#5b60c4" },
    sky: { top: "#9fbcee", mid: "#d3cff2", low: "#f8d6c4", glow: "#ffe9cc" },
  },
  dark: { ground: "#0a0b0d", accent: "#c8ff4d", slate: "#4a5468" },
};

/**
 * On black the fragments are light: additive, so density reads as glow. On
 * paper they are ink: each point multiplies the page darker, so density reads
 * as weight. Same shaders, the dual blend.
 */
export function sceneBlend(scheme: Scheme) {
  if (scheme === "dark") return { blending: THREE.AdditiveBlending } as const;
  return {
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.ZeroFactor,
    blendDst: THREE.OneMinusSrcColorFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
  } as const;
}

/**
 * Points a fragment material at the active scheme. In ink mode the shader's
 * colours are the light each point *removes* (the complement of the ink), so
 * every brightness term in the shaders keeps its meaning: dimmer is fainter
 * in both schemes. `uInk` tells the shader to premultiply for the blend above.
 *
 * Written from the frame loop, through the material: r3f gives the material
 * its own uniform slots, so a number has to be set on `material.uniforms`, and
 * doing it ahead of the draw means there is never a frame of ink blend with
 * light colours — which shows as the complement, purple for lime.
 */
export function useSceneScheme(
  material: RefObject<THREE.ShaderMaterial | null>,
  layer: "fragments" | "trail" = "fragments",
): Scheme {
  const scheme = useScheme();
  const applied = useRef("");
  useFrame(() => {
    const m = material.current;
    if (!m) return;
    const key = `${m.uuid}:${scheme}`;
    if (applied.current === key) return;
    applied.current = key;
    const palette = SCENE[scheme];
    const { accent, slate } = (layer === "trail" && palette.trail) || palette;
    const ink = scheme === "light";
    for (const [name, hex] of [["uAccent", accent], ["uSlate", slate]] as const) {
      const c = m.uniforms[name]?.value;
      if (!(c instanceof THREE.Color)) continue;
      c.set(hex);
      if (ink) c.setRGB(1 - c.r, 1 - c.g, 1 - c.b);
    }
    if (m.uniforms.uInk) m.uniforms.uInk.value = ink ? 1 : 0;
  }, -1);
  return scheme;
}
