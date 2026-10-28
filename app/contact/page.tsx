import type { Metadata } from "next";
import { ContentPanel } from "@/components/content-panel";
import { LiveRow } from "@/components/panel-motion";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "The end of the story. Say hi.",
};

export default function ContactPage() {
  return (
    <ContentPanel title="Say hi">
      <p className="max-w-xl font-display text-2xl font-bold leading-snug tracking-tight text-type">
        That's the whole story. Thanks for scrolling it.
      </p>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-type-dim">
        I'm not selling anything here. But if any of it landed — if you're
        building something strange, or you're five hackathons in with nothing
        to show and wondering whether that's normal — I'd genuinely like to
        hear about it.
      </p>

      <div className="mt-12">
        <a
          // Pre-filled so the first line is already written for them.
          href={`mailto:${SITE.email}?subject=hi&body=${encodeURIComponent("(what are you building?)\n\n")}`}
          className="focus-ring inline-block border border-accent bg-accent px-6 py-4 font-mono text-sm tracking-[0.12em] text-void transition-colors hover:bg-transparent hover:text-accent"
        >
          {SITE.email}
        </a>
      </div>

      <dl className="panel-rows mt-14 max-w-xl">
        <LiveRow className="grid gap-1 px-3 py-4 sm:grid-cols-[140px_1fr] sm:gap-6 sm:px-5">
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-type-faint">
            location
          </dt>
          <dd className="text-sm text-type-dim">{SITE.location}</dd>
        </LiveRow>
        <LiveRow className="grid gap-1 px-3 py-4 sm:grid-cols-[140px_1fr] sm:gap-6 sm:px-5">
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-type-faint">
            right now
          </dt>
          <dd className="text-sm text-type-dim">{SITE.status}</dd>
        </LiveRow>
        <LiveRow className="grid gap-1 px-3 py-4 sm:grid-cols-[140px_1fr] sm:gap-6 sm:px-5">
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-type-faint">
            elsewhere
          </dt>
          <dd className="flex flex-wrap gap-x-5 gap-y-1">
            {SITE.socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="focus-ring text-sm text-type-dim underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
              >
                {s.label}
              </a>
            ))}
          </dd>
        </LiveRow>
      </dl>

      <p className="mt-12 font-mono text-[11px] leading-relaxed tracking-[0.06em] text-type-faint">
        {"// usually replies within a day. faster if it's weird."}
      </p>
    </ContentPanel>
  );
}
