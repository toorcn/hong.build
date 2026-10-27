"use client";

import { useEffect, useMemo, useState } from "react";
import { BEATS, resolveAmount, storyPosition } from "@/lib/story";
import { useLabStore } from "@/lib/store";
import { useStoryStore } from "@/lib/story-store";

/**
 * In-world narrative captions, two lines per beat.
 *
 * `line` is the claim — it holds the frame while the cloud is resolved.
 * `turn` is the consequence — it takes over as the cloud dissolves, so the
 * interstitial carries the handoff to the next beat instead of being dead
 * scroll. The two crossfade against `resolveAmount`, which means the copy
 * and the geometry are driven by the same number and can never drift.
 *
 * The two halves read from DIFFERENT beats, which is the subtle part. A
 * corridor runs from beat `from` to beat `to`, and resolveAmount is 1 at both
 * ends and 0 in the middle. The turn belongs to the beat being left, so it
 * reads from `from`. The claim belongs to whichever beat the camera is nearest,
 * so it reads from `from` in the first half and `to` in the second — otherwise
 * the whole approach to a chapter plays the PREVIOUS chapter's claim at full
 * opacity over the arriving artifact, and swaps text on arrival with no
 * crossfade. Nearest is also what the chapter rail highlights, so all three —
 * rail, artifact and copy — now name the same chapter at every scroll position.
 *
 * Long-form reading lives on the detail routes; these stay short. The way
 * into them is BeatOpen, not a link in here.
 */
export function BeatCaption() {
  const storyT = useStoryStore((s) => s.storyT);
  const reducedMotion = useLabStore((s) => s.reducedMotion);

  const { from, to, mix } = storyPosition(storyT);
  const resolved = resolveAmount(storyT);
  const beat = BEATS[mix < 0.5 ? from : to];
  const leaving = BEATS[from];
  if (!beat || !leaving) return null;

  // Fully resolved → the claim, at full strength. Fully dissolved → the
  // turn. The dead zone between keeps them from ghosting over each other.
  const claimOpacity = Math.max(0, (resolved - 0.35) / 0.65);
  const turnOpacity = Math.max(0, (0.5 - resolved) / 0.5);

  return (
    <div
      // Revealed last: the resolved mark holds the frame alone for a beat
      // before the journey's copy arrives.
      style={{ "--reveal-delay": "300ms" } as React.CSSProperties}
      className="entrance-hide pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center px-6 pb-[11.5rem] sm:pb-20"
    >
      {/* A scrim under the copy. The artifact is centred and the caption sits
          low, so at the wider chapters the type lands on the bottom edge of
          the cloud and both lose. Fading the void up behind the text keeps the
          copy readable without pushing the artifact off centre. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-64 bg-gradient-to-t from-void via-void/75 to-transparent"
      />

      {/* Both lines occupy the same grid cell so the container is always as
          tall as the longer of the two — an absolutely stacked turn could
          overflow the viewport bottom on narrow screens. */}
      <div className="grid w-full max-w-xl text-center">
        {/* The claim. */}
        <div
          className="col-start-1 row-start-1 transition-opacity duration-500"
          style={{ opacity: claimOpacity }}
          aria-hidden={claimOpacity < 0.5}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
            {beat.code} — {beat.label}
            <span className="ml-3 text-type-faint">{beat.when}</span>
          </p>
          <p className="mt-3 text-balance font-display text-xl leading-snug text-type sm:text-2xl">
            <BeatWords
              key={`claim-${beat.id}`}
              text={beat.line}
              active={claimOpacity > 0.22}
              reducedMotion={reducedMotion}
            />
          </p>
        </div>

        {/* The turn, stacked in the same cell so nothing reflows. */}
        <p
          className="col-start-1 row-start-1 self-center text-balance font-display text-lg leading-snug text-type-dim transition-opacity duration-500 sm:text-xl"
          style={{ opacity: turnOpacity }}
          aria-hidden={turnOpacity < 0.5}
        >
          <BeatWords
            key={`turn-${leaving.id}`}
            text={leaving.turn}
            active={turnOpacity > 0.22}
            reducedMotion={reducedMotion}
          />
        </p>
      </div>

      {/* Both halves of every beat, in order, for screen readers and for
          anything that can't observe scroll. */}
      <div className="sr-only">
        {BEATS.map((b) => (
          <p key={b.id}>
            {b.code} {b.label}, {b.when}. {b.line} {b.turn}
          </p>
        ))}
      </div>
    </div>
  );
}

/**
 * The line arrives a word at a time the first time it's shown, then stays
 * put — scrolling back and forth across a beat doesn't replay it.
 */
function BeatWords({
  text,
  active,
  reducedMotion,
}: {
  text: string;
  active: boolean;
  reducedMotion: boolean;
}) {
  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);
  const [played, setPlayed] = useState(active);
  useEffect(() => {
    if (active) setPlayed(true);
  }, [active]);

  if (reducedMotion) return <>{text}</>;
  return (
    <span className="beat-words" data-active={played ? "1" : "0"}>
      {words.map((word, i) => (
        <span key={`${i}-${word}`}>
          <span className="beat-word" style={{ "--i": i } as React.CSSProperties}>
            {word}
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
