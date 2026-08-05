import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { ContentPanel } from "@/components/content-panel";
import { getAllProjects, getProject, getProjectSlugs } from "@/lib/mdx";
import { mdxComponents } from "@/components/mdx-components";

export function generateStaticParams() {
  return getProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.frontmatter.title,
    description: project.frontmatter.tagline,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const { frontmatter, content, readingTime } = project;
  const { content: mdx } = await compileMDX({
    source: content,
    components: mdxComponents,
    options: { parseFrontmatter: false },
  });

  const all = getAllProjects();
  const idx = all.findIndex((p) => p.frontmatter.slug === slug);
  const prev = all[idx - 1] ?? null;
  const next = all[idx + 1] ?? null;

  return (
    <ContentPanel title={frontmatter.title} sub={frontmatter.slug} wide>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line pb-8 font-mono text-[11px] uppercase tracking-[0.16em] text-type-faint">
        <span>{frontmatter.year}</span>
        <span>{frontmatter.kind}</span>
        <span>{readingTime}</span>
      </div>

      <p className="mt-8 max-w-2xl font-display text-2xl font-bold leading-snug tracking-tight text-type">
        {frontmatter.tagline}
      </p>

      <dl className="panel-rows mt-10 grid gap-6 border-t border-line px-1 py-6 sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">role</dt>
          <dd className="mt-2 text-sm leading-relaxed text-type-dim">{frontmatter.role}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">stack</dt>
          <dd className="mt-2 text-sm leading-relaxed text-type-dim">
            {frontmatter.stack.join(" · ")}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">outcome</dt>
          <dd className="mt-2 text-sm leading-relaxed text-type">{frontmatter.outcome}</dd>
        </div>
      </dl>

      <article className="prose-lab mt-12">{mdx}</article>

      <nav
        aria-label="More work"
        className="mt-16 flex items-center justify-between gap-4 border-t border-line pt-8"
      >
        {prev ? (
          <Link
            href={`/work/${prev.frontmatter.slug}`}
            className="focus-ring group font-mono text-[11px] uppercase tracking-[0.16em] text-type-dim hover:text-type"
          >
            <span className="text-type-faint">← prev</span>
            <span className="mt-1 block font-display text-xl font-black normal-case tracking-tight text-type group-hover:text-accent">
              {prev.frontmatter.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/work/${next.frontmatter.slug}`}
            className="focus-ring group text-right font-mono text-[11px] uppercase tracking-[0.16em] text-type-dim hover:text-type"
          >
            <span className="text-type-faint">next →</span>
            <span className="mt-1 block font-display text-xl font-black normal-case tracking-tight text-type group-hover:text-accent">
              {next.frontmatter.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <div className="mt-10">
        <Link
          href="/contact"
          className="focus-ring inline-block border border-accent bg-accent px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-void transition-colors hover:bg-transparent hover:text-accent"
        >
          Build something like this →
        </Link>
      </div>
    </ContentPanel>
  );
}
