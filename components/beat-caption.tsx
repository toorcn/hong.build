"use client";

import Link from "next/link";
import { BEATS, resolveAmount, storyPosition } from "@/lib/story";
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
 * Long-form reading lives on the detail routes; these stay short.
 */
export function BeatCaption() {
  const storyT = useStoryStore((s) => s.storyT);

  const { from, to, mix } = storyPosition(storyT);
  const resolved = resolveAmount(storyT);
  const beat = BEATS[mix < 0.5 ? from : to];
  const leaving = BEATS[from];
  if (!beat || !leaving) return null;

  // Fully resolved → the claim, at full strength. Fully dissolved → the
  // turn. The dead zone between keeps them from ghosting over each other.
  const claimOpacity = Math.max(0, (resolved - 0.35) / 0.65);
  const turnOpacity = Math.max(0, (0.5 - resolved) / 0.5);

  // The route link only earns its place once the form is legible.
  const linkVisible = resolved > 0.72;

  return (
    <div
      // Revealed last: the resolved mark holds the frame alone for a beat
      // before the journey's copy arrives.
      style={{ "--reveal-delay": "300ms" } as React.CSSProperties}
      className="entrance-hide pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center px-6 pb-24 sm:pb-20"
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
          className="col-start-1 row-start-1 transition-opacity duration-200"
          style={{ opacity: claimOpacity }}
          aria-hidden={claimOpacity < 0.5}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
            {beat.code} — {beat.label}
            <span className="ml-3 text-type-faint">{beat.when}</span>
          </p>
          <p className="mt-3 text-balance font-display text-xl leading-snug text-type sm:text-2xl">
            {beat.line}
          </p>
          {/*
            The gate ring at the artifact (see RoomGates) is the real way in.
            This stays as the keyboard route and for anyone who doesn't think
            to click the ring — so it's worded as a label for the thing in the
            world, not as the primary button it used to be.
          */}
          {beat.route ? (
            <Link
              href={beat.route}
              tabIndex={linkVisible ? 0 : -1}
              className="focus-ring pointer-events-auto mt-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-type-faint transition-all duration-300 hover:text-accent"
              style={{ opacity: linkVisible ? 1 : 0 }}
            >
              <span aria-hidden="true" className="text-accent">
                ◎
              </span>
              {beat.routeLabel}
            </Link>
          ) : null}
        </div>

        {/* The turn, stacked in the same cell so nothing reflows. */}
        <p
          className="col-start-1 row-start-1 self-center text-balance font-display text-lg leading-snug text-type-dim transition-opacity duration-200 sm:text-xl"
          style={{ opacity: turnOpacity }}
          aria-hidden={turnOpacity < 0.5}
        >
          {leaving.turn}
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
