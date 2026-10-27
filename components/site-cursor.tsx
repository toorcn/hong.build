"use client";

import { useEffect, useRef, useState } from "react";
import { CLOUD_HOT_EVENT, clearCloudHot, cloudSignal } from "@/lib/cloud-signal";
import { TRAIL_HOT_EVENT, trailSignal } from "@/lib/trail-signal";
import { clearHandoff, getHandoff, subscribeHandoff } from "@/lib/panel-handoff";

/**
 * The site's own cursor, for fine pointers that hover.
 *
 * It reads what's under it and changes instrument:
 * - default: a small chip, with a lagging trail ring and a soft wake;
 * - link / press: the chip tightens;
 * - text: a beam;
 * - trail: over the walk's track, an arrow along it with the destination
 *   chapter beside — the chevrons walk forward, or toward you when the
 *   track heads out of the screen;
 * - cloud: over the fragment cloud, a probe (one of three, picked per visit)
 *   that leans into the pointer's velocity;
 * - cloud-open: over a chapter that opens a route, a rift tears open under
 *   the cursor with a preview card of where it leads. Clicking hands that
 *   card to the in-scene window (see lib/panel-handoff.ts).
 *
 * Positions are written straight to transforms from one rAF loop that
 * sleeps once everything has settled; React only mounts the parts.
 */

type CursorState = "default" | "link" | "press" | "text" | "trail" | "cloud" | "cloud-open";

const PROBES = ["drift", "bond", "shear"] as const;

const LINK_SELECTOR =
  'a[href], button, [role="button"], summary, label[for], input[type="submit"], input[type="button"], select, .tablet-gate-face, [data-cursor="link"]';
const TEXT_SELECTOR =
  'input:not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"], [data-cursor="text"]';

/** Preview card size plus margin — flip to the other side near an edge. */
const PREVIEW_FLIP_X = 258;
const PREVIEW_FLIP_Y = 164;

/** Out-then-in swap when the trail's destination changes, ms per half. */
const VECTOR_SWAP_MS = 240;

function stateFor(target: EventTarget | null, pressed: boolean): CursorState {
  if (cloudSignal.hot) return cloudSignal.openable ? "cloud-open" : "cloud";
  if (trailSignal.hot) return "trail";
  if (pressed) return "press";
  if (!(target instanceof Element)) return "default";
  if (target.closest(LINK_SELECTOR)) return "link";
  if (target.closest(TEXT_SELECTOR)) return "text";
  return "default";
}

