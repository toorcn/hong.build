import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ContentPanel } from "@/components/content-panel";
import { LiveRow } from "@/components/panel-motion";
import { getAllProjects } from "@/lib/mdx";

export const metadata: Metadata = {
  title: "For agents",
  description: "This site as plain markdown and JSON, for agents and scripts.",
  alternates: { types: { "text/markdown": "/index.md" } },
};

const CURL = `curl -H "Accept: text/markdown" https://hong.build/about`;

export default function AgentsPage() {
  const preview = readFileSync(join(process.cwd(), "public", "agent", "index.md"), "utf8");
  const endpoints = [
    { path: "/index.md", note: "Home: summary, work, contact" },
    { path: "/about.md", note: "Facts" },
    { path: "/work.md", note: "Case study index" },
    ...getAllProjects().map((p) => ({
      path: `/work/${p.frontmatter.slug}.md`,
      note: `${p.frontmatter.title} case study`,
    })),
    { path: "/process.md", note: "How I build" },
    { path: "/hackathons.md", note: "Hackathons & competitions, every event entered" },
    { path: "/hackmit.md", note: "HackMIT / HARE project" },
    { path: "/contact.md", note: "Email and links" },
    { path: "/llms.txt", note: "Index for LLM crawlers" },
    { path: "/profile.json", note: "Structured profile and run log" },
  ];

  return (
    <ContentPanel title="For agents" sub="machine">
      <p className="max-w-xl text-base leading-relaxed text-type-dim">
        The journey is for people. If you are a model, a crawler or a script, every page here is also
        available as markdown: send <code className="font-mono text-type">Accept: text/markdown</code>, or
        add <code className="font-mono text-type">.md</code> to the path.
      </p>

      <pre className="mt-10 max-w-full overflow-x-auto border border-line px-5 py-4 font-mono text-[12px] leading-relaxed text-type">
        <span className="text-type-faint">$ </span>
        {CURL}
      </pre>

      <ul className="panel-rows mt-12">
        {endpoints.map((e, i) => (
          <li key={e.path}>
            <LiveRow delay={i * 40} className="grid gap-1 px-5 py-3 sm:grid-cols-[260px_1fr] sm:gap-6">
              <a href={e.path} className="focus-ring font-mono text-[12px] text-accent">
                {e.path}
              </a>
              <span className="text-sm text-type-dim">{e.note}</span>
            </LiveRow>
          </li>
        ))}
      </ul>

      <h2 className="mt-14 font-mono text-[10px] uppercase tracking-[0.18em] text-type-faint">
        GET /index.md
      </h2>
      <pre className="mt-3 max-h-[28rem] max-w-full overflow-auto whitespace-pre-wrap border border-line px-5 py-4 font-mono text-[12px] leading-relaxed text-type-dim">
        {preview}
      </pre>
    </ContentPanel>
  );
}
