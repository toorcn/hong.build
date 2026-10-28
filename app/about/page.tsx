import type { Metadata } from "next";
import { ContentPanel } from "@/components/content-panel";
import { LiveRow } from "@/components/panel-motion";
import { ABOUT_FACTS, SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description: "Who is Hong Bing — founder and AI engineer in Kuala Lumpur and San Francisco.",
};

export default function AboutPage() {
  return (
    <ContentPanel title="Hong Bing" sub="the human">
      <p className="max-w-xl text-xl leading-relaxed text-type">
        I build interfaces where AI, design systems, and code meet — and I
        care about the small feedback loops that make software feel alive.
      </p>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-type-dim">
        I came up through computer science and psychology, which is probably
        why I keep ending up where I do: most of my work sits between a
        technical system and the person trying to use it. Twenty results
        across thirty-three events taught me to build fast and throw away faster.
        Running communities taught me that the tool is never the point — the
        room is.
      </p>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-type-dim">
        Right now I'm founding something I can't talk about yet, and building
        production AI at YTL AI Labs. Before that: R&D for an SF-based startup,
        and Tack, a meeting moderator that intervenes while the conversation
        is still alive. I also co-founded AI Hackerdorm — 4 chapters, 700+
        members nationwide.
      </p>

      <dl className="panel-rows mt-14">
        {ABOUT_FACTS.map((f) => (
          <LiveRow key={f.k} className="grid gap-1 px-3 py-4 sm:grid-cols-[200px_1fr] sm:gap-6 sm:px-5">
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-type-faint">
              {f.k}
            </dt>
            <dd className="text-sm leading-relaxed text-type-dim">{f.v}</dd>
          </LiveRow>
        ))}
      </dl>

      <p className="mt-12 max-w-xl font-mono text-[11px] leading-relaxed tracking-[0.06em] text-type-faint">
        {"// "}
        {SITE.thesis}
      </p>
    </ContentPanel>
  );
}
