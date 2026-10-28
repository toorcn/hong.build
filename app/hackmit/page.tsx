import type { Metadata } from "next";
import Link from "next/link";
import { ContentPanel } from "@/components/content-panel";
import { EventLogo } from "@/components/event-logo";
import { AWARDS } from "@/content/awards";
import { HACKMIT } from "@/content/hackmit";

export const metadata: Metadata = {
  title: "HackMIT",
  description: HACKMIT.description,
};

export default function HackMITPage() {
  const event = AWARDS.find((award) => award.event === "HackMIT 2026")!;

  return (
    <ContentPanel title="HackMIT">
      <div className="flex items-center gap-4">
        <EventLogo event={event.event} />
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-type-faint">
          {event.month} {event.year}
        </p>
      </div>

      <section aria-labelledby="hare-question" className="mt-10 border-y border-line py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-type-faint">
          {HACKMIT.name} / {HACKMIT.expansion}
        </p>
        <h2 id="hare-question" className="mt-4 max-w-xl text-balance font-display text-3xl font-black leading-tight text-type sm:text-4xl">
          {HACKMIT.question}
        </h2>
        <p className="mt-5 text-sm text-accent">{event.result}</p>
      </section>

      <div className="mt-10 space-y-9">
        {HACKMIT.sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
              {section.title}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-type-dim">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-x-6 gap-y-4">
        <a
          href={HACKMIT.source}
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-block font-mono text-[11px] uppercase tracking-[0.16em] text-type-dim underline decoration-line underline-offset-4 transition-colors hover:text-accent"
        >
          Original story & photos ↗
        </a>
        <Link
          href="/hackathons"
          className="focus-ring inline-block font-mono text-[11px] uppercase tracking-[0.16em] text-type-dim underline decoration-line underline-offset-4 transition-colors hover:text-accent"
        >
          All hackathons & competitions →
        </Link>
      </div>
    </ContentPanel>
  );
}
