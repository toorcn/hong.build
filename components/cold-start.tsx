"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SITE } from "@/content/site";
import { BEAT_TARGET_COUNT, FRAGMENT_TOTAL } from "@/lib/generated/fragments-meta";
import {
  ENTRANCE_FORCE_PARAM,
  ENTRANCE_SEEN_KEY as SEEN_KEY,
} from "@/lib/entrance-boot";
import { useLabStore } from "@/lib/store";
import { sound } from "@/lib/sound";
import {
  ENTRANCE_TIMING as T,
  OVER_CONTRACT,
  RESOLVE_FROM,
  RESOLVE_TO,
  SWEEP_SPREAD,
  clamp01,
  easeInOutBack,
  easeOutQuint,
  entranceSignal,
  resolveSignal,
  useEntranceStore,
  type EntrancePhase,
} from "@/lib/entrance";

/** Where in the snap the accent flash fires — the peak of the over-contract. */
const FLASH_AT = 0.92;

/**
 * COLD START — the first-load entrance.
 *
 * Owns a rAF clock that walks the phase machine and writes entranceSignal,
 * which the rig and cloud read inside the <Canvas>. Renders the status log,
 * the skip affordance and the accent flash; everything else on screen is
 * hidden by the `.entrance-hide` CSS until the phase reaches "done".
 *
 * Immersive by default: chrome stays hidden until hold ends. Skip is Escape
 * or the explicit skip control — not every click. Ambient music starts only
 * once the reveal finishes. Force with `/?entrance=1`.
 */
