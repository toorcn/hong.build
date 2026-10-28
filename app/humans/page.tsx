import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/content/site";
import { getAllProjects } from "@/lib/mdx";

export const metadata: Metadata = {
  title: "For humans",
  description: "A quick way around Hong Bing's work, background, hackathons, and contact details.",
};

const PAGES = [
  { href: "/about", title: "About me", description: "The background, the day job, and the things I keep coming back to." },
  { href: "/process", title: "How I build", description: "The principles behind the work. Think, build, test, break, repeat." },
  { href: "/hackathons", title: "Hackathons & competitions", description: "Every event entered, and what happened along the way." },
  { href: "/hackmit", title: "HackMIT", description: "A closer look at the HackMIT chapter." },
] as const;

export default function HumansPage() {
  const projects = getAllProjects();

  return (
    <div className="content-scrim min-h-screen">
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-28 sm:px-8 sm:pt-36">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">The short way around</p>
        <h1 className="mt-4 font-display text-5xl font-black leading-none tracking-tight text-type sm:text-7xl">For humans.</h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-type-dim">
          I’m Hong Bing. {SITE.status} Here’s the work, the backstory, and a way to say hello. Pick a place to start.
        </p>
        <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-y border-line py-3 text-sm text-type">
          <a className="focus-ring py-2 hover:text-accent" href="#work">Selected work ↓</a>
          <a className="focus-ring py-2 hover:text-accent" href="#more-projects">More projects ↓</a>
          <a className="focus-ring py-2 hover:text-accent" href="#explore">Explore ↓</a>
          <a className="focus-ring py-2 hover:text-accent" href="#contact">Say hello ↓</a>
        </nav>

        <section id="work" aria-labelledby="work-title" className="scroll-mt-28 pt-12 sm:pt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="work-title" className="font-display text-3xl font-bold tracking-tight text-type">Selected work</h2>
            <Link href="/work" className="focus-ring py-2 text-sm text-type-dim hover:text-accent">All work →</Link>
          </div>
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {projects.map(({ frontmatter: project, readingTime }) => (
              <li key={project.slug}>
                <Link href={`/work/${project.slug}`} className="focus-ring group grid gap-3 py-6 transition-colors hover:bg-type/5 sm:grid-cols-[140px_1fr_24px] sm:gap-8 sm:px-3">
                  <span className="pt-1 font-mono text-[11px] text-type-faint">{project.year} · {project.kind}</span>
                  <div>
                    <h3 className="font-display text-2xl font-bold tracking-tight text-type group-hover:text-accent">{project.title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-type-dim">{project.tagline}</p>
                    <p className="mt-3 font-mono text-[11px] text-type-faint">{readingTime}</p>
                  </div>
                  <span aria-hidden="true" className="hidden text-type-dim group-hover:text-accent sm:block">↗</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section id="more-projects" aria-labelledby="more-projects-title" className="scroll-mt-28 pt-12 sm:pt-16">
          <h2 id="more-projects-title" className="font-display text-3xl font-bold tracking-tight text-type">More projects</h2>
          <div className="mt-5 divide-y divide-line border-y border-line">
            <a href="https://github.com/toorcn/agentbelt" className="focus-ring group block py-6">
              <h3 className="flex justify-between gap-4 text-lg font-semibold text-type group-hover:text-accent">Agentbelt <span aria-hidden="true">↗</span></h3>
              <p className="mt-2 text-sm text-type-dim">Explore the project on GitHub.</p>
            </a>
            <a href="https://github.com/toorcn/agent-team-manager" className="focus-ring group block py-6">
              <h3 className="flex justify-between gap-4 text-lg font-semibold text-type group-hover:text-accent">Agent Team Manager <span aria-hidden="true">↗</span></h3>
              <p className="mt-2 text-sm text-type-dim">Explore the project on GitHub.</p>
            </a>
            <div className="py-6">
              <h3 className="text-lg font-semibold text-type">ACK <span className="font-normal text-type-faint">/ Agentic Collective Knowledge</span></h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-type-dim">A community AI agent in WhatsApp that helps builders find events, get unstuck on projects, prepare for hackathons, and keep useful resources from disappearing into chat history.</p>
              <p className="mt-3 text-sm text-accent">Available to try in the AI Hackerdorm community WhatsApp group.</p>
            </div>
          </div>
        </section>

        <section id="explore" aria-labelledby="explore-title" className="scroll-mt-28 pt-12 sm:pt-16">
          <h2 id="explore-title" className="font-display text-3xl font-bold tracking-tight text-type">A little more context</h2>
          <nav aria-label="Explore the site" className="mt-5 grid gap-x-12 sm:grid-cols-2">
            {PAGES.map((page) => (
              <Link key={page.href} href={page.href} className="focus-ring group border-t border-line py-6">
                <h3 className="flex items-baseline justify-between gap-4 text-lg font-semibold text-type group-hover:text-accent">{page.title}<span aria-hidden="true">→</span></h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-type-dim">{page.description}</p>
              </Link>
            ))}
            <a href="https://www.malaysian.ai/residents/hong-bing" className="focus-ring group border-t border-line py-6">
              <h3 className="flex items-baseline justify-between gap-4 text-lg font-semibold text-type group-hover:text-accent">Malaysian AI <span aria-hidden="true">↗</span></h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-type-dim">My resident profile on Malaysian AI.</p>
            </a>
          </nav>
        </section>

        <section id="contact" aria-labelledby="contact-title" className="mt-12 scroll-mt-28 border-t border-line pt-10 sm:mt-16">
          <h2 id="contact-title" className="font-display text-3xl font-bold tracking-tight text-type">Say hello.</h2>
          <a href={`mailto:${SITE.email}`} className="focus-ring mt-5 inline-block break-all text-2xl text-accent underline decoration-accent/30 underline-offset-8 hover:decoration-accent">{SITE.email}</a>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {SITE.socials.map((social) => (
              <a key={social.label} href={social.href} className="focus-ring py-2 text-sm text-type-dim hover:text-accent">{social.label} ↗</a>
            ))}
            <Link href="/contact" className="focus-ring py-2 text-sm text-type-dim hover:text-accent">Contact details →</Link>
          </div>
        </section>

        <footer className="mt-14 flex flex-wrap justify-between gap-4 border-t border-line pt-6 text-sm text-type-faint">
          <Link href="/" className="focus-ring py-2 hover:text-accent">Take the scenic route →</Link>
          <Link href="/agents" className="focus-ring py-2 hover:text-accent">For agents →</Link>
        </footer>
      </div>
    </div>
  );
}
