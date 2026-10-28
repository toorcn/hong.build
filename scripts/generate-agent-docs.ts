/**
 * Build-time generator for the agent surface.
 *
 * Writes the same site, as plain markdown and JSON, into public/agent/
 * (plus public/llms.txt and public/profile.json). The Worker serves these
 * in place of the HTML when a request sends `Accept: text/markdown` or ends
 * in `.md` (see worker/index.ts).
 *
 * Run: npx tsx scripts/generate-agent-docs.ts   (also runs before `next build`)
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AWARDS, CHAMPION_COUNT, EVENT_COUNT, NO_PLACEMENT_COUNT, PLACEMENT_COUNT } from "../content/awards";
import { ABOUT_FACTS, NAV, PRINCIPLES, SITE } from "../content/site";
import { getAllProjects } from "../lib/mdx";
import { HACKMIT } from "../content/hackmit";

const ORIGIN = "https://hong.build";
const OUT = join(process.cwd(), "public", "agent");
const PUBLIC = join(process.cwd(), "public");

const projects = getAllProjects();

const page = (path: string, title: string, body: string) =>
  `---\ntitle: ${title}\nurl: ${ORIGIN}${path}\n---\n\n${body.trim()}\n`;

/** MDX comments and JSX don't mean anything to an agent. */
const cleanMdx = (src: string) => src.replace(/\{\/\*[\s\S]*?\*\/\}\s*/g, "").trim();

const projectLines = projects.map((p) => {
  const f = p.frontmatter;
  return `### [${f.title}](${ORIGIN}/work/${f.slug})\n${f.kind} · ${f.year} · ${f.role}\n\n${f.tagline} ${f.outcome}.`;
});

const awardLine = (a: (typeof AWARDS)[number]) =>
  `- ${a.month} ${a.year} — ${a.event}: ${a.result ?? "entered, no placement"}${a.note ? ` (${a.note})` : ""}`;

const files: Record<string, string> = {
  "hackmit.md": page(
    "/hackmit",
    "HackMIT",
    `# HackMIT / ${HACKMIT.name}\n\n${HACKMIT.description}\n\n${AWARDS.filter((a) => a.event === "HackMIT 2026").map(awardLine).join("\n")}\n\n## ${HACKMIT.question}\n\n${HACKMIT.sections.map((s) => `### ${s.title}\n\n${s.body}`).join("\n\n")}\n\n[Original story and photos](${HACKMIT.source})\n\n[All hackathons & competitions](${ORIGIN}/hackathons.md)`,
  ),
  "index.md": page(
    "/",
    SITE.name,
    `# ${SITE.name}

${SITE.title}. ${SITE.location}. ${SITE.status}

> ${SITE.thesis}

The human site at ${ORIGIN} is a visual 3D scroll journey. This is the same content as plain markdown.

## Sections

${NAV.map((n) => `- [${n.label}](${ORIGIN}${n.href}.md)`).join("\n")}

## Work

${projectLines.join("\n\n")}

## Contact

- Email: ${SITE.email}
${SITE.socials.map((s) => `- ${s.label}: ${s.href}`).join("\n")}

## More from this site

- [llms.txt](${ORIGIN}/llms.txt)
- [profile.json](${ORIGIN}/profile.json)`,
  ),
  "about.md": page(
    "/about",
    "About",
    `# About

${SITE.name} builds interfaces where AI, design systems and code meet. Computer science and psychology background; most of the work sits between a technical system and the person using it.

## Facts

${ABOUT_FACTS.map((f) => `- **${f.k}**: ${f.v}`).join("\n")}`,
  ),
  "work.md": page(
    "/work",
    "Work",
    `# Selected work\n\n${projects.map((p) => `${projectLines[projects.indexOf(p)]}\n\nFull case study: ${ORIGIN}/work/${p.frontmatter.slug}.md`).join("\n\n")}`,
  ),
  "process.md": page(
    "/process",
    "Process",
    `# How I build\n\n${PRINCIPLES.map((p, i) => `## ${i}. ${p.k}\n\n${p.v}`).join("\n\n")}`,
  ),
  "hackathons.md": page(
    "/hackathons",
    "Hackathons & competitions",
    `# Hackathons & competitions

Every event entered since October 2022, including the ones that produced nothing.

${EVENT_COUNT} entered · ${PLACEMENT_COUNT} placed · ${NO_PLACEMENT_COUNT} no placement · ${CHAMPION_COUNT} won outright

${AWARDS.map(awardLine).join("\n")}`,
  ),
  "contact.md": page(
    "/contact",
    "Contact",
    `# Contact

- Email: ${SITE.email}
- Location: ${SITE.location}
- Right now: ${SITE.status}
${SITE.socials.map((s) => `- ${s.label}: ${s.href}`).join("\n")}`,
  ),
};

for (const p of projects) {
  const f = p.frontmatter;
  files[`work/${f.slug}.md`] = page(
    `/work/${f.slug}`,
    f.title,
    `# ${f.title}

${f.kind} · ${f.year} · ${f.role}

${f.tagline}

Stack: ${f.stack.join(", ")}

${cleanMdx(p.content)}`,
  );
}

const llms = `# ${SITE.name}

> ${SITE.title}, ${SITE.location}. ${SITE.status}

Every page is also available as markdown: send \`Accept: text/markdown\`, or add \`.md\` to the path.

## Pages

${[...NAV.map((n) => `- [${n.label}](${ORIGIN}${n.href}.md)`), `- [Home](${ORIGIN}/index.md)`].join("\n")}

## Case studies

${projects.map((p) => `- [${p.frontmatter.title}](${ORIGIN}/work/${p.frontmatter.slug}.md): ${p.frontmatter.tagline}`).join("\n")}

## Data

- [profile.json](${ORIGIN}/profile.json)
`;

const profile = {
  name: SITE.name,
  title: SITE.title,
  location: SITE.location,
  thesis: SITE.thesis,
  status: SITE.status,
  email: SITE.email,
  links: Object.fromEntries(SITE.socials.map((s) => [s.label, s.href])),
  facts: Object.fromEntries(ABOUT_FACTS.map((f) => [f.k, f.v])),
  work: projects.map((p) => ({ ...p.frontmatter, url: `${ORIGIN}/work/${p.frontmatter.slug}.md` })),
  runLog: {
    entered: EVENT_COUNT,
    placed: PLACEMENT_COUNT,
    noPlacement: NO_PLACEMENT_COUNT,
    wonOutright: CHAMPION_COUNT,
    events: AWARDS,
  },
  markdown: `${ORIGIN}/index.md`,
};

mkdirSync(join(OUT, "work"), { recursive: true });
for (const [name, body] of Object.entries(files)) writeFileSync(join(OUT, name), body);
writeFileSync(join(PUBLIC, "llms.txt"), llms);
writeFileSync(join(PUBLIC, "profile.json"), `${JSON.stringify(profile, null, 2)}\n`);

console.log(`agent docs: ${Object.keys(files).length} markdown files, llms.txt, profile.json`);
