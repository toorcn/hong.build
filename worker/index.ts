import { qaData } from "../hack-src/src/data/qa";
import { handleEventIcs, handleEventsApi, handleFeedIcs, handlePlanIcs } from "./events/api";
import { handleIngest } from "./events/ingest";

const EVENTS_HOST = "events.hong.build";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  EVENTS_INGEST_TOKEN?: string;
}

const questionIds = new Set(qaData.map((item) => item.id));
const RATE_WINDOW_SECONDS = 60;
const RATE_MAX = 30;

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const events = await routeEvents(request, env, url);
    if (events) return events;
    const { pathname } = url;
    if (pathname !== "/api/qa-votes") return serveSite(request, env, url);

    try {
      if (request.method === "GET") return json(await getCounts(env));
      if (request.method === "POST") return json(await createVote(request, env));
      return json({ error: "Method not allowed" }, 405, { Allow: "GET, POST" });
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status);
      return json({ error: "Unexpected error" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;

/** Event endpoints (any host) and the events.hong.build app. Returns null when not ours. */
async function routeEvents(request: Request, env: Env, url: URL): Promise<Response | null> {
  const { pathname } = url;
  if (pathname === "/api/events/ingest") {
    return request.method === "POST"
      ? handleIngest(request, env)
      : json({ error: "Method not allowed" }, 405, { Allow: "POST" });
  }
  const readOnly = request.method === "GET" || request.method === "HEAD";
  const isEventsPath =
    pathname === "/api/events" || pathname === "/api/events/plan.ics" || pathname === "/events.ics" || pathname.startsWith("/e/");
  if (!readOnly) {
    return url.hostname === EVENTS_HOST || isEventsPath
      ? json({ error: "Method not allowed" }, 405, { Allow: "GET, HEAD" })
      : null;
  }
  if (pathname === "/api/events") return handleEventsApi(env);
  if (pathname === "/api/events/plan.ics") return handlePlanIcs(url, env);
  if (pathname === "/events.ics") return handleFeedIcs(env);
  const single = /^\/e\/([0-9a-f]{16})\.ics$/.exec(pathname);
  if (single) return handleEventIcs(single[1]!, env);
  if (url.hostname === EVENTS_HOST) return serveEventsApp(request, env, url);
  if (pathname === "/events" || pathname === "/events/") return Response.redirect(`https://${EVENTS_HOST}/`, 308);
  return null;
}

/** The events app is a single page: its files live under /events/, every other path gets the shell. */
async function serveEventsApp(request: Request, env: Env, url: URL): Promise<Response> {
  if (url.pathname.startsWith("/events/") && url.pathname !== "/events/") return env.ASSETS.fetch(request);
  const shell = await env.ASSETS.fetch(new Request(new URL("/events/", url), request));
  const headers = new Headers(shell.headers);
  headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  return new Response(shell.body, { status: shell.status, headers });
}

/** Pages with a markdown twin in public/agent/ (see scripts/generate-agent-docs.ts). */
function markdownAsset(pathname: string, wantsMarkdown: boolean): string | null {
  if (pathname.endsWith(".md")) return `/agent${pathname}`;
  if (!wantsMarkdown || /\.[a-z0-9]+$/i.test(pathname)) return null;
  const clean = pathname.replace(/\/+$/, "");
  return `/agent/${clean === "" ? "index" : clean.slice(1)}.md`;
}

/** True when the client asks for markdown ahead of HTML (or HTML isn't listed). */
function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const md = accept.indexOf("text/markdown");
  if (md === -1) return false;
  const html = accept.indexOf("text/html");
  return html === -1 || md < html;
}

async function serveSite(request: Request, env: Env, url: URL): Promise<Response> {
  // Preserve links to the previous event-list routes.
  if (/^\/(?:notes?|run-log)(?:\/|\.html|\.md)?$/.test(url.pathname)) {
    url.pathname = url.pathname.endsWith(".md") ? "/hackathons.md" : "/hackathons";
    return Response.redirect(url.toString(), 308);
  }

  const readOnly = request.method === "GET" || request.method === "HEAD";
  const accept = request.headers.get("accept");
  const target = readOnly ? markdownAsset(url.pathname, prefersMarkdown(accept)) : null;

  if (target) {
    const doc = await env.ASSETS.fetch(new Request(new URL(target, url), request));
    if (doc.ok) {
      const headers = new Headers(doc.headers);
      headers.set("Content-Type", "text/markdown; charset=utf-8");
      headers.set("Vary", "Accept");
      headers.set("Cache-Control", "public, max-age=300");
      return new Response(doc.body, { status: 200, headers });
    }
  }

  const res = await env.ASSETS.fetch(request);
  const type = res.headers.get("content-type") ?? "";
  if (!readOnly || !type.includes("text/html")) return res;

  // Advertise the agent surface on every HTML page, and keep caches honest
  // about the Accept-based switch above.
  const headers = new Headers(res.headers);
  headers.append("Vary", "Accept");
  headers.append("Link", '</llms.txt>; rel="alternate"; type="text/plain"');
  headers.append("Link", '</profile.json>; rel="alternate"; type="application/json"');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function getCounts(env: Env) {
  const { results } = await env.DB.prepare(
    "SELECT question_id, COUNT(*) AS n FROM qa_votes GROUP BY question_id",
  ).all<{ question_id: string; n: number }>();
  const counts: Record<string, number> = Object.fromEntries(qaData.map((item) => [item.id, 0]));
  for (const row of results) if (row.question_id in counts) counts[row.question_id] = row.n;
  return { counts, enabled: true };
}

async function createVote(request: Request, env: Env) {
  const body = (await request.json().catch(() => ({}))) as { questionId?: unknown; voterId?: unknown };
  const questionId = typeof body.questionId === "string" ? body.questionId : "";
  const voterId = typeof body.voterId === "string" ? body.voterId.trim() : "";

  if (!questionIds.has(questionId)) throw new HttpError(400, "Unknown question");
  if (!/^[a-zA-Z0-9:_-]{12,120}$/.test(voterId)) throw new HttpError(400, "Missing voter");

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  await enforceRateLimit(env, await hash(ip));

  const voterKey = await hash(`${voterId}|${ip}|${(request.headers.get("user-agent") ?? "").slice(0, 200)}`);
  const inserted = await env.DB.prepare(
    "INSERT OR IGNORE INTO qa_votes (question_id, voter_key) VALUES (?, ?)",
  )
    .bind(questionId, voterKey)
    .run();
  const alreadyVoted = inserted.meta.changes === 0;

  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM qa_votes WHERE question_id = ?")
    .bind(questionId)
    .first<{ n: number }>();
  return { count: row?.n ?? 0, alreadyVoted, enabled: true };
}

async function enforceRateLimit(env: Env, ipHash: string) {
  const bucket = Math.floor(Date.now() / 1000 / RATE_WINDOW_SECONDS);
  const row = await env.DB.prepare(
    `INSERT INTO qa_rate (ip_hash, bucket, hits) VALUES (?, ?, 1)
     ON CONFLICT (ip_hash, bucket) DO UPDATE SET hits = hits + 1
     RETURNING hits`,
  )
    .bind(ipHash, bucket)
    .first<{ hits: number }>();
  if ((row?.hits ?? 0) > RATE_MAX) throw new HttpError(429, "Too many votes");
  await env.DB.prepare("DELETE FROM qa_rate WHERE bucket < ?").bind(bucket - 1).run();
}

async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
