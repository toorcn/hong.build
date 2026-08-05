import type { Metadata } from "next";
import { ContentPanel } from "@/components/content-panel";
import { SITE } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Have an unusual interface in mind? Get in touch.",
};

export default function ContactPage() {
  return (
    <ContentPanel title="Say hi">
      <p className="max-w-xl font-display text-2xl font-bold leading-snug tracking-tight text-type">
        Have an unusual interface in mind?
      </p>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-type-dim">
        The weirder the better — a real-time AI surface, a spatial UI,
        something that has to feel alive. If it sits between a hard technical
        problem and a person, I'm interested.
      </p>

      <div className="mt-12">
        <a
          href={`mailto:${SITE.email}`}
          className="focus-ring inline-block border border-accent bg-accent px-6 py-4 font-mono text-sm tracking-[0.12em] text-void transition-colors hover:bg-transparent hover:text-accent"
        >
          {SITE.email}
        </a>
      </div>

      <dl className="panel-rows mt-14 max-w-xl">
        <div className="panel-row grid gap-1 px-5 py-4 sm:grid-cols-[140px_1fr] sm:gap-6">
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-type-faint">
            location
          </dt>
          <dd className="text-sm text-type-dim">{SITE.location}</dd>
        </div>
        <div className="panel-row grid gap-1 px-5 py-4 sm:grid-cols-[140px_1fr] sm:gap-6">
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-type-faint">
            availability
          </dt>
          <dd className="text-sm text-type-dim">{SITE.availability}</dd>
        </div>
        <div className="panel-row grid gap-1 px-5 py-4 sm:grid-cols-[140px_1fr] sm:gap-6">
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
        </div>
      </dl>

      <p className="mt-12 font-mono text-[11px] leading-relaxed tracking-[0.06em] text-type-faint">
        {"// usually replies within a day. faster if it's weird."}
      </p>
    </ContentPanel>
  );
}
