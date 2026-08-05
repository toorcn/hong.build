import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";

const PROJECTS_DIR = join(process.cwd(), "content", "projects");

export interface ProjectFrontmatter {
  slug: string;
  title: string;
  tagline: string;
  year: number;
  role: string;
  stack: string[];
  /** Accent tag shown in lists: e.g. "AI", "EVENT", "COMMUNITY". */
  kind: string;
  /** Short outcome line for cards. */
  outcome: string;
  /** Ordering in lists; lower = earlier. */
  order: number;
  draft?: boolean;
}

export interface Project {
  frontmatter: ProjectFrontmatter;
  content: string;
  readingTime: string;
}

function parseProject(file: string): Project {
  const raw = readFileSync(join(PROJECTS_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const fm = data as ProjectFrontmatter;
  if (!fm.slug) {
    fm.slug = file.replace(/\.mdx$/, "");
  }
  return {
    frontmatter: fm,
    content,
    readingTime: readingTime(content).text,
  };
}

export function getAllProjects(): Project[] {
  return readdirSync(PROJECTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map(parseProject)
    .filter((p) => !p.frontmatter.draft)
    .sort((a, b) => a.frontmatter.order - b.frontmatter.order);
}

export function getProject(slug: string): Project | null {
  const all = getAllProjects();
  return all.find((p) => p.frontmatter.slug === slug) ?? null;
}

export function getProjectSlugs(): string[] {
  return getAllProjects().map((p) => p.frontmatter.slug);
}
