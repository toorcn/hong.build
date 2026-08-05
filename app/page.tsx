import { BEATS } from "@/lib/story";
import { StorySpine } from "@/components/story-spine";
import { BeatCaption } from "@/components/beat-caption";
import { ChapterRail } from "@/components/chapter-rail";
import { ScrollCue } from "@/components/scroll-cue";
import { NarrativeFallback } from "@/components/narrative-fallback";
import { JourneyOverlays, WebglSpacer } from "@/components/journey-overlays";

/**
 * The journey. A tall scroll spine (one viewport per beat) drives storyT,
 * which flies the camera and morphs the fragment cloud. The canvas stays
 * fixed behind; captions and the chapter rail are fixed overlays on top.
 * With WebGL off, NarrativeFallback renders the story as stacked sections.
 */
export default function HomePage() {
  return (
    <StorySpine>
      {/* Roughly one viewport per beat. Total height is what sets the pace,
          not the beat count — the beats are unevenly spaced (lib/story.ts),
          so this works out to about two screens of travel across the four
          quiet years and a little under one for the tight 2025 chapters.
          With WebGL off the fallback supplies its own section heights. */}
      <WebglSpacer height={`${BEATS.length * 96}vh`} />

      {/* Live-scene overlays; hidden when WebGL is off. */}
      <JourneyOverlays>
        <BeatCaption />
        <ChapterRail />
        <ScrollCue />
      </JourneyOverlays>

      {/* No-WebGL story, rendered as a normal reading page. */}
      <NarrativeFallback />
    </StorySpine>
  );
}
