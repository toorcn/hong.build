import type { Metadata } from "next";
import { LiveRow } from "@/components/panel-motion";
import { ContentPanel } from "@/components/content-panel";
import { getAllProjects } from "@/lib/mdx";

export const metadata: Metadata = {
  title: "Work",
  description: "Case studies — Tack, KiyokoCon, AI Hackerdorm.",
};

export default function WorkPage() {
  const projects = getAllProjects();

  return (
    <ContentPanel title="Selected work">
      <p className="max-w-xl text-base leading-relaxed text-type-dim">
        Three things I built that taught me the most. Scroll back to the
        WORK chapter and the cloud re-forms around them.
      </p>

      <ul className="panel-rows mt-12">
        {projects.map((p, i) => (
          <li key={p.frontmatter.slug}>
            <LiveRow
              href={`/work/${p.frontmatter.slug}`}
              delay={i * 80}
              className="focus-ring group flex items-baseline justify-between gap-4 px-3 py-6 sm:gap-6 sm:px-7"
            >
              <div className="min-w-0">
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-type-faint">
                    {String(p.frontmatter.year)}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                    {p.frontmatter.kind}
                  </span>
                </div>
                <h2 className="mt-2 font-display text-3xl font-black leading-none tracking-tight text-type transition-colors group-hover:text-accent sm:text-4xl">
                  {p.frontmatter.title}
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-type-dim">
                  {p.frontmatter.tagline}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="shrink-0 font-mono text-lg text-type-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent"
              >
                →
              </span>
            </LiveRow>
          </li>
        ))}
      </ul>
    </ContentPanel>
  );
}
