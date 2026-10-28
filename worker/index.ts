import { qaData } from "../hack-src/src/data/qa";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
}

const questionIds = new Set(qaData.map((item) => item.id));
const RATE_WINDOW_SECONDS = 60;
const RATE_MAX = 30;

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname !== "/api/qa-votes") return env.ASSETS.fetch(request);

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
