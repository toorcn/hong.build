"use client";

import { useMemo, useRef, useState } from "react";
import { useContextBridge } from "its-fine";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import Link from "next/link";
import * as THREE from "three";
import { BEATS, ROOMS, approachPose, beatT } from "@/lib/story";
import { useStoryStore } from "@/lib/story-store";
import { usePanelStore } from "@/lib/panel-store";
import { entranceSignal } from "@/lib/entrance";
import { sound } from "@/lib/sound";

/**
 * The way in — the tablet itself, dormant.
 *
 * Each chapter with a detail route has its tablet already in the room: small,
 * dark, edge-lit, hanging in front of the artifact. Clicking it is what opens
 * the full surface (PanelSurface), so entering a chapter is the same object
 * coming toward you rather than a button somewhere in the chrome.
 *
 * Only ever one exists — the nearest routed chapter — so the walk is never
 * littered with hotspots, and there's a single <Html> root rather than one per
 * beat. It's plain DOM, which also means the click doesn't depend on canvas
 * raycasting.
 */

/** How close in storyT before a chapter's tablet wakes. */
const WAKE_RANGE = 0.075;
/** Sits nearer the artifact than the opened surface does. */
const STANDOFF = 0.34;
/**
 * Bigger px→world ratio than the opened surface (1.55) because this card is
 * only 260 CSS px wide — at 1.55 it projected to 123px and the label was
 * unreadable. 2.4 lands ~190px, legible and an easy target, while still
 * clearly the small dormant version of the same object.
 */
const DISTANCE_FACTOR = 2.4;

export function TabletGate() {
  const ContextBridge = useContextBridge();
  const holder = useRef<THREE.Group>(null);
  const card = useRef<HTMLDivElement>(null);
  const live = useRef(0);
  const [beat, setBeat] = useState<number | null>(null);

  /** Chapters that have somewhere to go, with their storyT positions. */
  const routed = useMemo(
    () => BEATS.filter((b) => !!b.route).map((b) => ({ id: b.id, t: beatT(b.id) })),
    [],
  );

  const placement = useMemo(() => {
    if (beat === null) return null;
    const room = ROOMS[beat]!;
    const hero = approachPose(beat);
    const c = new THREE.Vector3(...room.center);
    const p = new THREE.Vector3(hero.x, hero.y, hero.z);
    const pos = c.clone().lerp(p, STANDOFF);
    const m = new THREE.Matrix4().lookAt(p, pos, new THREE.Vector3(0, 1, 0));
    return { pos, quat: new THREE.Quaternion().setFromRotationMatrix(m) };
  }, [beat]);

  useFrame((state, delta) => {
    const storyT = useStoryStore.getState().storyT;
    const panelOpen = usePanelStore.getState().panel !== null;

    // Nearest routed chapter, if we're standing close enough to one.
    let best: { id: number; d: number } | null = null;
    for (const r of routed) {
      const d = Math.abs(storyT - r.t);
      if (d < WAKE_RANGE && (!best || d < best.d)) best = { id: r.id, d };
    }
    const nextBeat = best?.id ?? null;
    if (nextBeat !== beat) setBeat(nextBeat);

    // Wake only when near, handed over by the entrance, and nothing is open.
    const want =
      nextBeat === null || panelOpen || entranceSignal.authority > 0
        ? 0
        : 1 - Math.min((best?.d ?? 1) / WAKE_RANGE, 1);
    const k = 1 - Math.pow(0.02, delta);
    live.current += (want - live.current) * k;

    const g = holder.current;
    if (g) {
      // A slow hang so it reads as an object in the room, not a decal.
      const t = state.clock.elapsedTime;
      g.position.y = Math.sin(t * 0.5) * 0.04;
      g.scale.setScalar(Math.max(0.0001, 0.9 + live.current * 0.1));
      g.visible = live.current > 0.02;
    }
    // Written straight to the node: per-frame React state would thrash.
    if (card.current) {
      card.current.style.opacity = `${live.current}`;
      card.current.style.pointerEvents = live.current > 0.6 ? "auto" : "none";
    }
  });

  if (beat === null || !placement) return null;
  const b = BEATS[beat]!;
  if (!b.route) return null;

  return (
    <group position={[placement.pos.x, placement.pos.y, placement.pos.z]} quaternion={placement.quat}>
      <group ref={holder}>
        <Html transform distanceFactor={DISTANCE_FACTOR} pointerEvents="auto" wrapperClass="tablet-gate-wrap">
          <ContextBridge>
            <div ref={card} className="tablet-gate" style={{ opacity: 0 }}>
              <Link
                href={b.route}
                className="focus-ring tablet-gate-face"
                onPointerEnter={() => sound.tick()}
                onClick={() => sound.enter()}
              >
                <span className="tablet-gate-bar">
                  <span className="tablet-gate-code">{b.code}</span>
                  <span className="tablet-gate-dot" aria-hidden="true" />
                </span>
                <span className="tablet-gate-label">{b.label}</span>
                <span className="tablet-gate-open">{b.routeLabel}</span>
              </Link>
            </div>
          </ContextBridge>
        </Html>
      </group>
    </group>
  );
}