export function SiteCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLSpanElement>(null);
  const wakeRef = useRef<HTMLSpanElement>(null);
  const destCodeRef = useRef<HTMLSpanElement>(null);
  const destLabelRef = useRef<HTMLSpanElement>(null);
  const previewCodeRef = useRef<HTMLSpanElement>(null);
  const previewTitleRef = useRef<HTMLSpanElement>(null);
  const previewExcerptRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [probe, setProbe] = useState<(typeof PROBES)[number]>("drift");

  // Picked after mount so server and client markup agree.
  useEffect(() => {
    setProbe(PROBES[Math.floor(Math.random() * PROBES.length)] ?? "drift");
  }, []);

  useEffect(() => {
    const sync = () => {
      const on =
        window.matchMedia("(pointer: fine)").matches &&
        window.matchMedia("(hover: hover)").matches;
      setEnabled(on);
      document.documentElement.classList.toggle("has-site-cursor", on);
      if (on) {
        document.documentElement.setAttribute("data-cursor", "on");
      } else {
        document.documentElement.removeAttribute("data-cursor");
        clearHandoff();
      }
    };
    sync();
    const fine = window.matchMedia("(pointer: fine)");
    const hover = window.matchMedia("(hover: hover)");
    fine.addEventListener("change", sync);
    hover.addEventListener("change", sync);
    return () => {
      fine.removeEventListener("change", sync);
      hover.removeEventListener("change", sync);
      document.documentElement.classList.remove("has-site-cursor");
      document.documentElement.removeAttribute("data-cursor");
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const cursor = cursorRef.current;
    const trail = trailRef.current;
    const wake = wakeRef.current;
    const destCode = destCodeRef.current;
    const destLabel = destLabelRef.current;
    const previewCode = previewCodeRef.current;
    const previewTitle = previewTitleRef.current;
    const previewExcerpt = previewExcerptRef.current;
    if (
      !cursor ||
      !trail ||
      !wake ||
      !destCode ||
      !destLabel ||
      !previewCode ||
      !previewTitle ||
      !previewExcerpt
    )
      return;

    // Pointer, trail ring (fast lerp) and wake (slow lerp).
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let wx = 0;
    let wy = 0;
    let seeded = false;
    let pressed = false;
    let state: CursorState = "default";
    let lastTarget: EventTarget | null = null;
    let raf = 0;
    let visible = false;
    // While a hand-off is in flight the card stays pinned where it opened.
    let handoff = getHandoff();

    let angle = trailSignal.angle;
    let dir = trailSignal.dir;
    let depth = trailSignal.depth;
    let dest = trailSignal.dest;
    let swap: "idle" | "out" | "in" = "idle";
    let swapAt = 0;
    let probeVel = 0;
    let probeHeading = 0;

    const takeTrail = () => {
      angle = trailSignal.angle;
      dir = trailSignal.dir;
      depth = trailSignal.depth;
      dest = trailSignal.dest;
      if (destCode.textContent !== trailSignal.destCode)
        destCode.textContent = trailSignal.destCode;
      if (destLabel.textContent !== trailSignal.destLabel)
        destLabel.textContent = trailSignal.destLabel;
    };

    const frame = () => {
      raf = 0;
      if (!seeded) return;

      if (!pressed) {
        if (handoff) state = "cloud-open";
        else if (cloudSignal.hot) state = cloudSignal.openable ? "cloud-open" : "cloud";
        else if (trailSignal.hot) state = "trail";
        else if (state === "trail" || state === "cloud" || state === "cloud-open")
          state = stateFor(lastTarget, false);
      }

      const preview = handoff?.preview ?? cloudSignal.preview;
      const code = preview ? `// chapter ${preview.code} — ${preview.label.toLowerCase()}` : "";
      const title = preview?.title ?? "";
      const excerpt = preview?.excerpt ?? "";
      if (previewCode.textContent !== code) previewCode.textContent = code;
      if (previewTitle.textContent !== title) previewTitle.textContent = title;
      if (previewExcerpt.textContent !== excerpt) previewExcerpt.textContent = excerpt;
      if (state === "cloud-open") {
        cursor.style.setProperty(
          "--preview-x",
          x > window.innerWidth - PREVIEW_FLIP_X ? "-244px" : "24px",
        );
        cursor.style.setProperty(
          "--preview-y",
          y > window.innerHeight - PREVIEW_FLIP_Y ? "-148px" : "24px",
        );
      }

      // Instruments track tighter than the plain chip.
      const follow =
        state === "link" || state === "trail" || state === "cloud" || state === "cloud-open"
          ? 0.16
          : 0.22;
      tx += (x - tx) * follow;
      ty += (y - ty) * follow;
      wx += (x - wx) * 0.12;
      wy += (y - wy) * 0.12;

      // The probe leans into velocity: fast attack, slow release, heading
      // eased the short way round.
      const dx = x - tx;
      const dy = y - ty;
      const speed = Math.hypot(dx, dy);
      const vel = Math.min(1, speed / 20);
      probeVel += (vel - probeVel) * (vel > probeVel ? 0.34 : 0.07);
      if (speed > 0.7) {
        const heading = (Math.atan2(dy, dx) * 180) / Math.PI;
        probeHeading += ((((heading - probeHeading + 540) % 360) - 180) * 0.2);
      }
      cursor.style.setProperty("--probe-vel", probeVel.toFixed(3));
      cursor.style.setProperty("--probe-heading", `${probeHeading.toFixed(1)}deg`);

      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      trail.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      const stretch = Math.min(2.1, 1 + speed * 0.09);
      wake.style.transform = `translate3d(${wx}px, ${wy}px, 0) scale(${stretch})`;
      wake.style.setProperty("--wake", `${Math.min(1, 0.55 + speed * 0.08)}`);

      // A new destination fades the arrow out, swaps the label, fades it in.
      const now = performance.now();
      if (trailSignal.hot) {
        if (swap === "idle" && dest >= 0 && trailSignal.dest !== dest) {
          swap = "out";
          swapAt = now + VECTOR_SWAP_MS;
          cursor.dataset.vector = "out";
        } else if (swap === "out" && now >= swapAt) {
          takeTrail();
          swap = "in";
          swapAt = now + VECTOR_SWAP_MS;
          cursor.dataset.vector = "in";
        } else if (swap === "in" && now >= swapAt) {
          swap = "idle";
          delete cursor.dataset.vector;
        } else if (swap !== "out") {
          takeTrail();
        }
      } else {
        swap = "idle";
        delete cursor.dataset.vector;
        takeTrail();
      }
      cursor.style.setProperty("--trail-angle", `${angle}deg`);
      if (cursor.dataset.trailDir !== dir) cursor.dataset.trailDir = dir;
      if (cursor.dataset.trailDepth !== depth) cursor.dataset.trailDepth = depth;

      if (cursor.dataset.state !== state) cursor.dataset.state = state;
      if (trail.dataset.state !== state) trail.dataset.state = state;
      if (wake.dataset.state !== state) wake.dataset.state = state;
      if (visible) {
        cursor.dataset.on = "1";
        trail.dataset.on = "1";
        wake.dataset.on = "1";
      } else {
        delete cursor.dataset.on;
        delete trail.dataset.on;
        delete wake.dataset.on;
      }

      const moving =
        Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1 || Math.abs(x - wx) > 0.1 || probeVel > 0.005;
      const swapping = swap !== "idle";
      if (visible && (moving || cloudSignal.hot || trailSignal.hot || state === "trail" || swapping))
        raf = requestAnimationFrame(frame);
    };

    const wakeLoop = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (!handoff) {
        x = e.clientX;
        y = e.clientY;
      }
      if (!seeded) {
        tx = wx = x;
        ty = wy = y;
        seeded = true;
      }
      visible = true;
      lastTarget = e.target;
      state = stateFor(e.target, pressed);
      wakeLoop();
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      lastTarget = e.target;
      state = stateFor(e.target, pressed);
      wakeLoop();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pressed = true;
      state = stateFor(e.target, true);
      if (state === "cloud-open") cursor.dataset.pressed = "1";
      wakeLoop();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pressed = false;
      delete cursor.dataset.pressed;
      state = stateFor(e.target, false);
      wakeLoop();
    };
    const onLeave = () => {
      if (handoff) return;
      visible = false;
      pressed = false;
      delete cursor.dataset.pressed;
      wakeLoop();
    };
    const onSignal = () => {
      if (!pressed) state = stateFor(lastTarget, false);
      wakeLoop();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    window.addEventListener("blur", onLeave);
    window.addEventListener(CLOUD_HOT_EVENT, onSignal);
    window.addEventListener(TRAIL_HOT_EVENT, onSignal);
    document.documentElement.addEventListener("mouseleave", onLeave);

    const unsubscribe = subscribeHandoff(() => {
      const was = handoff;
      handoff = getHandoff();
      if (handoff) {
        state = "cloud-open";
        visible = true;
      } else if (was) {
        clearCloudHot();
        state = stateFor(lastTarget, false);
      }
      wakeLoop();
    });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener(CLOUD_HOT_EVENT, onSignal);
      window.removeEventListener(TRAIL_HOT_EVENT, onSignal);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      unsubscribe();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <span ref={wakeRef} className="site-cursor-wake" data-state="default" aria-hidden="true" />
      <span ref={trailRef} className="site-cursor-trail" data-state="default" aria-hidden="true" />
      <div
        ref={cursorRef}
        className="site-cursor"
        data-state="default"
        data-probe={probe}
        aria-hidden="true"
      >
        <span className="site-cursor-chip" />
        <span className="site-cursor-beam" />
        <span className="site-cursor-probe">
          <svg className="site-cursor-probe-svg" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
            <g className="site-cursor-probe-shape site-cursor-probe-shape--drift">
              <g className="site-cursor-probe-aim">
                <g className="site-cursor-probe-drift-flex">
                  <path
                    className="site-cursor-probe-drift-arc site-cursor-probe-drift-arc--lead"
                    d="M27.16 14.63 A9 9 0 0 1 27.16 29.37"
                  />
                  <path
                    className="site-cursor-probe-drift-arc site-cursor-probe-drift-arc--tail"
                    d="M14.63 27.16 A9 9 0 0 1 14.63 16.84"
                  />
                </g>
              </g>
              <circle className="site-cursor-probe-core" cx="22" cy="22" r="1.85" />
            </g>
            <g className="site-cursor-probe-shape site-cursor-probe-shape--bond">
              <g className="site-cursor-probe-aim">
                <g className="site-cursor-probe-bond-goo" filter="url(#psite-probe-bond)">
                  <circle className="site-cursor-probe-bond-mass" cx="22" cy="22" r="4.4" />
                  <circle className="site-cursor-probe-bond-drop" cx="22" cy="22" r="3.4" />
                </g>
              </g>
              <circle className="site-cursor-probe-core" cx="22" cy="22" r="1.85" />
            </g>
            <g className="site-cursor-probe-shape site-cursor-probe-shape--shear">
              <g className="site-cursor-probe-aim">
                <g className="site-cursor-probe-shear-stack">
                  <path className="site-cursor-probe-shear-line" d="M19 14.5 H25" />
                  <path className="site-cursor-probe-shear-line" d="M17.5 18.25 H26.5" />
                  <path className="site-cursor-probe-shear-line" d="M16.5 22 H27.5" />
                  <path className="site-cursor-probe-shear-line" d="M17.5 25.75 H26.5" />
                  <path className="site-cursor-probe-shear-line" d="M19 29.5 H25" />
                </g>
              </g>
              <circle className="site-cursor-probe-core" cx="22" cy="22" r="1.85" />
            </g>
            <defs>
              {/* Gooey merge: blur, then crush alpha so the two circles fuse. */}
              <filter
                id="psite-probe-bond"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
                colorInterpolationFilters="sRGB"
              >
                <feGaussianBlur in="SourceGraphic" stdDeviation="3.2" result="psite-probe-bond-blur" />
                <feColorMatrix
                  in="psite-probe-bond-blur"
                  type="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 17 -7"
                />
              </filter>
            </defs>
          </svg>
        </span>
        <span className="site-cursor-reveal">
          <span className="site-cursor-preview">
            <span ref={previewCodeRef} className="site-cursor-preview-code" />
            <span className="site-cursor-preview-body">
              <span ref={previewTitleRef} className="site-cursor-preview-title" />
              <span ref={previewExcerptRef} className="site-cursor-preview-excerpt" />
              <span className="site-cursor-preview-rule" />
            </span>
          </span>
          <svg className="site-cursor-reveal-svg" viewBox="0 0 224 122" xmlns="http://www.w3.org/2000/svg">
            <path
              className="site-cursor-reveal-depth"
              d="M7 14 L16 5 L52 9 L69 3 L105 8 L127 4 L164 10 L210 6 L218 21 L214 43 L221 62 L215 79 L219 107 L207 116 L172 112 L151 119 L116 113 L89 118 L57 111 L15 116 L5 102 L10 78 L3 61 L9 39 Z"
            />
            <path
              className="site-cursor-reveal-edge site-cursor-reveal-edge--left"
              d="M16 5 L7 14 L10 39 L3 61 L10 78 L5 102 L15 116"
            />
            <path
              className="site-cursor-reveal-edge site-cursor-reveal-edge--right"
              d="M210 6 L218 21 L214 43 L221 62 L215 79 L219 107 L207 116"
            />
            <path
              className="site-cursor-reveal-branch"
              d="M9 39 L0 32 M4 61 L0 69 M9 79 L1 87 M215 43 L224 35 M220 62 L224 70 M216 79 L224 88"
            />
            <g className="site-cursor-reveal-stars">
              <circle cx="2" cy="24" r="1.1" />
              <circle cx="222" cy="29" r="0.8" />
              <circle cx="1" cy="96" r="0.9" />
              <circle cx="222" cy="99" r="0.7" />
            </g>
          </svg>
        </span>
        <span className="site-cursor-vector">
          <svg className="site-cursor-vector-svg" viewBox="-48 -48 96 96" xmlns="http://www.w3.org/2000/svg">
            <path className="site-cursor-vector-shaft" d="M14 0 H29" />
            <path className="site-cursor-vector-head" d="M45 0 L28 -8 L32.5 0 L28 8 Z" />
            <path className="site-cursor-vector-chev" d="M-5 -6 L1 0 L-5 6" />
            <path className="site-cursor-vector-chev" d="M-5 -6 L1 0 L-5 6" />
            <path className="site-cursor-vector-chev" d="M-5 -6 L1 0 L-5 6" />
          </svg>
        </span>
        <span className="site-cursor-dest">
          <span className="site-cursor-dest-inner">
            <span ref={destCodeRef} className="site-cursor-dest-code" />
            <span ref={destLabelRef} className="site-cursor-dest-label" />
          </span>
        </span>
      </div>
    </>
  );
}
