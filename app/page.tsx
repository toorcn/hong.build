import { BEATS } from "@/lib/story";
import { StorySpine } from "@/components/story-spine";
import { BeatCaption } from "@/components/beat-caption";
import { BeatMemory, type Memory } from "@/components/beat-memory";
import { BeatOpen } from "@/components/beat-open";
import { ChapterRail } from "@/components/chapter-rail";
import { HomeSmoothScroll } from "@/components/home-smooth-scroll";
import { ScrollCue } from "@/components/scroll-cue";
import { NarrativeFallback } from "@/components/narrative-fallback";
import { JourneyOverlays, WebglSpacer } from "@/components/journey-overlays";

/**
 * Chapter photographs, keyed by beat id. Empty until the photos are in —
 * BeatMemory only mounts once there's at least one.
 */
const MEMORIES: Partial<Record<number, Memory>> = {};

/**
 * The journey. A tall scroll spine (one viewport per beat) drives storyT,
 * which flies the camera and morphs the fragment cloud. The canvas stays
 * fixed behind; captions and the chapter rail are fixed overlays on top.
 * With WebGL off, NarrativeFallback renders the story as stacked sections.
 */
export default function HomePage() {
  const hasMemories = Object.keys(MEMORIES).length > 0;
  return (
    <>
      <HomeSmoothScroll />
      <StorySpine>
        {/* Roughly one viewport per beat, plus a closing screen whose pull
            hands off to /contact. Total height is what sets the pace, not
            the beat count — the beats are unevenly spaced (lib/story.ts).
            With WebGL off the fallback supplies its own section heights. */}
        <WebglSpacer height={`${BEATS.length * 96 + 100}vh`} />

        {/* Live-scene overlays; hidden when WebGL is off. */}
        <JourneyOverlays>
          {hasMemories ? <BeatMemory ready={MEMORIES} /> : null}
          <BeatCaption />
          <BeatOpen />
          <ChapterRail />
          <ScrollCue />
        </JourneyOverlays>

        {/* No-WebGL story, rendered as a normal reading page. */}
        <NarrativeFallback />
      </StorySpine>
    </>
  );
}
