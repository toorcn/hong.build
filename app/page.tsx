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
      {/* One viewport of scroll per beat, only when the live scene runs.
          With WebGL off the fallback supplies its own section heights. */}
      <WebglSpacer height={`${BEATS.length * 100}vh`} />

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