export function ColdStart() {
  const pathname = usePathname();

  // Whether this mount is a fresh landing on the journey. Captured once:
  // navigating home later in the session must not replay the entrance.
  const eligible = useRef<boolean | null>(null);
  if (eligible.current === null) eligible.current = pathname === "/";

  const phase = useEntranceStore((s) => s.phase);
  const loaded = useEntranceStore((s) => s.loaded);
  const total = useEntranceStore((s) => s.total);
  const loadDone = useEntranceStore((s) => s.loadDone);
  const loadMs = useEntranceStore((s) => s.loadMs);

  const [flash, setFlash] = useState(false);
  const [skipVisible, setSkipVisible] = useState(false);
  const skipRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const store = useEntranceStore.getState();
    const root = document.documentElement;

    // Returning visitor, or a deep link: no entrance. Resolve the scene and
    // let the journey take over immediately. Nothing needs hiding, so
    // data-entrance is never set — only the short canvas crossfade.
    // `/?entrance=1` forces a replay (handy while iterating).
    const params = new URLSearchParams(window.location.search);
    const force = params.get(ENTRANCE_FORCE_PARAM) === "1";
    if (force) {
      window.sessionStorage.removeItem(SEEN_KEY);
      params.delete(ENTRANCE_FORCE_PARAM);
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", next);
    }

    const seen = !force && window.sessionStorage.getItem(SEEN_KEY) === "1";
    if (!eligible.current || seen) {
      resolveSignal();
      store.setPhase("done");
      // The boot script gates on the same two conditions, so it won't have set
      // this — cleared anyway so a stale attribute can never strand the chrome.
      delete root.dataset.entrance;
      if (seen) root.dataset.entranceQuick = "1";
      return () => {
        delete root.dataset.entranceQuick;
      };
    }

    // The entrance owns the frame, so hold scroll at the top for its
    // duration. Any scroll attempt is a skip gesture, so this never traps.
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    let raf = 0;
    let detach = 0;
    let phaseStart = performance.now();
    let current: EntrancePhase = "boot";
    let finished = false;
    let flashed = false;
    root.dataset.entrance = current;

    const advance = (next: EntrancePhase, at: number) => {
      current = next;
      phaseStart = at;
      root.dataset.entrance = next;
      store.setPhase(next);
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      // Mark seen on completion/skip — a hard reload mid-sequence can replay.
      window.sessionStorage.setItem(SEEN_KEY, "1");
      resolveSignal();
      current = "done";
      root.dataset.entrance = "done";
      store.setPhase("done");
      document.body.style.overflow = priorOverflow;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      // Bed starts with the chrome reveal — not during the cold start.
      sound.beginAmbient();
      // Once the staggered reveal has played, drop the attribute so the
      // entrance CSS stops matching and the overlays own their own motion.
      detach = window.setTimeout(() => {
        delete root.dataset.entrance;
      }, 1200);
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const elapsed = now - phaseStart;
      const lab = useLabStore.getState();
      const reduced = lab.reducedMotion;
      // Before the capability check lands, assume the live scene is coming.
      const live = !lab.webglChecked || lab.webglAvailable;

      switch (current) {
        case "boot":
          if (elapsed < T.boot) break;
          // No live scene: skip the burst and the wrong angle — there is no
          // cloud to be noise. The static wordmark wipes in instead.
          if (!live) {
            if (reduced) finish();
            else advance("snap", now);
            break;
          }
          advance("load", now);
          break;

        case "load": {
          // The payload failed or WebGL is gone: the static wordmark wipes in
          // instead of the cloud resolving.
          if (lab.webglChecked && !lab.webglAvailable) {
            advance("snap", now);
            break;
          }
          if (reduced) {
            // Reduced motion gets no burst and no fly — the scene simply
            // arrives already resolved.
            if (useEntranceStore.getState().loadDone) finish();
            break;
          }
          if (useEntranceStore.getState().loadDone && elapsed >= T.loadMin) {
            advance("arrival", now);
          }
          break;
        }

        case "arrival": {
          const t = clamp01(elapsed / T.arrival);
          entranceSignal.birth = easeOutQuint(t);
          entranceSignal.density = entranceSignal.birth;
          entranceSignal.resolve = 0;
          entranceSignal.staggerSpread = 0;
          if (t >= 1) advance("wrong", now);
          break;
        }

        case "wrong":
          entranceSignal.birth = 1;
          entranceSignal.density = 1;
          entranceSignal.resolve = 0;
          if (elapsed >= T.wrong) advance("snap", now);
          break;

        case "snap": {
          const span = live ? T.snap : T.wipe;
          const t = clamp01(elapsed / span);
          entranceSignal.birth = 1;
          entranceSignal.density = 1;
          // The swing eases in and out, arriving a few degrees past beat 0's
          // angle and settling back.
          entranceSignal.snap = easeInOutBack(t, 0.5);

          // The sweep edge travels its window at a constant rate, then the
          // last stretch overshoots past 1 — fragments pull tighter than the
          // mask — and settles back to exactly 1 as the camera does.
          const sweep = clamp01((t - RESOLVE_FROM) / (RESOLVE_TO - RESOLVE_FROM));
          const settle =
            t <= RESOLVE_TO
              ? 0
              : Math.sin(((t - RESOLVE_TO) / (1 - RESOLVE_TO)) * Math.PI) * OVER_CONTRACT;
          entranceSignal.resolve = sweep + settle;
          entranceSignal.staggerSpread = SWEEP_SPREAD;

          if (!flashed && t >= FLASH_AT) {
            flashed = true;
            setFlash(true);
            window.setTimeout(() => setFlash(false), 90);
            sound.lock();
          }

          if (t >= 1) advance("hold", now);
          break;
        }

        case "hold":
          entranceSignal.resolve = 1;
          entranceSignal.snap = 1;
          entranceSignal.staggerSpread = 0;
          if (elapsed >= T.hold) finish();
          break;

        default:
          finish();
      }
    };

    raf = requestAnimationFrame(tick);

    // Prime the audio context on first gesture so beginAmbient() can fade in
    // immediately when the reveal ends — without audibly starting the bed yet.
    const prime = () => {
      void sound.unlock();
    };
    window.addEventListener("pointerdown", prime, { passive: true, once: true });
    window.addEventListener("keydown", prime, { once: true });

    const skip = () => {
      prime();
      finish();
    };
    skipRef.current = skip;

    // Immersive: only Escape (or the skip control) ends early.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      skip();
    };
    window.addEventListener("keydown", onKey);

    // Offer the skip in words once it's clear something is happening.
    const skipTimer = window.setTimeout(() => setSkipVisible(true), 900);

    return () => {
      skipRef.current = null;
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(skipTimer);
      window.clearTimeout(detach);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("keydown", prime);
      document.body.style.overflow = priorOverflow;
      delete root.dataset.entrance;
      // A remount must not leave the scene stuck mid-entrance.
      resolveSignal();
    };
  }, []);

  if (phase === "done" || !eligible.current) return null;

  const kb = (bytes: number) => (bytes / 1024).toFixed(1);
  // The log fades out as the camera starts moving; the mark takes the frame.
  const logGone = phase === "snap" || phase === "hold";

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {/* One frame of accent as the mark locks — reads as a shutter. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-accent mix-blend-screen transition-opacity duration-100"
        style={{ opacity: flash ? 0.06 : 0 }}
      />

      {/* The status log. Truthful bytes, developer-native voice, and the only
          thing on screen until the fragments arrive. */}
      <div
        aria-hidden="true"
        className="absolute bottom-7 left-6 font-mono text-[11px] leading-relaxed transition-opacity duration-500 sm:bottom-9 sm:left-8"
        style={{ opacity: logGone ? 0 : 1 }}
      >
        <p className="text-type-dim">
          sim.hongbing <span className="text-type-faint">· cold start</span>
        </p>
        <p className="mt-1 text-type-faint">{`// ${SITE.thesis.toLowerCase().replace(/\.$/, "")}`}</p>

        {phase !== "boot" && (
          <p className="tnum mt-2 text-type-dim">
            <span className={loadDone ? "text-accent" : "text-type-faint"}>
              {loadDone ? "✓" : "→"}
            </span>{" "}
            fragments.bin{" "}
            <span className="text-type">
              {kb(loaded)} / {total ? kb(total) : "—"} KB
            </span>
            {loadDone && loadMs > 0 ? <span className="text-type-faint"> · {loadMs}ms</span> : null}
          </p>
        )}

        {(phase === "arrival" || phase === "wrong") && (
          <p className="tnum mt-1 text-type-dim">
            <span className="text-accent">✓</span> {FRAGMENT_TOTAL.toLocaleString()} fragments ·{" "}
            {BEAT_TARGET_COUNT} beats ·{" "}
            <span className="text-type-faint">0 meaning</span>
          </p>
        )}

        {phase === "wrong" && (
          <p className="mt-2 text-accent">
            <span className="text-accent">!</span> wrong angle
          </p>
        )}
      </div>

      {/* Explicit skip — not every click, so the sequence can stay immersive. */}
      <button
        type="button"
        onClick={() => skipRef.current?.()}
        className="pointer-events-auto absolute bottom-7 right-6 font-mono text-[10px] uppercase tracking-[0.2em] text-type-faint transition-opacity duration-500 hover:text-type-dim sm:bottom-9 sm:right-8"
        style={{ opacity: skipVisible && !logGone ? 1 : 0 }}
      >
        [esc] skip
      </button>

      {/* What the log says, for screen readers, without the per-chunk noise. */}
      <p role="status" className="sr-only">
        {loadDone
          ? "Scene loaded. Press Escape to skip the introduction."
          : "Loading the scene. Press Escape to skip the introduction."}
      </p>
    </div>
  );
}
