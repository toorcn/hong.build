# Builder Line (events.hong.build) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `events.hong.build`: a transit-map calendar of KL builder events, fed by OpenClaw pushing to an ingest endpoint on the existing Cloudflare Worker + D1.

**Architecture:** The existing Worker (`worker/index.ts`) gains event endpoints (ingest, read API, `.ics` feeds) backed by two new D1 tables, plus host-based routing that serves a new standalone Vite + React app (`events-src/` → `public/events/`) on `events.hong.build`. Pure logic (date parsing, places, topics, status, timetable) lives in small, unit-tested modules; UI behaviour is covered by Playwright against a fixture API.

**Tech Stack:** Cloudflare Workers + D1, TypeScript, Vitest 4 (Node, with a `node:sqlite` D1 stand-in), Vite 8 + React 19 + Tailwind v4, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-07-kl-builder-events-calendar-design.md` · **Visual reference:** `docs/events/prototype.html` (open in a browser; it is the approved look and motion)

## Global Constraints

- All dates/times are interpreted and displayed in `Asia/Kuala_Lumpur` (UTC+8). SGT has the same offset.
- Event id = first 16 hex chars of SHA-256 of the normalized `signup_url`.
- Ingest limits: body ≤ 1 MB, ≤ 1000 events, auth `Authorization: Bearer <EVENTS_INGEST_TOKEN>`.
- Shrink guard: refuse with 409 when a push has 0 accepted events, or when visible upcoming ≥ 4 and accepted upcoming < 50% of it — unless `allow_shrink: true`.
- Topic colours: AI `#e8453c` · Founder `#2f6fde` · Hack `#1aa260` · Design `#9b51e0` · Hardware `#f39c12` · Community `#8a8f98`. Branch teal `#00a3a3`. Display amber `#ffb627` on `#0b0c0e`.
- No topic filter chips, no network switch, no sideways desktop map, no Bahasa Malaysia copy (all cut in design).
- Frontend JS budget: < 100 KB gzipped.
- Never commit secrets. `EVENTS_INGEST_TOKEN` is set by Hong with `wrangler secret put`; agents never handle its value. Agents never run `wrangler deploy`, `wrangler secret put`, or remote D1 migrations — those are Hong's steps in Task 13.
- The repo already has unrelated uncommitted work on the current branch. Stage only the files each task names (`git add <paths>`), never `git add -A` / `git add .`.

## File Structure

```
migrations/0002_events.sql            D1 tables: events, event_ingests
worker/tsconfig.json                  typecheck config for the Worker (workers-types)
worker/index.ts                       (modify) routes event paths + events.hong.build host
worker/events/types.ts                shared pure types (also imported by events-src)
worker/events/env.ts                  EventsEnv (DB + token)
worker/events/time.ts                 MYT date helpers, date_text / ISO parsing
worker/events/id.ts                   signup_url normalization + event id
worker/events/places.ts               location_text → region + branch tag
worker/events/topics.ts               name → topic
worker/events/normalize.ts            raw OpenClaw record → NormalizedEvent | rejection
worker/events/ingest.ts               POST /api/events/ingest
worker/events/ics.ts                  iCalendar builder
worker/events/api.ts                  GET /api/events, /events.ics, /e/<id>.ics, /api/events/plan.ics
worker/test/helpers/d1.ts             D1 stand-in over node:sqlite (applies migrations/)
worker/test/helpers/events.ts         test env + ingest helpers
worker/test/*.test.ts                 unit + handler + routing tests
vitest.config.ts                      root Vitest config (worker tests only)
wrangler.jsonc                        (modify) events.hong.build route, asset bypass
events-src/                           Vite app (package.json, vite/ts/playwright configs, index.html)
events-src/src/lib/*.ts               time, status, timetable, lines, prefs, api, sound
events-src/src/hooks/*.ts             useNow, useMedia, useFlap
events-src/src/components/*.tsx       TopBar, PlatformDisplay, Line, DayStation, Stop, Spur,
                                      BackToNow, Sheet, Ticket, Wallet, Toast
events-src/tests/unit/*.test.ts       Vitest unit tests for lib/
events-src/tests/e2e/*.ts             Playwright fixture, setup and specs
public/events/                        build output (committed, like public/hack/)
docs/events/openclaw-ingest.md        OpenClaw contract + paste-ready instructions
```

---

### Task 1: Worker test harness, D1 stand-in and the events migration

**Files:**
- Modify: `package.json` (devDependencies, scripts)
- Modify: `tsconfig.json` (exclude `events-src`, `docs`)
- Modify: `.gitignore` (add `.dev.vars`)
- Create: `vitest.config.ts`
- Create: `worker/tsconfig.json`
- Create: `migrations/0002_events.sql`
- Create: `worker/test/helpers/d1.ts`
- Test: `worker/test/migration.test.ts`

**Interfaces:**
- Produces: `createTestDb(): D1Database & { raw: DatabaseSync }` — an in-memory database with every `migrations/*.sql` applied, supporting `prepare(sql).bind(...).all() / first() / run()` and `batch([...])`.

- [ ] **Step 1: Install root dev dependencies**

Run: `npm install --save-dev vitest@^4 @cloudflare/workers-types@^4`
Expected: both appear under `devDependencies` in `package.json`.

- [ ] **Step 2: Add scripts and config**

In `package.json` `"scripts"`, add (keep existing scripts unchanged):

```json
    "test:worker": "vitest run --config vitest.config.ts",
    "typecheck:worker": "tsc -p worker/tsconfig.json",
    "events:build": "npm --prefix events-src run build"
```

In `tsconfig.json`, change the `"exclude"` array to:

```json
  "exclude": [
    "node_modules",
    "hack-src",
    "events-src",
    "worker",
    "docs"
  ]
```

Append to `.gitignore`:

```
# local Worker secrets for `wrangler dev`
.dev.vars
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["worker/test/**/*.test.ts"],
    environment: "node",
  },
});
```

Create `worker/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["test"]
}
```

- [ ] **Step 3: Write the D1 stand-in**

Create `worker/test/helpers/d1.ts`:

```ts
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const MIGRATIONS = fileURLToPath(new URL("../../../migrations", import.meta.url));

function toParam(value: unknown): SQLInputValue {
  if (value === undefined) return null;
  if (typeof value === "boolean") return value ? 1 : 0;
  return value as SQLInputValue;
}

class TestStatement {
  constructor(
    private readonly db: DatabaseSync,
    private readonly sql: string,
    private readonly params: SQLInputValue[] = [],
  ) {}

  bind(...params: unknown[]) {
    return new TestStatement(this.db, this.sql, params.map(toParam));
  }

  async all<T>() {
    const results = this.db.prepare(this.sql).all(...this.params) as T[];
    return { results, success: true, meta: {} };
  }

  async first<T>(column?: string): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...this.params) as Record<string, unknown> | undefined;
    if (!row) return null;
    return (column ? row[column] : row) as T;
  }

  async run() {
    const result = this.db.prepare(this.sql).run(...this.params);
    return {
      results: [],
      success: true,
      meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) },
    };
  }
}

/** In-memory D1 look-alike with every migrations/*.sql applied, for Node-side tests. */
export function createTestDb() {
  const db = new DatabaseSync(":memory:");
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    db.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
  }
  const d1 = {
    raw: db,
    prepare: (sql: string) => new TestStatement(db, sql),
    async batch(statements: TestStatement[]) {
      db.exec("BEGIN");
      try {
        const out = [];
        for (const statement of statements) out.push(await statement.run());
        db.exec("COMMIT");
        return out;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
  return d1 as unknown as D1Database & { raw: DatabaseSync };
}
```

- [ ] **Step 4: Write the failing migration test**

Create `worker/test/migration.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createTestDb } from "./helpers/d1";

describe("migrations", () => {
  it("creates the events and event_ingests tables alongside the Q&A tables", async () => {
    const db = createTestDb();
    const { results } = await db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all<{ name: string }>();
    expect(results.map((r) => r.name)).toEqual(
      expect.arrayContaining(["events", "event_ingests", "qa_votes", "qa_rate"]),
    );
  });

  it("indexes visible events by start time", async () => {
    const db = createTestDb();
    const row = await db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'events_visible'")
      .first<{ name: string }>();
    expect(row?.name).toBe("events_visible");
  });
});
```

- [ ] **Step 5: Run it to see it fail**

Run: `npm run test:worker`
Expected: FAIL — `events` / `event_ingests` / `events_visible` missing.

- [ ] **Step 6: Write the migration**

Create `migrations/0002_events.sql`:

```sql
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_at INTEGER NOT NULL,
  end_at INTEGER,
  all_day INTEGER NOT NULL DEFAULT 0,
  date_local TEXT NOT NULL,
  region TEXT NOT NULL,
  place_tag TEXT,
  topic TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'event',
  location_text TEXT NOT NULL,
  signup_url TEXT NOT NULL,
  organizer TEXT,
  price TEXT,
  image_url TEXT,
  raw TEXT NOT NULL,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  removed INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS events_visible ON events (removed, start_at);

CREATE TABLE IF NOT EXISTS event_ingests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  source TEXT,
  status TEXT NOT NULL,
  dry_run INTEGER NOT NULL DEFAULT 0,
  received INTEGER,
  added INTEGER,
  updated INTEGER,
  removed INTEGER,
  rejected INTEGER,
  detail TEXT
);
```

(`start_at`/`end_at` are unix seconds; `first_seen`/`last_seen`/`event_ingests.at` are unix milliseconds.)

- [ ] **Step 7: Run tests to see them pass**

Run: `npm run test:worker`
Expected: PASS (2 tests).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore vitest.config.ts worker/tsconfig.json migrations/0002_events.sql worker/test/helpers/d1.ts worker/test/migration.test.ts
git commit -m "Add events D1 migration and Node-side Worker test harness"
```

---

### Task 2: MYT time helpers and date parsing

**Files:**
- Create: `worker/events/time.ts`
- Test: `worker/test/time.test.ts`

**Interfaces:**
- Produces: `MYT_OFFSET_S = 28800`, `DAY_S = 86400`, `parseDateText(text: string): string | null` (returns `YYYY-MM-DD`), `parseIso(text: string): number | null` (unix seconds; no offset ⇒ MYT), `localDate(unixSeconds: number): string`, `startOfLocalDay(dateLocal: string): number`.

- [ ] **Step 1: Write the failing tests**

Create `worker/test/time.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { localDate, parseDateText, parseIso, startOfLocalDay } from "../events/time";

describe("parseDateText", () => {
  it.each([
    ["Wednesday, 11 November 2026", "2026-11-11"],
    ["11 November 2026", "2026-11-11"],
    ["11 Nov 2026", "2026-11-11"],
    ["Wed 11 Nov. 2026", "2026-11-11"],
    ["Nov 11, 2026", "2026-11-11"],
    ["November 11 2026", "2026-11-11"],
    ["2026-11-11", "2026-11-11"],
    ["  saturday,  7   november   2026 ", "2026-11-07"],
    ["1 Sept 2026", "2026-09-01"],
  ])("reads %j", (input, expected) => {
    expect(parseDateText(input)).toBe(expected);
  });

  it.each(["32 November 2026", "Smarch 3 2026", "next tuesday", "11/11/2026", "Ma 3 2026", ""])(
    "rejects %j",
    (input) => {
      expect(parseDateText(input)).toBeNull();
    },
  );
});

describe("parseIso", () => {
  it("honours an explicit offset", () => {
    expect(parseIso("2026-11-11T19:00:00+08:00")).toBe(Date.parse("2026-11-11T11:00:00Z") / 1000);
    expect(parseIso("2026-11-11T11:00:00Z")).toBe(Date.parse("2026-11-11T11:00:00Z") / 1000);
    expect(parseIso("2026-11-11T19:00:00+0800")).toBe(Date.parse("2026-11-11T11:00:00Z") / 1000);
  });

  it("treats a time without an offset as Malaysia time", () => {
    expect(parseIso("2026-11-11T19:00")).toBe(Date.parse("2026-11-11T11:00:00Z") / 1000);
  });

  it("rejects things that are not ISO date-times", () => {
    expect(parseIso("tomorrow 7pm")).toBeNull();
    expect(parseIso("2026-11-11")).toBeNull();
  });
});

describe("local day helpers", () => {
  it("rolls over at midnight Malaysia time", () => {
    expect(localDate(Date.parse("2026-11-07T15:59:59Z") / 1000)).toBe("2026-11-07");
    expect(localDate(Date.parse("2026-11-07T16:00:00Z") / 1000)).toBe("2026-11-08");
  });

  it("finds the start of a local day", () => {
    expect(startOfLocalDay("2026-11-11")).toBe(Date.parse("2026-11-10T16:00:00Z") / 1000);
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `npm run test:worker -- worker/test/time.test.ts`
Expected: FAIL — cannot resolve `../events/time`.

- [ ] **Step 3: Implement**

Create `worker/events/time.ts`:

```ts
/** Malaysia (and Singapore) are UTC+8 all year. */
export const MYT_OFFSET_S = 8 * 60 * 60;
export const DAY_S = 24 * 60 * 60;

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

function monthIndex(word: string): number | null {
  const w = word.toLowerCase().replace(/\.$/, "");
  if (w.length < 3) return null;
  const i = MONTH_NAMES.findIndex((m) => m.startsWith(w));
  return i === -1 ? null : i + 1;
}

function isoDate(y: number, m: number, d: number): string | null {
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return t.toISOString().slice(0, 10);
}

/** Reads OpenClaw's human date ("Wednesday, 11 November 2026") into YYYY-MM-DD, or null. */
export function parseDateText(text: string): string | null {
  const s = text
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?,? /i, "");
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return isoDate(Number(m[1]), Number(m[2]), Number(m[3]));
  m = /^(\d{1,2}) ([a-z]+\.?),? (\d{4})$/i.exec(s);
  if (m) {
    const month = monthIndex(m[2]!);
    return month ? isoDate(Number(m[3]), month, Number(m[1])) : null;
  }
  m = /^([a-z]+\.?) (\d{1,2}),? (\d{4})$/i.exec(s);
  if (m) {
    const month = monthIndex(m[1]!);
    return month ? isoDate(Number(m[3]), month, Number(m[2])) : null;
  }
  return null;
}

/** ISO 8601 date-time → unix seconds. A missing offset means Malaysia time. */
export function parseIso(text: string): number | null {
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(:\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(text.trim());
  if (!m) return null;
  let zone = m[4] ?? "+08:00";
  if (/^[+-]\d{4}$/.test(zone)) zone = `${zone.slice(0, 3)}:${zone.slice(3)}`;
  const ms = Date.parse(`${m[1]}T${m[2]}${m[3] ?? ":00"}${zone}`);
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
}

/** YYYY-MM-DD of a unix time, in Malaysia. */
export function localDate(unixSeconds: number): string {
  return new Date((unixSeconds + MYT_OFFSET_S) * 1000).toISOString().slice(0, 10);
}

/** Unix seconds of 00:00 Malaysia time on a local date. */
export function startOfLocalDay(dateLocal: string): number {
  return Date.parse(`${dateLocal}T00:00:00Z`) / 1000 - MYT_OFFSET_S;
}
```

- [ ] **Step 4: Run to see pass**

Run: `npm run test:worker -- worker/test/time.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add worker/events/time.ts worker/test/time.test.ts
git commit -m "Add Malaysia-time date parsing for event ingest"
```

---

### Task 3: Signup URL normalization and event ids

**Files:**
- Create: `worker/events/id.ts`
- Test: `worker/test/id.test.ts`

**Interfaces:**
- Produces: `normalizeUrl(raw: string): string | null` (https only; lowercase host; drops `utm_*` params and fragment; drops trailing `/` on non-root paths), `eventId(normalizedUrl: string): Promise<string>` (16 lowercase hex chars).

- [ ] **Step 1: Write the failing tests**

Create `worker/test/id.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { eventId, normalizeUrl } from "../events/id";

describe("normalizeUrl", () => {
  it("strips tracking, fragments, case and trailing slashes", () => {
    expect(normalizeUrl("https://Luma.com/cwe18vhn/?utm_source=x&ref=y#top")).toBe(
      "https://luma.com/cwe18vhn?ref=y",
    );
    expect(normalizeUrl(" https://luma.com/cwe18vhn?utm_medium=a&UTM_campaign=b ")).toBe(
      "https://luma.com/cwe18vhn",
    );
  });

  it("only accepts https", () => {
    expect(normalizeUrl("http://luma.com/x")).toBeNull();
    expect(normalizeUrl("not a url")).toBeNull();
  });
});

describe("eventId", () => {
  it("is 16 hex characters and stable across URL variants", async () => {
    const a = await eventId(normalizeUrl("https://luma.com/cwe18vhn")!);
    const b = await eventId(normalizeUrl("https://LUMA.com/cwe18vhn/?utm_source=wa")!);
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(b).toBe(a);
  });

  it("differs for different events", async () => {
    expect(await eventId("https://luma.com/a")).not.toBe(await eventId("https://luma.com/b"));
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `npm run test:worker -- worker/test/id.test.ts`
Expected: FAIL — cannot resolve `../events/id`.

- [ ] **Step 3: Implement**

Create `worker/events/id.ts`:

```ts
/** Canonical form of an event link, so the same event always maps to the same id. */
export function normalizeUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith("utm_")) url.searchParams.delete(key);
  }
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) url.pathname = url.pathname.slice(0, -1);
  return url.toString();
}

/** First 16 hex chars of SHA-256 of the normalized URL. */
export async function eventId(normalizedUrl: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalizedUrl));
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}
```

- [ ] **Step 4: Run to see pass**

Run: `npm run test:worker -- worker/test/id.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add worker/events/id.ts worker/test/id.test.ts
git commit -m "Derive stable event ids from normalized signup links"
```

---

### Task 4: Shared types, places and topics

**Files:**
- Create: `worker/events/types.ts`
- Create: `worker/events/env.ts`
- Create: `worker/events/places.ts`
- Create: `worker/events/topics.ts`
- Test: `worker/test/places-topics.test.ts`

**Interfaces:**
- Produces (types.ts): `Region = "kv" | "sg" | "online" | "other"`, `Topic = "ai" | "founder" | "hack" | "design" | "hardware" | "community"`, `Kind = "event" | "deadline"`, `NormalizedEvent`, `PublicEvent`, `EventsResponse` (exact fields below). types.ts must stay free of Worker-only types — `events-src` imports it.
- Produces (env.ts): `EventsEnv { DB: D1Database; EVENTS_INGEST_TOKEN?: string }`.
- Produces: `isRegion(v: unknown): v is Region`, `resolvePlace(locationText: string, explicit?: Region): { region: Region; placeTag: string | null; known: boolean }`, `isTopic(v: unknown): v is Topic`, `resolveTopic(name: string, explicit?: Topic): Topic`.

- [ ] **Step 1: Write the types**

Create `worker/events/types.ts`:

```ts
export type Region = "kv" | "sg" | "online" | "other";
export type Topic = "ai" | "founder" | "hack" | "design" | "hardware" | "community";
export type Kind = "event" | "deadline";

/** One event after the Worker has cleaned it up; maps 1:1 onto the `events` table. */
export interface NormalizedEvent {
  id: string;
  name: string;
  startAt: number; // unix seconds
  endAt: number | null;
  allDay: boolean;
  dateLocal: string; // YYYY-MM-DD, Malaysia
  region: Region;
  placeTag: string | null;
  topic: Topic;
  kind: Kind;
  locationText: string;
  signupUrl: string;
  organizer: string | null;
  price: string | null;
  imageUrl: string | null;
  raw: string; // OpenClaw's original record, JSON
}

/** What GET /api/events returns per event. */
export interface PublicEvent {
  id: string;
  name: string;
  start: string; // ISO, UTC
  end: string | null;
  all_day: boolean;
  date: string; // YYYY-MM-DD, Malaysia
  region: Region;
  place_tag: string | null;
  topic: Topic;
  kind: Kind;
  location: string;
  url: string;
  organizer: string | null;
  price: string | null;
  image: string | null;
}

export interface EventsResponse {
  generated_at: string;
  last_ingest_at: string | null;
  tz: "Asia/Kuala_Lumpur";
  events: PublicEvent[];
}
```

Create `worker/events/env.ts`:

```ts
export interface EventsEnv {
  DB: D1Database;
  EVENTS_INGEST_TOKEN?: string;
}
```

- [ ] **Step 2: Write the failing tests**

Create `worker/test/places-topics.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolvePlace } from "../events/places";
import { resolveTopic } from "../events/topics";

describe("resolvePlace", () => {
  it.each([
    ["Petaling Jaya", "kv", null],
    ["Bangsar South, Kuala Lumpur", "kv", null],
    ["Common Ground, TTDI", "kv", null],
    ["Singapore", "sg", "SG"],
    ["Online (Zoom)", "online", "ONLINE"],
    ["Penang", "other", "PENANG"],
    ["Tokyo, Japan", "other", "TOKYO"],
  ])("places %j", (text, region, tag) => {
    expect(resolvePlace(text)).toEqual({ region, placeTag: tag, known: true });
  });

  it("keeps unknown places on the main line but says so", () => {
    expect(resolvePlace("Somewhere Mysterious")).toEqual({ region: "kv", placeTag: null, known: false });
  });

  it("lets an explicit region win", () => {
    expect(resolvePlace("Marina Bay", "sg")).toEqual({ region: "sg", placeTag: "SG", known: true });
    expect(resolvePlace("Bali, Indonesia", "other")).toEqual({ region: "other", placeTag: "BALI", known: true });
    expect(resolvePlace("Ubud", "other")).toEqual({ region: "other", placeTag: "UBUD", known: true });
    expect(resolvePlace("Penang", "kv")).toEqual({ region: "kv", placeTag: null, known: true });
  });
});

describe("resolveTopic", () => {
  it.each([
    ["Code Meets Animation - SwiftLah! Community x LottieFiles", "design"],
    ["AI Tinker Night", "ai"],
    ["Weekend Hack Sprint", "hack"],
    ["Build an AI agent: 24h hackathon", "hack"],
    ["Hardware Jam", "hardware"],
    ["Founders Coffee", "founder"],
    ["Startup Pitch Brunch", "founder"],
    ["Building with Rust", "community"],
    ["Guild meetup", "community"],
  ])("guesses %j", (name, topic) => {
    expect(resolveTopic(name)).toBe(topic);
  });

  it("lets an explicit topic win", () => {
    expect(resolveTopic("AI talk", "hardware")).toBe("hardware");
  });
});
```

- [ ] **Step 3: Run to see failure**

Run: `npm run test:worker -- worker/test/places-topics.test.ts`
Expected: FAIL — cannot resolve `../events/places`.

- [ ] **Step 4: Implement places**

Create `worker/events/places.ts`:

```ts
import type { Region } from "./types";

export const REGIONS: readonly Region[] = ["kv", "sg", "online", "other"];
export const isRegion = (v: unknown): v is Region => typeof v === "string" && (REGIONS as string[]).includes(v);

const KLANG_VALLEY = [
  "kuala lumpur", "kl", "klcc", "kl sentral", "bukit bintang", "petaling jaya", "pj", "bangsar",
  "bangsar south", "mid valley", "ttdi", "taman tun dr ismail", "damansara", "mont kiara",
  "sri hartamas", "cyberjaya", "putrajaya", "subang", "subang jaya", "puchong", "shah alam",
  "cheras", "ampang", "bukit jalil", "sunway", "kepong", "setapak", "klang", "selangor",
];
const ONLINE = ["online", "virtual", "zoom", "remote", "livestream", "live stream", "google meet"];
const SINGAPORE = ["singapore", "sg"];
const OTHER: Record<string, string> = {
  penang: "PENANG", "george town": "PENANG", "johor bahru": "JB", jb: "JB", johor: "JOHOR",
  ipoh: "IPOH", melaka: "MELAKA", malacca: "MELAKA", "kota kinabalu": "KK", kuching: "KUCHING",
  jakarta: "JAKARTA", bali: "BALI", bangkok: "BANGKOK", "ho chi minh": "HCMC", manila: "MANILA",
  tokyo: "TOKYO", seoul: "SEOUL", "hong kong": "HONG KONG", taipei: "TAIPEI", shanghai: "SHANGHAI",
  shenzhen: "SHENZHEN", beijing: "BEIJING", sydney: "SYDNEY", london: "LONDON",
  "san francisco": "SF", "new york": "NYC",
};

export interface PlaceResult {
  region: Region;
  placeTag: string | null;
  known: boolean;
}

function matcher(locationText: string) {
  const text = locationText.toLowerCase();
  return (term: string) =>
    new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(text);
}

const fallbackTag = (text: string) => (text.split(",")[0] ?? text).trim().toUpperCase().slice(0, 12) || "AWAY";

/** Main line (Klang Valley) or a branch, plus the short tag a branch station shows. */
export function resolvePlace(locationText: string, explicit?: Region): PlaceResult {
  const has = matcher(locationText);
  const otherTag = () => Object.entries(OTHER).find(([term]) => has(term))?.[1] ?? null;
  if (explicit === "kv") return { region: "kv", placeTag: null, known: true };
  if (explicit === "sg") return { region: "sg", placeTag: "SG", known: true };
  if (explicit === "online") return { region: "online", placeTag: "ONLINE", known: true };
  if (explicit === "other") return { region: "other", placeTag: otherTag() ?? fallbackTag(locationText), known: true };
  if (ONLINE.some(has)) return { region: "online", placeTag: "ONLINE", known: true };
  if (SINGAPORE.some(has)) return { region: "sg", placeTag: "SG", known: true };
  if (KLANG_VALLEY.some(has)) return { region: "kv", placeTag: null, known: true };
  const tag = otherTag();
  if (tag) return { region: "other", placeTag: tag, known: true };
  return { region: "kv", placeTag: null, known: false };
}
```

- [ ] **Step 5: Implement topics**

Create `worker/events/topics.ts`:

```ts
import type { Topic } from "./types";

export const TOPICS: readonly Topic[] = ["ai", "founder", "hack", "design", "hardware", "community"];
export const isTopic = (v: unknown): v is Topic => typeof v === "string" && (TOPICS as string[]).includes(v);

/** First match wins, so a "24h AI hackathon" rides the Hack Line. */
const RULES: [Topic, RegExp][] = [
  ["hack", /\b(hackathons?|hack|hacks|buildathon)\b/i],
  ["ai", /\b(ai|llms?|gpt|agents?|agentic|genai|machine learning|ml)\b/i],
  ["hardware", /\b(hardware|iot|robots?|robotics|maker|makers|electronics)\b/i],
  ["design", /\b(design|ux|ui|animation|figma)\b/i],
  ["founder", /\b(startups?|founders?|pitch|vc|investors?|demo day|fundraising)\b/i],
];

export function resolveTopic(name: string, explicit?: Topic): Topic {
  if (explicit) return explicit;
  return RULES.find(([, re]) => re.test(name))?.[0] ?? "community";
}
```

- [ ] **Step 6: Run to see pass**

Run: `npm run test:worker -- worker/test/places-topics.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add worker/events/types.ts worker/events/env.ts worker/events/places.ts worker/events/topics.ts worker/test/places-topics.test.ts
git commit -m "Map event locations to main line or branch and guess topics"
```

---

### Task 5: Normalize one OpenClaw record

**Files:**
- Create: `worker/events/normalize.ts`
- Test: `worker/test/normalize.test.ts`

**Interfaces:**
- Consumes: `normalizeUrl`, `eventId` (Task 3); `parseDateText`, `parseIso`, `localDate`, `startOfLocalDay`, `DAY_S` (Task 2); `resolvePlace`, `isRegion`, `resolveTopic`, `isTopic` (Task 4).
- Produces: `normalizeEvent(raw: unknown, nowS: number): Promise<NormalizeResult>` where `NormalizeResult = { ok: true; event: NormalizedEvent; warnings: string[] } | { ok: false; reason: string }`. Reason strings are part of the OpenClaw contract — keep them exactly as written.

- [ ] **Step 1: Write the failing tests**

Create `worker/test/normalize.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeEvent } from "../events/normalize";
import { startOfLocalDay } from "../events/time";

const NOW_S = Date.parse("2026-11-07T10:52:00Z") / 1000;
const sample = {
  name: "Code Meets Animation - SwiftLah! Community x LottieFiles",
  date_text: "Wednesday, 11 November 2026",
  location_text: "Petaling Jaya",
  signup_url: "https://luma.com/cwe18vhn",
};

async function ok(raw: unknown) {
  const res = await normalizeEvent(raw, NOW_S);
  if (!res.ok) throw new Error(`expected ok, got: ${res.reason}`);
  return res;
}
async function reason(raw: unknown) {
  const res = await normalizeEvent(raw, NOW_S);
  if (res.ok) throw new Error("expected a rejection");
  return res.reason;
}

describe("normalizeEvent", () => {
  it("accepts OpenClaw's current four-field shape as an all-day event", async () => {
    const { event, warnings } = await ok(sample);
    expect(warnings).toEqual([]);
    expect(event).toMatchObject({
      name: sample.name,
      allDay: true,
      dateLocal: "2026-11-11",
      startAt: startOfLocalDay("2026-11-11"),
      endAt: null,
      region: "kv",
      placeTag: null,
      topic: "design",
      kind: "event",
      locationText: "Petaling Jaya",
      signupUrl: "https://luma.com/cwe18vhn",
      organizer: null,
      price: null,
      imageUrl: null,
    });
    expect(event.id).toMatch(/^[0-9a-f]{16}$/);
    expect(JSON.parse(event.raw)).toEqual(sample);
  });

  it("uses start/end when given", async () => {
    const { event } = await ok({ ...sample, start: "2026-11-11T19:00:00+08:00", end: "2026-11-11T22:00:00+08:00" });
    expect(event.allDay).toBe(false);
    expect(event.startAt).toBe(Date.parse("2026-11-11T11:00:00Z") / 1000);
    expect(event.endAt).toBe(Date.parse("2026-11-11T14:00:00Z") / 1000);
    expect(event.dateLocal).toBe("2026-11-11");
  });

  it("keeps optional extras and explicit choices", async () => {
    const { event } = await ok({
      ...sample, organizer: "SwiftLah! × LottieFiles", price: "Free", kind: "deadline",
      topic: "ai", region: "sg", image_url: "https://images.lu.ma/cover.png",
    });
    expect(event).toMatchObject({
      organizer: "SwiftLah! × LottieFiles", price: "Free", kind: "deadline", topic: "ai",
      region: "sg", placeTag: "SG", imageUrl: "https://images.lu.ma/cover.png",
    });
  });

  it.each([
    ["not an object", "event must be an object", "nope"],
    ["missing name", "missing name", { ...sample, name: " " }],
    ["long name", "name is longer than 200 characters", { ...sample, name: "x".repeat(201) }],
    ["missing location", "missing location_text", { ...sample, location_text: undefined }],
    ["missing url", "missing signup_url", { ...sample, signup_url: undefined }],
    ["http url", "signup_url must be an https URL", { ...sample, signup_url: "http://luma.com/x" }],
    ["unreadable date", 'date_text not understood: "next week"', { ...sample, date_text: "next week" }],
    ["no date at all", "missing date_text or start", { ...sample, date_text: undefined }],
    ["bad start", "start is not a valid ISO 8601 date-time", { ...sample, start: "7pm" }],
    ["past", "date is in the past", { ...sample, date_text: "1 November 2026" }],
    ["far future", "date is more than 365 days ahead", { ...sample, date_text: "1 January 2028" }],
    ["end before start", "end is before start", { ...sample, start: "2026-11-11T19:00", end: "2026-11-11T18:00" }],
  ])("rejects %s", async (_label, expected, raw) => {
    expect(await reason(raw)).toBe(expected);
  });

  it("warns instead of rejecting for fixable extras", async () => {
    const { event, warnings } = await ok({
      ...sample, location_text: "Somewhere Mysterious", image_url: "http://x.com/a.png",
      end: "later", region: "mars", topic: "cooking", kind: "party",
    });
    expect(event.region).toBe("kv");
    expect(event.imageUrl).toBeNull();
    expect(event.endAt).toBeNull();
    expect(warnings).toEqual([
      "end ignored: not a valid ISO 8601 date-time",
      'region "mars" ignored: use kv, sg, online or other',
      'location "Somewhere Mysterious" not recognised; placed on the Klang Valley line (send "region" to override)',
      'topic "cooking" ignored: use ai, founder, hack, design, hardware or community',
      'kind "party" ignored: use event or deadline',
      "image_url dropped: must be https",
    ]);
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `npm run test:worker -- worker/test/normalize.test.ts`
Expected: FAIL — cannot resolve `../events/normalize`.

- [ ] **Step 3: Implement**

Create `worker/events/normalize.ts`:

```ts
import { eventId, normalizeUrl } from "./id";
import { isRegion, resolvePlace } from "./places";
import { DAY_S, localDate, parseDateText, parseIso, startOfLocalDay } from "./time";
import { isTopic, resolveTopic } from "./topics";
import type { NormalizedEvent, Region, Topic } from "./types";

export type NormalizeResult =
  | { ok: true; event: NormalizedEvent; warnings: string[] }
  | { ok: false; reason: string };

const fail = (reason: string): NormalizeResult => ({ ok: false, reason });
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const short = (v: unknown): string | null => str(v)?.slice(0, 200) ?? null;

export async function normalizeEvent(raw: unknown, nowS: number): Promise<NormalizeResult> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail("event must be an object");
  const r = raw as Record<string, unknown>;
  const warnings: string[] = [];

  const name = str(r.name);
  if (!name) return fail("missing name");
  if (name.length > 200) return fail("name is longer than 200 characters");
  const location = str(r.location_text);
  if (!location) return fail("missing location_text");
  const rawUrl = str(r.signup_url);
  if (!rawUrl) return fail("missing signup_url");
  const signupUrl = normalizeUrl(rawUrl);
  if (!signupUrl) return fail("signup_url must be an https URL");

  let startAt: number;
  let allDay: boolean;
  const start = str(r.start);
  const dateText = str(r.date_text);
  if (start) {
    const t = parseIso(start);
    if (t === null) return fail("start is not a valid ISO 8601 date-time");
    startAt = t;
    allDay = false;
  } else if (dateText) {
    const d = parseDateText(dateText);
    if (!d) return fail(`date_text not understood: "${dateText}"`);
    startAt = startOfLocalDay(d);
    allDay = true;
  } else {
    return fail("missing date_text or start");
  }

  let endAt: number | null = null;
  const end = str(r.end);
  if (end) {
    const t = parseIso(end);
    if (t === null) warnings.push("end ignored: not a valid ISO 8601 date-time");
    else if (t < startAt) return fail("end is before start");
    else endAt = t;
  }

  if ((endAt ?? startAt) < nowS - DAY_S) return fail("date is in the past");
  if (startAt > nowS + 365 * DAY_S) return fail("date is more than 365 days ahead");

  let region: Region | undefined;
  if (r.region !== undefined) {
    if (isRegion(r.region)) region = r.region;
    else warnings.push(`region "${String(r.region)}" ignored: use kv, sg, online or other`);
  }
  const place = resolvePlace(location, region);
  if (!place.known) {
    warnings.push(`location "${location}" not recognised; placed on the Klang Valley line (send "region" to override)`);
  }

  let topic: Topic | undefined;
  if (r.topic !== undefined) {
    if (isTopic(r.topic)) topic = r.topic;
    else warnings.push(`topic "${String(r.topic)}" ignored: use ai, founder, hack, design, hardware or community`);
  }

  if (r.kind !== undefined && r.kind !== "event" && r.kind !== "deadline") {
    warnings.push(`kind "${String(r.kind)}" ignored: use event or deadline`);
  }

  let imageUrl: string | null = null;
  const rawImage = str(r.image_url);
  if (rawImage) {
    imageUrl = normalizeUrl(rawImage);
    if (!imageUrl) warnings.push("image_url dropped: must be https");
  }

  return {
    ok: true,
    warnings,
    event: {
      id: await eventId(signupUrl),
      name,
      startAt,
      endAt,
      allDay,
      dateLocal: localDate(startAt),
      region: place.region,
      placeTag: place.placeTag,
      topic: resolveTopic(name, topic),
      kind: r.kind === "deadline" ? "deadline" : "event",
      locationText: location,
      signupUrl,
      organizer: short(r.organizer),
      price: short(r.price),
      imageUrl,
      raw: JSON.stringify(raw),
    },
  };
}
```

- [ ] **Step 4: Run to see pass**

Run: `npm run test:worker -- worker/test/normalize.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add worker/events/normalize.ts worker/test/normalize.test.ts
git commit -m "Normalize and validate OpenClaw event records"
```

---

### Task 6: Ingest endpoint

**Files:**
- Create: `worker/events/ingest.ts`
- Create: `worker/test/helpers/events.ts`
- Test: `worker/test/ingest.test.ts`

**Interfaces:**
- Consumes: `normalizeEvent` (Task 5), `EventsEnv` (Task 4), `createTestDb` (Task 1), `DAY_S`, `localDate`, `startOfLocalDay` (Task 2).
- Produces: `handleIngest(request: Request, env: EventsEnv, nowMs?: number): Promise<Response>`; `IngestReport` type; test helpers `NOW`, `NOW_S`, `TOKEN`, `makeEnv()`, `ev(n, overrides?)`, `ingest(env, body, opts?)`.

- [ ] **Step 1: Write the test helpers**

Create `worker/test/helpers/events.ts`:

```ts
import { handleIngest, type IngestReport } from "../../events/ingest";
import { createTestDb } from "./d1";

export const NOW = Date.parse("2026-11-07T10:52:00Z"); // Sat 7 Nov 2026, 18:52 MYT
export const NOW_S = Math.floor(NOW / 1000);
export const TOKEN = "test-token";

export function makeEnv() {
  return { DB: createTestDb(), EVENTS_INGEST_TOKEN: TOKEN };
}
export type TestEnv = ReturnType<typeof makeEnv>;

export function ev(n: number, overrides: Record<string, unknown> = {}) {
  return {
    name: `Event ${n}`,
    date_text: "Wednesday, 11 November 2026",
    location_text: "Petaling Jaya",
    signup_url: `https://luma.com/e${n}`,
    ...overrides,
  };
}

export type IngestBody = Partial<IngestReport> & { error?: string; current?: number; accepted?: number };

export async function ingest(
  env: TestEnv,
  body: unknown,
  { token = TOKEN, raw }: { token?: string; raw?: string } = {},
): Promise<{ status: number; body: IngestBody }> {
  const request = new Request("https://events.hong.build/api/events/ingest", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: raw ?? JSON.stringify(body),
  });
  const res = await handleIngest(request, env, NOW);
  return { status: res.status, body: (await res.json()) as IngestBody };
}
```

- [ ] **Step 2: Write the failing tests**

Create `worker/test/ingest.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ev, ingest, makeEnv, NOW_S } from "./helpers/events";

const rows = (env: ReturnType<typeof makeEnv>) =>
  env.DB.raw.prepare("SELECT id, name, removed FROM events ORDER BY name").all() as {
    id: string; name: string; removed: number;
  }[];
const lastLog = (env: ReturnType<typeof makeEnv>) =>
  env.DB.raw.prepare("SELECT * FROM event_ingests ORDER BY id DESC LIMIT 1").get() as Record<string, unknown>;

describe("POST /api/events/ingest", () => {
  it("rejects a wrong or unset token", async () => {
    const env = makeEnv();
    expect((await ingest(env, { events: [ev(1)] }, { token: "nope" })).status).toBe(401);
    const noToken = { ...env, EVENTS_INGEST_TOKEN: undefined };
    expect((await ingest(noToken, { events: [ev(1)] })).status).toBe(401);
    expect(env.DB.raw.prepare("SELECT COUNT(*) AS n FROM event_ingests").get()).toEqual({ n: 0 });
  });

  it("rejects bodies that are not a usable payload, and logs them", async () => {
    const env = makeEnv();
    expect(await ingest(env, null, { raw: "{oops" })).toEqual({ status: 400, body: { error: "body is not valid JSON" } });
    expect(await ingest(env, { items: [] })).toEqual({ status: 400, body: { error: "body.events must be an array" } });
    expect(lastLog(env).status).toBe("invalid");
  });

  it("rejects more than 1000 events", async () => {
    const env = makeEnv();
    const events = Array.from({ length: 1001 }, (_, i) => ev(i));
    expect((await ingest(env, { events })).status).toBe(413);
  });

  it("adds events and logs the push", async () => {
    const env = makeEnv();
    const res = await ingest(env, { source: "openclaw", events: [ev(1), ev(2), ev(3)] });
    expect(res).toEqual({
      status: 200,
      body: { dry_run: false, received: 3, added: 3, updated: 0, removed: 0, rejected: [], warnings: [] },
    });
    expect(rows(env)).toHaveLength(3);
    expect(lastLog(env)).toMatchObject({ status: "ok", source: "openclaw", received: 3, added: 3 });
  });

  it("is idempotent when the same list is pushed again", async () => {
    const env = makeEnv();
    await ingest(env, { events: [ev(1), ev(2), ev(3)] });
    const res = await ingest(env, { events: [ev(1), ev(2), ev(3)] });
    expect(res.body).toMatchObject({ added: 0, updated: 3, removed: 0 });
    expect(rows(env)).toHaveLength(3);
  });

  it("hides upcoming events that drop out of the list", async () => {
    const env = makeEnv();
    await ingest(env, { events: [1, 2, 3, 4, 5].map((n) => ev(n)) });
    const res = await ingest(env, { events: [1, 2, 3, 4].map((n) => ev(n)) });
    expect(res.body).toMatchObject({ removed: 1 });
    expect(rows(env).find((r) => r.name === "Event 5")?.removed).toBe(1);
  });

  it("brings a hidden event back when it reappears", async () => {
    const env = makeEnv();
    await ingest(env, { events: [1, 2, 3, 4, 5].map((n) => ev(n)) });
    await ingest(env, { events: [1, 2, 3, 4].map((n) => ev(n)) });
    await ingest(env, { events: [1, 2, 3, 4, 5].map((n) => ev(n)) });
    expect(rows(env).every((r) => r.removed === 0)).toBe(true);
  });

  it("refuses a push that would hide more than half the timetable", async () => {
    const env = makeEnv();
    await ingest(env, { events: [1, 2, 3, 4, 5, 6].map((n) => ev(n)) });
    const res = await ingest(env, { events: [ev(1), ev(2)] });
    expect(res).toEqual({ status: 409, body: { error: "shrink_guard", current: 6, accepted: 2 } });
    expect(rows(env).every((r) => r.removed === 0)).toBe(true);
    expect(lastLog(env).status).toBe("shrink_guard");

    const forced = await ingest(env, { allow_shrink: true, events: [ev(1), ev(2)] });
    expect(forced.body).toMatchObject({ removed: 4 });
  });

  it("refuses an empty push", async () => {
    const env = makeEnv();
    expect((await ingest(env, { events: [] })).status).toBe(409);
  });

  it("reports without writing on a dry run", async () => {
    const env = makeEnv();
    const res = await ingest(env, { dry_run: true, events: [ev(1), ev(2)] });
    expect(res.body).toMatchObject({ dry_run: true, added: 2 });
    expect(rows(env)).toHaveLength(0);
    expect(lastLog(env)).toMatchObject({ status: "dry_run", dry_run: 1 });
  });

  it("accepts the good events and explains the bad ones", async () => {
    const env = makeEnv();
    const res = await ingest(env, {
      events: [ev(1), ev(2, { signup_url: "http://luma.com/e2" }), ev(3, { location_text: "Atlantis" })],
    });
    expect(res.body.rejected).toEqual([
      { index: 1, signup_url: "http://luma.com/e2", reason: "signup_url must be an https URL" },
    ]);
    expect(res.body.warnings).toEqual([
      { index: 2, message: 'location "Atlantis" not recognised; placed on the Klang Valley line (send "region" to override)' },
    ]);
    expect(rows(env)).toHaveLength(2);
  });

  it("keeps the last copy of a duplicated event", async () => {
    const env = makeEnv();
    const res = await ingest(env, { events: [ev(1), ev(1, { name: "Event 1 (renamed)" })] });
    expect(res.body.warnings).toEqual([{ index: 1, message: "duplicate of event at index 0; this one was kept" }]);
    expect(rows(env).map((r) => r.name)).toEqual(["Event 1 (renamed)"]);
  });

  it("prunes events that ended more than 30 days ago", async () => {
    const env = makeEnv();
    env.DB.raw
      .prepare(
        `INSERT INTO events (id, name, start_at, all_day, date_local, region, topic, location_text, signup_url, raw, first_seen, last_seen)
         VALUES ('old0000000000000', 'Old', ?, 1, '2026-10-01', 'kv', 'community', 'KL', 'https://luma.com/old', '{}', 0, 0)`,
      )
      .run(NOW_S - 31 * 86400);
    await ingest(env, { events: [ev(1)] });
    expect(rows(env).map((r) => r.name)).toEqual(["Event 1"]);
  });
});
```

- [ ] **Step 3: Run to see failure**

Run: `npm run test:worker -- worker/test/ingest.test.ts`
Expected: FAIL — cannot resolve `../../events/ingest`.

- [ ] **Step 4: Implement**

Create `worker/events/ingest.ts`:

```ts
import type { EventsEnv } from "./env";
import { normalizeEvent } from "./normalize";
import { DAY_S, localDate, startOfLocalDay } from "./time";
import type { NormalizedEvent } from "./types";

const MAX_BYTES = 1_000_000;
const MAX_EVENTS = 1000;
const PRUNE_AFTER_S = 30 * DAY_S;
const BATCH = 50;

export interface IngestReport {
  dry_run: boolean;
  received: number;
  added: number;
  updated: number;
  removed: number;
  rejected: { index: number; signup_url: string | null; reason: string }[];
  warnings: { index: number; message: string }[];
}

type LogStatus = "ok" | "dry_run" | "shrink_guard" | "invalid";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

/** Compares digests so the time taken doesn't reveal how much of the token matched. */
async function authorized(request: Request, token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  const [a, b] = await Promise.all([sha256(given), sha256(token)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0 && given.length > 0;
}

async function logIngest(
  env: EventsEnv,
  entry: { at: number; source: string | null; status: LogStatus; dryRun: boolean; counts?: Omit<IngestReport, "dry_run" | "rejected" | "warnings"> & { rejected: number }; detail: unknown },
) {
  const c = entry.counts ?? { received: 0, added: 0, updated: 0, removed: 0, rejected: 0 };
  await env.DB.prepare(
    `INSERT INTO event_ingests (at, source, status, dry_run, received, added, updated, removed, rejected, detail)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(entry.at, entry.source, entry.status, entry.dryRun ? 1 : 0, c.received, c.added, c.updated, c.removed, c.rejected, JSON.stringify(entry.detail))
    .run();
}

async function invalid(env: EventsEnv, nowMs: number, status: number, error: string, source: string | null = null) {
  await logIngest(env, { at: nowMs, source, status: "invalid", dryRun: false, detail: { error } });
  return json({ error }, status);
}

function upsert(db: D1Database, e: NormalizedEvent, nowMs: number) {
  return db
    .prepare(
      `INSERT INTO events (id, name, start_at, end_at, all_day, date_local, region, place_tag, topic, kind,
         location_text, signup_url, organizer, price, image_url, raw, first_seen, last_seen, removed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, start_at = excluded.start_at, end_at = excluded.end_at,
         all_day = excluded.all_day, date_local = excluded.date_local, region = excluded.region,
         place_tag = excluded.place_tag, topic = excluded.topic, kind = excluded.kind,
         location_text = excluded.location_text, signup_url = excluded.signup_url,
         organizer = excluded.organizer, price = excluded.price, image_url = excluded.image_url,
         raw = excluded.raw, last_seen = excluded.last_seen, removed = 0`,
    )
    .bind(
      e.id, e.name, e.startAt, e.endAt, e.allDay ? 1 : 0, e.dateLocal, e.region, e.placeTag, e.topic, e.kind,
      e.locationText, e.signupUrl, e.organizer, e.price, e.imageUrl, e.raw, nowMs, nowMs,
    );
}

function signupOf(raw: unknown): string | null {
  const v = raw && typeof raw === "object" ? (raw as Record<string, unknown>).signup_url : null;
  return typeof v === "string" ? v : null;
}

export async function handleIngest(request: Request, env: EventsEnv, nowMs = Date.now()): Promise<Response> {
  if (!(await authorized(request, env.EVENTS_INGEST_TOKEN))) return json({ error: "unauthorized" }, 401);

  if (Number(request.headers.get("content-length") ?? "0") > MAX_BYTES) {
    return invalid(env, nowMs, 413, "body is larger than 1 MB");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BYTES) return invalid(env, nowMs, 413, "body is larger than 1 MB");

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return invalid(env, nowMs, 400, "body is not valid JSON");
  }
  if (!body || typeof body !== "object" || !Array.isArray((body as { events?: unknown }).events)) {
    return invalid(env, nowMs, 400, "body.events must be an array");
  }
  const b = body as { events: unknown[]; source?: unknown; dry_run?: unknown; allow_shrink?: unknown };
  const source = typeof b.source === "string" ? b.source.slice(0, 60) : null;
  if (b.events.length > MAX_EVENTS) return invalid(env, nowMs, 413, "more than 1000 events", source);

  const dryRun = b.dry_run === true;
  const nowS = Math.floor(nowMs / 1000);
  const todayStart = startOfLocalDay(localDate(nowS));

  const rejected: IngestReport["rejected"] = [];
  const warnings: IngestReport["warnings"] = [];
  const accepted = new Map<string, { index: number; event: NormalizedEvent }>();
  for (const [index, raw] of b.events.entries()) {
    const res = await normalizeEvent(raw, nowS);
    if (!res.ok) {
      rejected.push({ index, signup_url: signupOf(raw), reason: res.reason });
      continue;
    }
    for (const message of res.warnings) warnings.push({ index, message });
    const previous = accepted.get(res.event.id);
    if (previous) warnings.push({ index, message: `duplicate of event at index ${previous.index}; this one was kept` });
    accepted.set(res.event.id, { index, event: res.event });
  }
  const events = [...accepted.values()].map((a) => a.event);

  const visible = await env.DB.prepare("SELECT id FROM events WHERE removed = 0 AND start_at >= ?")
    .bind(todayStart)
    .all<{ id: string }>();
  const visibleIds = new Set(visible.results.map((r) => r.id));
  const acceptedUpcoming = events.filter((e) => e.startAt >= todayStart).length;

  const shrinking = events.length === 0 || (visibleIds.size >= 4 && acceptedUpcoming < visibleIds.size * 0.5);
  if (shrinking && b.allow_shrink !== true) {
    await logIngest(env, {
      at: nowMs, source, status: "shrink_guard", dryRun,
      counts: { received: b.events.length, added: 0, updated: 0, removed: 0, rejected: rejected.length },
      detail: { rejected, warnings, current: visibleIds.size, accepted: acceptedUpcoming },
    });
    return json({ error: "shrink_guard", current: visibleIds.size, accepted: acceptedUpcoming }, 409);
  }

  const existing = await env.DB.prepare("SELECT id FROM events").all<{ id: string }>();
  const existingIds = new Set(existing.results.map((r) => r.id));
  const added = events.filter((e) => !existingIds.has(e.id)).length;
  const removed = [...visibleIds].filter((id) => !accepted.has(id)).length;
  const report: IngestReport = {
    dry_run: dryRun, received: b.events.length, added, updated: events.length - added, removed, rejected, warnings,
  };

  if (!dryRun) {
    const statements = events.map((e) => upsert(env.DB, e, nowMs));
    for (let i = 0; i < statements.length; i += BATCH) await env.DB.batch(statements.slice(i, i + BATCH));
    await env.DB.batch([
      env.DB.prepare("UPDATE events SET removed = 1 WHERE removed = 0 AND start_at >= ? AND last_seen < ?").bind(todayStart, nowMs),
      env.DB.prepare("DELETE FROM events WHERE start_at < ?").bind(nowS - PRUNE_AFTER_S),
    ]);
  }

  await logIngest(env, {
    at: nowMs, source, status: dryRun ? "dry_run" : "ok", dryRun,
    counts: { received: report.received, added, updated: report.updated, removed, rejected: rejected.length },
    detail: { rejected, warnings },
  });
  return json(report);
}
```

- [ ] **Step 5: Run to see pass**

Run: `npm run test:worker`
Expected: PASS (all worker tests so far).

- [ ] **Step 6: Commit**

```bash
git add worker/events/ingest.ts worker/test/helpers/events.ts worker/test/ingest.test.ts
git commit -m "Add authenticated event ingest with snapshot and shrink-guard semantics"
```

---

### Task 7: Read API and calendar files

**Files:**
- Create: `worker/events/ics.ts`
- Create: `worker/events/api.ts`
- Test: `worker/test/ics.test.ts`
- Test: `worker/test/api.test.ts`

**Interfaces:**
- Consumes: `PublicEvent`, `EventsResponse` (Task 4), `EventsEnv` (Task 4), helpers from Task 6.
- Produces: `icsEscape(s)`, `foldLine(line)`, `buildCalendar(events: PublicEvent[], nowMs: number, name?: string): string`; `handleEventsApi(env, nowMs?)`, `handleFeedIcs(env, nowMs?)`, `handleEventIcs(id, env, nowMs?)`, `handlePlanIcs(url: URL, env, nowMs?)` — all `Promise<Response>`.

- [ ] **Step 1: Write the failing ICS tests**

Create `worker/test/ics.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildCalendar, foldLine, icsEscape } from "../events/ics";
import type { PublicEvent } from "../events/types";

const base: PublicEvent = {
  id: "0123456789abcdef", name: "Code Meets Animation", start: "2026-11-10T16:00:00.000Z", end: null,
  all_day: true, date: "2026-11-11", region: "kv", place_tag: null, topic: "design", kind: "event",
  location: "Petaling Jaya", url: "https://luma.com/cwe18vhn", organizer: "SwiftLah!", price: null, image: null,
};
const NOW = Date.parse("2026-11-07T10:52:00Z");

describe("ics", () => {
  it("escapes text values", () => {
    expect(icsEscape("a;b,c\\d\ne")).toBe("a\\;b\\,c\\\\d\\ne");
  });

  it("folds long lines at 75 octets", () => {
    const folded = foldLine(`SUMMARY:${"é".repeat(60)}`);
    for (const line of folded.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(folded.split("\r\n").slice(1).every((l) => l.startsWith(" "))).toBe(true);
    expect(folded.replace(/\r\n /g, "")).toBe(`SUMMARY:${"é".repeat(60)}`);
  });

  it("writes all-day events as dates", () => {
    const cal = buildCalendar([base], NOW);
    expect(cal).toContain("DTSTART;VALUE=DATE:20261111\r\n");
    expect(cal).toContain("DTEND;VALUE=DATE:20261112\r\n");
    expect(cal).toContain("UID:0123456789abcdef@events.hong.build\r\n");
    expect(cal).toContain("DTSTAMP:20261107T105200Z\r\n");
    expect(cal.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(cal.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("gives timed events without an end three hours", () => {
    const cal = buildCalendar([{ ...base, all_day: false, start: "2026-11-11T11:00:00.000Z" }], NOW);
    expect(cal).toContain("DTSTART:20261111T110000Z\r\n");
    expect(cal).toContain("DTEND:20261111T140000Z\r\n");
  });
});
```

- [ ] **Step 2: Write the failing API tests**

Create `worker/test/api.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { handleEventIcs, handleEventsApi, handleFeedIcs, handlePlanIcs } from "../events/api";
import type { EventsResponse } from "../events/types";
import { ev, ingest, makeEnv, NOW } from "./helpers/events";

async function seeded() {
  const env = makeEnv();
  await ingest(env, {
    events: [
      ev(1),
      ev(2, { date_text: "1 June 2027" }),
      ev(3, { start: "2026-11-08T19:00:00+08:00", location_text: "Singapore" }),
    ],
  });
  return env;
}

describe("GET /api/events", () => {
  it("returns visible events from today to 180 days ahead, in start order", async () => {
    const env = await seeded();
    const res = await handleEventsApi(env, NOW);
    expect(res.headers.get("cache-control")).toBe("public, max-age=60");
    const body = (await res.json()) as EventsResponse;
    expect(body.tz).toBe("Asia/Kuala_Lumpur");
    expect(body.last_ingest_at).toBe(new Date(NOW).toISOString());
    expect(body.events.map((e) => e.name)).toEqual(["Event 3", "Event 1"]);
    expect(body.events[0]).toEqual({
      id: expect.stringMatching(/^[0-9a-f]{16}$/), name: "Event 3", start: "2026-11-08T11:00:00.000Z", end: null,
      all_day: false, date: "2026-11-08", region: "sg", place_tag: "SG", topic: "community", kind: "event",
      location: "Singapore", url: "https://luma.com/e3", organizer: null, price: null, image: null,
    });
  });

  it("leaves out hidden events", async () => {
    const env = await seeded();
    await ingest(env, { events: [ev(1), ev(2, { date_text: "1 June 2027" })] });
    const body = (await (await handleEventsApi(env, NOW)).json()) as EventsResponse;
    expect(body.events.map((e) => e.name)).toEqual(["Event 1"]);
  });
});

describe("calendar endpoints", () => {
  it("serves the subscription feed", async () => {
    const env = await seeded();
    const res = await handleFeedIcs(env, NOW);
    expect(res.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
    const text = await res.text();
    expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });

  it("serves one event as a download, or 404", async () => {
    const env = await seeded();
    const body = (await (await handleEventsApi(env, NOW)).json()) as EventsResponse;
    const id = body.events[0]!.id;
    const res = await handleEventIcs(id, env, NOW);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toBe(`attachment; filename="${id}.ics"`);
    expect(await res.text()).toContain(`UID:${id}@events.hong.build`);
    expect((await handleEventIcs("ffffffffffffffff", env, NOW)).status).toBe(404);
  });

  it("bundles kept tickets into one file", async () => {
    const env = await seeded();
    const body = (await (await handleEventsApi(env, NOW)).json()) as EventsResponse;
    const ids = body.events.map((e) => e.id).join(",");
    const res = await handlePlanIcs(new URL(`https://events.hong.build/api/events/plan.ics?ids=${ids},nonsense`), env, NOW);
    expect(res.status).toBe(200);
    expect((await res.text()).match(/BEGIN:VEVENT/g)).toHaveLength(2);
    const bad = await handlePlanIcs(new URL("https://events.hong.build/api/events/plan.ics?ids=nope"), env, NOW);
    expect(bad.status).toBe(400);
  });
});
```

- [ ] **Step 3: Run to see failure**

Run: `npm run test:worker -- worker/test/ics.test.ts worker/test/api.test.ts`
Expected: FAIL — cannot resolve `../events/ics` / `../events/api`.

- [ ] **Step 4: Implement the ICS builder**

Create `worker/events/ics.ts`:

```ts
import type { PublicEvent } from "./types";

const CRLF = "\r\n";
const HOURS_3 = 3 * 60 * 60 * 1000;

export function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** RFC 5545 §3.1: lines longer than 75 octets continue on the next line after a space. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const n = encoder.encode(ch).length;
    if (bytes + n > limit) {
      out.push(current);
      current = ch;
      bytes = n;
      limit = 74; // the leading space counts
    } else {
      current += ch;
      bytes += n;
    }
  }
  out.push(current);
  return out.join(`${CRLF} `);
}

const utc = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const compactDate = (date: string) => date.replace(/-/g, "");
function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function buildCalendar(events: PublicEvent[], nowMs: number, name = "Builder Line — KL builder events"): string {
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//hong.build//Builder Line//EN", "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH", `X-WR-CALNAME:${icsEscape(name)}`, "X-WR-TIMEZONE:Asia/Kuala_Lumpur",
  ];
  for (const e of events) {
    lines.push("BEGIN:VEVENT", `UID:${e.id}@events.hong.build`, `DTSTAMP:${utc(nowMs)}`);
    if (e.all_day) {
      lines.push(`DTSTART;VALUE=DATE:${compactDate(e.date)}`, `DTEND;VALUE=DATE:${compactDate(nextDay(e.date))}`);
    } else {
      const start = Date.parse(e.start);
      const end = e.end ? Date.parse(e.end) : start + HOURS_3;
      lines.push(`DTSTART:${utc(start)}`, `DTEND:${utc(end)}`);
    }
    const description = [e.organizer ? `Hosted by ${e.organizer}` : null, `Sign up: ${e.url}`, "Listed on events.hong.build"]
      .filter(Boolean)
      .join("\n");
    lines.push(
      `SUMMARY:${icsEscape(e.name)}`, `LOCATION:${icsEscape(e.location)}`, `URL:${e.url}`,
      `DESCRIPTION:${icsEscape(description)}`, "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join(CRLF) + CRLF;
}
```

- [ ] **Step 5: Implement the read endpoints**

Create `worker/events/api.ts`:

```ts
import type { EventsEnv } from "./env";
import { buildCalendar } from "./ics";
import { DAY_S, localDate, startOfLocalDay } from "./time";
import type { EventsResponse, Kind, PublicEvent, Region, Topic } from "./types";

interface EventRow {
  id: string; name: string; start_at: number; end_at: number | null; all_day: number; date_local: string;
  region: Region; place_tag: string | null; topic: Topic; kind: Kind; location_text: string;
  signup_url: string; organizer: string | null; price: string | null; image_url: string | null;
}

const COLUMNS =
  "id, name, start_at, end_at, all_day, date_local, region, place_tag, topic, kind, location_text, signup_url, organizer, price, image_url";

function rowToPublic(r: EventRow): PublicEvent {
  return {
    id: r.id, name: r.name, start: new Date(r.start_at * 1000).toISOString(),
    end: r.end_at === null ? null : new Date(r.end_at * 1000).toISOString(), all_day: r.all_day === 1,
    date: r.date_local, region: r.region, place_tag: r.place_tag, topic: r.topic, kind: r.kind,
    location: r.location_text, url: r.signup_url, organizer: r.organizer, price: r.price, image: r.image_url,
  };
}

/** Visible events starting in [fromS, toS), plus ones that started earlier and are still running. */
async function listEvents(db: D1Database, fromS: number, toS: number): Promise<PublicEvent[]> {
  const { results } = await db
    .prepare(
      `SELECT ${COLUMNS} FROM events
       WHERE removed = 0 AND start_at < ? AND (start_at >= ? OR (end_at IS NOT NULL AND end_at > ?))
       ORDER BY start_at, name`,
    )
    .bind(toS, fromS, fromS)
    .all<EventRow>();
  return results.map(rowToPublic);
}

const todayStartS = (nowMs: number) => startOfLocalDay(localDate(Math.floor(nowMs / 1000)));

function calendarResponse(body: string, filename: string, attachment: boolean) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `${attachment ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}

export async function handleEventsApi(env: EventsEnv, nowMs = Date.now()): Promise<Response> {
  const today = todayStartS(nowMs);
  const events = await listEvents(env.DB, today, today + 181 * DAY_S);
  const last = await env.DB.prepare("SELECT MAX(at) AS at FROM event_ingests WHERE status = 'ok'").first<{ at: number | null }>();
  const body: EventsResponse = {
    generated_at: new Date(nowMs).toISOString(),
    last_ingest_at: last?.at ? new Date(last.at).toISOString() : null,
    tz: "Asia/Kuala_Lumpur",
    events,
  };
  return Response.json(body, {
    headers: { "Cache-Control": "public, max-age=60", "Access-Control-Allow-Origin": "*" },
  });
}

export async function handleFeedIcs(env: EventsEnv, nowMs = Date.now()): Promise<Response> {
  const today = todayStartS(nowMs);
  const events = await listEvents(env.DB, today - 30 * DAY_S, today + 181 * DAY_S);
  return calendarResponse(buildCalendar(events, nowMs), "builder-line.ics", false);
}

export async function handleEventIcs(id: string, env: EventsEnv, nowMs = Date.now()): Promise<Response> {
  const row = await env.DB.prepare(`SELECT ${COLUMNS} FROM events WHERE id = ? AND removed = 0`).bind(id).first<EventRow>();
  if (!row) return new Response("That event has left the line.", { status: 404 });
  return calendarResponse(buildCalendar([rowToPublic(row)], nowMs, row.name), `${id}.ics`, true);
}

export async function handlePlanIcs(url: URL, env: EventsEnv, nowMs = Date.now()): Promise<Response> {
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .filter((id) => /^[0-9a-f]{16}$/.test(id))
    .slice(0, 50);
  if (ids.length === 0) return new Response("No valid event ids.", { status: 400 });
  const { results } = await env.DB.prepare(
    `SELECT ${COLUMNS} FROM events WHERE removed = 0 AND id IN (${ids.map(() => "?").join(", ")}) ORDER BY start_at`,
  )
    .bind(...ids)
    .all<EventRow>();
  return calendarResponse(buildCalendar(results.map(rowToPublic), nowMs, "My Journey — Builder Line"), "my-journey.ics", true);
}
```

- [ ] **Step 6: Run to see pass**

Run: `npm run test:worker`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add worker/events/ics.ts worker/events/api.ts worker/test/ics.test.ts worker/test/api.test.ts
git commit -m "Serve upcoming events as JSON and iCalendar feeds"
```

---

### Task 8: Route events traffic in the Worker

**Files:**
- Modify: `worker/index.ts` (imports, `Env`, top of `fetch`, new `routeEvents`/`serveEventsApp` functions)
- Modify: `wrangler.jsonc`
- Test: `worker/test/routing.test.ts`

**Interfaces:**
- Consumes: `handleIngest` (Task 6); `handleEventsApi`, `handleFeedIcs`, `handleEventIcs`, `handlePlanIcs` (Task 7).
- Produces: on any host — `POST /api/events/ingest`, `GET /api/events`, `GET /api/events/plan.ics`, `GET /events.ics`, `GET /e/<16hex>.ics`; on `events.hong.build` — every other path serves `/events/index.html` (assets under `/events/…` pass through); on `hong.build` — `/events` and `/events/` redirect 308 to `https://events.hong.build/`.

- [ ] **Step 1: Write the failing routing tests**

Create `worker/test/routing.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import worker from "../index";
import { makeEnv } from "./helpers/events";

function env() {
  const assets = {
    fetch: vi.fn(async (req: Request) =>
      new Response(`asset:${new URL(req.url).pathname}`, { headers: { "content-type": "text/html" } }),
    ),
  };
  return { ...makeEnv(), ASSETS: assets };
}
const call = (url: string, init?: RequestInit, e = env()) =>
  (worker.fetch as (r: Request, e: unknown) => Promise<Response>)(new Request(url, init), e);

describe("events routing", () => {
  it("serves the app shell for any page on events.hong.build", async () => {
    for (const path of ["/", "/some/deep/link"]) {
      const res = await call(`https://events.hong.build${path}`);
      expect(await res.text()).toBe("asset:/events/");
      expect(res.headers.get("cache-control")).toBe("public, max-age=0, must-revalidate");
    }
  });

  it("passes the app's own files through", async () => {
    const res = await call("https://events.hong.build/events/favicon.svg");
    expect(await res.text()).toBe("asset:/events/favicon.svg");
  });

  it("redirects hong.build/events to the subdomain", async () => {
    for (const path of ["/events", "/events/"]) {
      const res = await call(`https://hong.build${path}`);
      expect(res.status).toBe(308);
      expect(res.headers.get("location")).toBe("https://events.hong.build/");
    }
  });

  it("answers the API on either host", async () => {
    const res = await call("https://hong.build/api/events");
    expect(res.status).toBe(200);
    expect(Array.isArray(((await res.json()) as { events: unknown }).events)).toBe(true);
  });

  it("only allows POST to ingest and GET elsewhere on the subdomain", async () => {
    const getIngest = await call("https://events.hong.build/api/events/ingest");
    expect(getIngest.status).toBe(405);
    expect(getIngest.headers.get("allow")).toBe("POST");
    const postApi = await call("https://events.hong.build/api/events", { method: "POST" });
    expect(postApi.status).toBe(405);
  });

  it("leaves the main site alone", async () => {
    const res = await call("https://hong.build/hackathons");
    expect(await res.text()).toBe("asset:/hackathons");
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `npm run test:worker -- worker/test/routing.test.ts`
Expected: FAIL — e.g. `events.hong.build/` returns `asset:/` and `/events` is not redirected.

- [ ] **Step 3: Wire up the routes**

In `worker/index.ts`, add after the existing `import { qaData } …` line:

```ts
import { handleEventIcs, handleEventsApi, handleFeedIcs, handlePlanIcs } from "./events/api";
import { handleIngest } from "./events/ingest";

const EVENTS_HOST = "events.hong.build";
```

Replace the `Env` interface with:

```ts
interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  EVENTS_INGEST_TOKEN?: string;
}
```

In `fetch`, replace these two lines:

```ts
    const url = new URL(request.url);
    const { pathname } = url;
```

with:

```ts
    const url = new URL(request.url);
    const events = await routeEvents(request, env, url);
    if (events) return events;
    const { pathname } = url;
```

Add these functions directly above `/** Pages with a markdown twin …` (the `markdownAsset` comment):

```ts
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
```

- [ ] **Step 4: Update `wrangler.jsonc`**

Change `run_worker_first` to:

```jsonc
    "run_worker_first": ["/*", "!/_next/*", "!/audio/*", "!/hack/assets/*", "!/events/assets/*", "!/fragments.bin"]
```

Change `routes` to:

```jsonc
  "routes": [
    { "pattern": "hong.build", "custom_domain": true },
    { "pattern": "www.hong.build", "custom_domain": true },
    { "pattern": "events.hong.build", "custom_domain": true }
  ]
```

- [ ] **Step 5: Run tests to see pass**

Run: `npm run test:worker`
Expected: PASS (all files).

- [ ] **Step 6: Typecheck the Worker**

Run: `npm run typecheck:worker`
Expected: no errors in `worker/events/**` or the lines you added. If errors appear only in pre-existing code (`worker/index.ts` Q&A code or `hack-src/src/data/qa.ts`), do not fix them here — list them in your report.

- [ ] **Step 7: Commit**

```bash
git add worker/index.ts wrangler.jsonc worker/test/routing.test.ts
git commit -m "Route event endpoints and serve the events app on events.hong.build"
```

---

### Task 9: Scaffold `events-src` and its pure client logic

**Files:**
- Create: `events-src/package.json`, `events-src/tsconfig.json`, `events-src/vite.config.ts`, `events-src/README.md`
- Create: `events-src/src/types.ts`
- Create: `events-src/src/lib/time.ts`, `status.ts`, `timetable.ts`, `lines.ts`, `prefs.ts`, `api.ts`
- Test: `events-src/tests/unit/time.test.ts`, `status.test.ts`, `timetable.test.ts`, `api.test.ts`

**Interfaces:**
- Consumes: `PublicEvent`, `EventsResponse`, `Topic` from `worker/events/types.ts` (Task 4), via `import type` only.
- Produces:
  - time.ts: `mytDateKey(ms): string`, `dayLabel(key): string` ("SAT 7 NOV"), `dayShort(key): string` ("Sat 7 Nov"), `dayDiff(fromKey, toKey): number`, `timeLabel(iso): string` ("19:30"), `endOfDayMs(key): number`, `relativeHint(key, todayKey): string`.
  - status.ts: `StatusKind = "live" | "board" | "dep" | "today" | "soon" | "closed"`, `Status { label; kind; chip: boolean }`, `eventStatus(e, nowMs): Status`.
  - timetable.ts: `Day { key; isToday; main: PublicEvent[]; branch: PublicEvent[] }`, `buildTimetable(events, nowMs): Day[]`, `dayEvents(day): PublicEvent[]`, `spurLabel(branch): string`.
  - lines.ts: `LINES: Record<Topic, { name: string; color: string; code: string }>`.
  - prefs.ts: `readPref<T>(key, fallback: T): T`, `writePref(key, value): void` (keys prefixed `builderline.`).
  - api.ts: `Load = { state: "fresh" | "cached"; data: EventsResponse } | { state: "error" }`, `loadTimetable(fetchImpl?): Promise<Load>`, `staleDays(data, nowMs): number | null`.

- [ ] **Step 1: Create the package**

Create `events-src/package.json`:

```json
{
  "name": "builder-line",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -p tsconfig.json && vite build",
    "typecheck": "tsc -p tsconfig.json",
    "test": "vitest run",
    "e2e": "playwright test"
  },
  "dependencies": {
    "react": "^19.2.6",
    "react-dom": "^19.2.6"
  },
  "devDependencies": {
    "@playwright/test": "^1.60.0",
    "@tailwindcss/vite": "^4.3.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "tailwindcss": "^4.3.0",
    "typescript": "~6.0.2",
    "vite": "^8.0.12",
    "vitest": "^4.0.0"
  }
}
```

Create `events-src/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "types": ["vite/client"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  },
  "include": ["src", "tests", "vite.config.ts", "playwright.config.ts", "../worker/events/types.ts"]
}
```

Create `events-src/vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const worker = "http://localhost:8787"; // `npx wrangler dev --port 8787` from the repo root

export default defineConfig({
  base: "/events/",
  plugins: [react(), tailwindcss()],
  build: { outDir: "../public/events", emptyOutDir: true },
  server: {
    port: 4179,
    strictPort: true,
    proxy: { "/api": worker, "/e/": worker, "/events.ics": worker },
  },
  test: { include: ["tests/unit/**/*.test.ts"], environment: "node" },
});
```

Create `events-src/README.md`:

````markdown
# Builder Line — events.hong.build

A Vite + React app that builds into `../public/events/`. The Worker (`../worker/index.ts`) serves it on `events.hong.build` and provides `/api/events`.

```bash
npm ci
npm test            # unit tests (src/lib)
npm run e2e         # Playwright, phone + desktop, against a fixture API
npm run build       # writes ../public/events/
```

Local end-to-end with real data: in the repo root run `npx wrangler d1 migrations apply hong-build-hack --local` and `npx wrangler dev --port 8787`, then `npm run dev` here (it proxies `/api`, `/e/` and `/events.ics` to the Worker) and open http://localhost:4179/events/.

Approved look and motion: `../docs/events/prototype.html`. Design: `../docs/superpowers/specs/2026-11-07-kl-builder-events-calendar-design.md`.
````

Create `events-src/src/types.ts`:

```ts
export type { EventsResponse, Kind, PublicEvent, Region, Topic } from "../../worker/events/types";
```

Run: `cd events-src && npm install && npx playwright install chromium`
Expected: `package-lock.json` created; Chromium downloaded.

- [ ] **Step 2: Write the failing unit tests**

Create `events-src/tests/unit/time.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { dayDiff, dayLabel, dayShort, endOfDayMs, mytDateKey, relativeHint, timeLabel } from "../../src/lib/time";

describe("time", () => {
  it("keys days in Malaysia time", () => {
    expect(mytDateKey(Date.parse("2026-11-07T15:59:00Z"))).toBe("2026-11-07");
    expect(mytDateKey(Date.parse("2026-11-07T16:00:00Z"))).toBe("2026-11-08");
  });
  it("labels days", () => {
    expect(dayLabel("2026-11-07")).toBe("SAT 7 NOV");
    expect(dayShort("2026-11-11")).toBe("Wed 11 Nov");
  });
  it("counts and describes days between keys", () => {
    expect(dayDiff("2026-11-07", "2026-11-11")).toBe(4);
    expect(relativeHint("2026-11-08", "2026-11-07")).toBe("tomorrow");
    expect(relativeHint("2026-11-11", "2026-11-07")).toBe("in 4 days");
  });
  it("shows local clock times and day ends", () => {
    expect(timeLabel("2026-11-07T11:30:00.000Z")).toBe("19:30");
    expect(endOfDayMs("2026-11-07")).toBe(Date.parse("2026-11-07T16:00:00Z"));
  });
});
```

Create `events-src/tests/unit/status.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { eventStatus } from "../../src/lib/status";
import type { PublicEvent } from "../../src/types";

const NOW = Date.parse("2026-11-07T10:52:00Z"); // 18:52 MYT
const e = (over: Partial<PublicEvent>): PublicEvent => ({
  id: "0000000000000001", name: "E", start: "2026-11-07T11:30:00.000Z", end: null, all_day: false,
  date: "2026-11-07", region: "kv", place_tag: null, topic: "ai", kind: "event", location: "KL",
  url: "https://x.y/z", organizer: null, price: null, image: null, ...over,
});

describe("eventStatus", () => {
  it("is BOARDING within the hour before start", () => {
    expect(eventStatus(e({}), NOW)).toEqual({ label: "BOARDING · 38 MIN", kind: "board", chip: true });
    expect(eventStatus(e({ start: "2026-11-07T11:52:00.000Z" }), NOW).label).toBe("BOARDING · 60 MIN");
    expect(eventStatus(e({ start: "2026-11-07T11:53:00.000Z" }), NOW)).toEqual({ label: "TODAY", kind: "today", chip: false });
  });
  it("is LIVE from start until end, defaulting to three hours", () => {
    expect(eventStatus(e({ start: "2026-11-07T10:52:00.000Z" }), NOW).kind).toBe("live");
    expect(eventStatus(e({ start: "2026-11-07T07:53:00.000Z" }), NOW).kind).toBe("live");
    expect(eventStatus(e({ start: "2026-11-07T07:52:00.000Z" }), NOW)).toEqual({ label: "DEPARTED", kind: "dep", chip: true });
    expect(eventStatus(e({ start: "2026-11-07T02:00:00.000Z", end: "2026-11-07T14:00:00.000Z" }), NOW).kind).toBe("live");
  });
  it("counts days ahead", () => {
    expect(eventStatus(e({ date: "2026-11-08", start: "2026-11-08T02:00:00.000Z" }), NOW)).toEqual({ label: "TOMORROW", kind: "soon", chip: false });
    expect(eventStatus(e({ date: "2026-11-11", start: "2026-11-10T16:00:00.000Z", all_day: true }), NOW).label).toBe("IN 4D");
  });
  it("treats all-day events as TODAY until midnight", () => {
    expect(eventStatus(e({ all_day: true, start: "2026-11-06T16:00:00.000Z" }), NOW)).toEqual({ label: "TODAY", kind: "today", chip: false });
  });
  it("counts down deadlines", () => {
    const d = e({ kind: "deadline", date: "2026-11-20", start: "2026-11-20T15:59:00.000Z" });
    expect(eventStatus(d, NOW)).toEqual({ label: "CLOSES IN 13D", kind: "board", chip: true });
    expect(eventStatus(e({ kind: "deadline", start: "2026-11-07T15:59:00.000Z" }), NOW).label).toBe("CLOSES TODAY");
    expect(eventStatus(e({ kind: "deadline", start: "2026-11-07T09:00:00.000Z" }), NOW).label).toBe("CLOSED");
  });
});
```

Create `events-src/tests/unit/timetable.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildTimetable, dayEvents, spurLabel } from "../../src/lib/timetable";
import type { PublicEvent } from "../../src/types";

const NOW = Date.parse("2026-11-07T10:52:00Z");
let n = 0;
const e = (over: Partial<PublicEvent>): PublicEvent => ({
  id: String(++n).padStart(16, "0"), name: `E${n}`, start: "2026-11-09T11:00:00.000Z", end: null, all_day: false,
  date: "2026-11-09", region: "kv", place_tag: null, topic: "ai", kind: "event", location: "KL",
  url: "https://x.y/z", organizer: null, price: null, image: null, ...over,
});

describe("buildTimetable", () => {
  it("always starts with today, splits main line from branches, and sorts", () => {
    const late = e({ name: "Late", start: "2026-11-09T12:00:00.000Z" });
    const early = e({ name: "Early", start: "2026-11-09T01:00:00.000Z" });
    const sg = e({ name: "SG", region: "sg", place_tag: "SG" });
    const days = buildTimetable([late, sg, early], NOW);
    expect(days.map((d) => [d.key, d.isToday])).toEqual([["2026-11-07", true], ["2026-11-09", false]]);
    expect(days[1]!.main.map((x) => x.name)).toEqual(["Early", "Late"]);
    expect(days[1]!.branch.map((x) => x.name)).toEqual(["SG"]);
    expect(dayEvents(days[1]!).map((x) => x.name)).toEqual(["Early", "SG", "Late"]);
  });

  it("puts still-running events from earlier days on today", () => {
    const running = e({ date: "2026-11-06", start: "2026-11-06T01:00:00.000Z", end: "2026-11-08T10:00:00.000Z" });
    expect(buildTimetable([running], NOW)[0]!.main).toEqual([running]);
  });

  it("names branches by what they carry", () => {
    expect(spurLabel([e({ region: "sg" })])).toBe("OVERSEAS LINK");
    expect(spurLabel([e({ region: "online" })])).toBe("ONLINE LINK");
    expect(spurLabel([e({ region: "online" }), e({ region: "other" })])).toBe("OVERSEAS & ONLINE LINK");
  });
});
```

Create `events-src/tests/unit/api.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadTimetable, staleDays } from "../../src/lib/api";
import { readPref, writePref } from "../../src/lib/prefs";
import type { EventsResponse } from "../../src/types";

const data: EventsResponse = { generated_at: "2026-11-07T10:52:00.000Z", last_ingest_at: "2026-11-07T00:05:00.000Z", tz: "Asia/Kuala_Lumpur", events: [] };
const ok = (async () => Response.json(data)) as typeof fetch;
const down = (async () => { throw new Error("offline"); }) as typeof fetch;

function memoryStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("prefs", () => {
  it("falls back when storage is unavailable", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(readPref("night", true)).toBe(true);
    expect(() => writePref("night", false)).not.toThrow();
  });
  it("round-trips through storage", () => {
    vi.stubGlobal("localStorage", memoryStorage());
    writePref("kept", ["a"]);
    expect(readPref<string[]>("kept", [])).toEqual(["a"]);
  });
});

describe("loadTimetable", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
  });

  it("returns fresh data and keeps a copy", async () => {
    expect(await loadTimetable(ok)).toEqual({ state: "fresh", data });
    expect(await loadTimetable(down)).toEqual({ state: "cached", data });
  });
  it("reports an error with no saved copy", async () => {
    expect(await loadTimetable(down)).toEqual({ state: "error" });
  });
});

describe("staleDays", () => {
  it("only reports pushes older than 48 hours", () => {
    expect(staleDays(data, Date.parse("2026-11-08T23:00:00Z"))).toBeNull();
    expect(staleDays({ ...data, last_ingest_at: "2026-11-04T00:00:00.000Z" }, Date.parse("2026-11-07T10:52:00Z"))).toBe(3);
    expect(staleDays({ ...data, last_ingest_at: null }, Date.now())).toBeNull();
  });
});
```

- [ ] **Step 3: Run to see failure**

Run: `cd events-src && npm test`
Expected: FAIL — cannot resolve `../../src/lib/*`.

- [ ] **Step 4: Implement the lib modules**

Create `events-src/src/lib/time.ts`:

```ts
const OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const title = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export const mytDateKey = (ms: number) => new Date(ms + OFFSET_MS).toISOString().slice(0, 10);

function parts(key: string) {
  const d = new Date(`${key}T00:00:00Z`);
  return { wd: WEEKDAYS[d.getUTCDay()]!, day: d.getUTCDate(), mo: MONTHS[d.getUTCMonth()]! };
}

export function dayLabel(key: string): string {
  const p = parts(key);
  return `${p.wd} ${p.day} ${p.mo}`;
}

export function dayShort(key: string): string {
  const p = parts(key);
  return `${title(p.wd)} ${p.day} ${title(p.mo)}`;
}

export const dayDiff = (fromKey: string, toKey: string) =>
  Math.round((Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) / DAY_MS);

export const timeLabel = (iso: string) => new Date(Date.parse(iso) + OFFSET_MS).toISOString().slice(11, 16);

export const endOfDayMs = (key: string) => Date.parse(`${key}T00:00:00Z`) - OFFSET_MS + DAY_MS;

export function relativeHint(key: string, todayKey: string): string {
  const n = dayDiff(todayKey, key);
  return n === 1 ? "tomorrow" : `in ${n} days`;
}
```

Create `events-src/src/lib/status.ts`:

```ts
import type { PublicEvent } from "../types";
import { dayDiff, endOfDayMs, mytDateKey } from "./time";

export type StatusKind = "live" | "board" | "dep" | "today" | "soon" | "closed";
export interface Status {
  label: string;
  kind: StatusKind;
  /** Whether stations show it as a chip (routine "TODAY / IN 4D" stay quiet). */
  chip: boolean;
}

const HOUR = 60 * 60 * 1000;
const soon = (days: number): Status => ({ label: days === 1 ? "TOMORROW" : `IN ${days}D`, kind: "soon", chip: false });
const TODAY: Status = { label: "TODAY", kind: "today", chip: false };
const DEPARTED: Status = { label: "DEPARTED", kind: "dep", chip: true };

export function eventStatus(e: PublicEvent, nowMs: number): Status {
  const days = dayDiff(mytDateKey(nowMs), e.date);
  if (e.kind === "deadline") {
    const closes = e.all_day ? endOfDayMs(e.date) : Date.parse(e.start);
    if (nowMs >= closes) return { label: "CLOSED", kind: "closed", chip: true };
    return { label: days <= 0 ? "CLOSES TODAY" : `CLOSES IN ${days}D`, kind: "board", chip: true };
  }
  if (e.all_day) {
    if (nowMs >= (e.end ? Date.parse(e.end) : endOfDayMs(e.date))) return DEPARTED;
    return days <= 0 ? TODAY : soon(days);
  }
  const start = Date.parse(e.start);
  const end = e.end ? Date.parse(e.end) : start + 3 * HOUR;
  if (nowMs >= end) return DEPARTED;
  if (nowMs >= start) return { label: "LIVE NOW", kind: "live", chip: true };
  if (start - nowMs <= HOUR) {
    return { label: `BOARDING · ${Math.ceil((start - nowMs) / 60_000)} MIN`, kind: "board", chip: true };
  }
  return days <= 0 ? TODAY : soon(days);
}
```

Create `events-src/src/lib/timetable.ts`:

```ts
import type { PublicEvent } from "../types";
import { mytDateKey } from "./time";

export interface Day {
  key: string;
  isToday: boolean;
  /** Klang Valley stations on the main line. */
  main: PublicEvent[];
  /** Singapore / online / elsewhere: drawn on that day's branch. */
  branch: PublicEvent[];
}

const byStart = (a: PublicEvent, b: PublicEvent) => a.start.localeCompare(b.start) || a.name.localeCompare(b.name);

export function buildTimetable(events: PublicEvent[], nowMs: number): Day[] {
  const today = mytDateKey(nowMs);
  const days = new Map<string, PublicEvent[]>([[today, []]]);
  for (const e of events) {
    const key = e.date < today ? today : e.date;
    const list = days.get(key) ?? [];
    list.push(e);
    days.set(key, list);
  }
  return [...days.keys()].sort().map((key) => {
    const list = days.get(key)!.sort(byStart);
    return {
      key,
      isToday: key === today,
      main: list.filter((e) => e.region === "kv"),
      branch: list.filter((e) => e.region !== "kv"),
    };
  });
}

export const dayEvents = (day: Day) => [...day.main, ...day.branch].sort(byStart);

export function spurLabel(branch: PublicEvent[]): string {
  const online = branch.filter((e) => e.region === "online").length;
  if (online === branch.length) return "ONLINE LINK";
  return online > 0 ? "OVERSEAS & ONLINE LINK" : "OVERSEAS LINK";
}
```

Create `events-src/src/lib/lines.ts`:

```ts
import type { Topic } from "../types";

export const LINES: Record<Topic, { name: string; color: string; code: string }> = {
  ai: { name: "AI Line", color: "#e8453c", code: "AI" },
  founder: { name: "Founder Line", color: "#2f6fde", code: "FO" },
  hack: { name: "Hack Line", color: "#1aa260", code: "HK" },
  design: { name: "Design Line", color: "#9b51e0", code: "DS" },
  hardware: { name: "Hardware Line", color: "#f39c12", code: "HW" },
  community: { name: "Community Line", color: "#8a8f98", code: "CM" },
};
```

Create `events-src/src/lib/prefs.ts`:

```ts
const PREFIX = "builderline.";

/** Storage can be missing or throw (private mode, blocked site data); preferences then last one visit. */
export function readPref<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(PREFIX + key);
    return value === null ? fallback : (JSON.parse(value) as T);
  } catch {
    return fallback;
  }
}

export function writePref(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage unavailable: keep the in-memory value only.
  }
}
```

Create `events-src/src/lib/api.ts`:

```ts
import type { EventsResponse } from "../types";
import { readPref, writePref } from "./prefs";

export type Load = { state: "fresh" | "cached"; data: EventsResponse } | { state: "error" };

const STALE_MS = 48 * 60 * 60 * 1000;

export async function loadTimetable(fetchImpl: typeof fetch = fetch): Promise<Load> {
  try {
    const res = await fetchImpl("/api/events", { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as EventsResponse;
    if (!Array.isArray(data.events)) throw new Error("unexpected response");
    writePref("timetable", data);
    return { state: "fresh", data };
  } catch {
    const cached = readPref<EventsResponse | null>("timetable", null);
    return cached ? { state: "cached", data: cached } : { state: "error" };
  }
}

/** Whole days since OpenClaw last pushed, once that is more than 48 h; otherwise null. */
export function staleDays(data: EventsResponse, nowMs: number): number | null {
  if (!data.last_ingest_at) return null;
  const age = nowMs - Date.parse(data.last_ingest_at);
  return age > STALE_MS ? Math.floor(age / (24 * 60 * 60 * 1000)) : null;
}
```

- [ ] **Step 5: Run to see pass**

Run: `cd events-src && npm test && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add events-src/package.json events-src/package-lock.json events-src/tsconfig.json events-src/vite.config.ts events-src/README.md events-src/src/types.ts events-src/src/lib events-src/tests/unit
git commit -m "Scaffold the Builder Line app with timetable, status and data loading"
```

---

### Task 10: The line, the floating display, and loading states

**Files:**
- Create: `events-src/index.html`, `events-src/public/favicon.svg`, `events-src/playwright.config.ts`
- Create: `events-src/src/main.tsx`, `events-src/src/App.tsx`, `events-src/src/index.css`
- Create: `events-src/src/hooks/useNow.ts`, `useMedia.ts`, `useFlap.ts`
- Create: `events-src/src/components/TopBar.tsx`, `PlatformDisplay.tsx`, `Line.tsx`, `DayStation.tsx`, `Stop.tsx`, `Spur.tsx`
- Test: `events-src/tests/e2e/fixture.ts`, `events-src/tests/e2e/setup.ts`, `events-src/tests/e2e/line.spec.ts`

**Interfaces:**
- Consumes: everything in `src/lib` (Task 9).
- Produces:
  - `useNow(intervalMs?): number`, `useMedia(query): boolean`, `useReducedMotion(): boolean`, `useIsDesktop(): boolean`, `useFlap(text, reduced): string`.
  - `DayStation` props `{ day: Day; todayKey: string; at: boolean; onSelect(): void; ref?: Ref<HTMLButtonElement> }`.
  - `Stop` props `{ event: PublicEvent; now: number; kept: boolean; branch: boolean; onOpen(id: string): void }`.
  - `Spur` props `{ day: Day; now: number; kept: ReadonlySet<string>; active: boolean; reduced: boolean; onOpen(id: string): void }`.
  - `Line` props (this task) `{ days; todayKey; now; current; kept; reduced; scrollRef; onSelectDay(i); onOpen(id); emptyMessage: ReactNode }`.
  - `PlatformDisplay` props `{ day: Day | undefined; todayKey; now; reduced; notice: string | null; fallback: string; onOpen(id) }` and `data-testid="pids"`.
  - e2e: `test`/`expect` with a `timetable` option, `fixture`, `NOW`, `centre(locator)`.

- [ ] **Step 1: Shell files**

Create `events-src/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#0f1115" />
    <title>Builder Line — KL builder events</title>
    <meta name="description" content="Every builder, startup and tech event in Kuala Lumpur, drawn as a transit line. Updated daily." />
    <meta property="og:title" content="Builder Line — KL builder events" />
    <meta property="og:description" content="Every builder, startup and tech event in Kuala Lumpur, drawn as a transit line. Updated daily." />
    <meta property="og:url" content="https://events.hong.build/" />
    <meta property="og:type" content="website" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `events-src/public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1c1c1e"/><path d="M11 8h7.5a4.5 4.5 0 0 1 2.6 8.2A5 5 0 0 1 19 24H11z" fill="none" stroke="#f7f4ee" stroke-width="3" stroke-linejoin="round"/><circle cx="25" cy="25" r="3" fill="#e8453c"/></svg>
```

Create `events-src/playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:4179/events/" },
  webServer: {
    command: "npx vite --port 4179 --strictPort",
    url: "http://localhost:4179/events/",
    reuseExistingServer: true,
  },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
});
```

Create `events-src/src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 2: Write the e2e fixture and failing specs**

Create `events-src/tests/e2e/fixture.ts`:

```ts
import type { EventsResponse, PublicEvent } from "../../src/types";

/** Sat 7 Nov 2026, 18:52 in KL. */
export const NOW = new Date("2026-11-07T18:52:00+08:00");

const base: Omit<PublicEvent, "id" | "name" | "start" | "date" | "topic" | "location" | "url"> = {
  end: null, all_day: false, region: "kv", place_tag: null, kind: "event", organizer: null, price: null, image: null,
};

export const fixture: EventsResponse = {
  generated_at: "2026-11-07T10:52:00.000Z",
  last_ingest_at: "2026-11-07T00:05:00.000Z",
  tz: "Asia/Kuala_Lumpur",
  events: [
    { ...base, id: "a000000000000001", name: "Morning Design Crit", start: "2026-11-07T01:00:00.000Z", end: "2026-11-07T03:00:00.000Z", date: "2026-11-07", topic: "design", location: "Bangsar", url: "https://luma.com/crit" },
    { ...base, id: "a000000000000002", name: "Weekend Hack Sprint", start: "2026-11-07T02:00:00.000Z", end: "2026-11-07T14:00:00.000Z", date: "2026-11-07", topic: "hack", location: "Cyberjaya", url: "https://luma.com/sprint" },
    { ...base, id: "a000000000000003", name: "Builders Demo Night", start: "2026-11-07T11:30:00.000Z", date: "2026-11-07", topic: "founder", location: "Bangsar", url: "https://luma.com/demo" },
    { ...base, id: "a000000000000004", name: "AI Tinker Night", start: "2026-11-09T11:00:00.000Z", date: "2026-11-09", topic: "ai", location: "KL Sentral", url: "https://luma.com/tinker" },
    { ...base, id: "a000000000000005", name: "Code Meets Animation - SwiftLah! Community x LottieFiles", start: "2026-11-10T16:00:00.000Z", all_day: true, date: "2026-11-11", topic: "design", location: "Petaling Jaya", url: "https://luma.com/cwe18vhn", organizer: "SwiftLah! × LottieFiles" },
    { ...base, id: "a000000000000006", name: "SG Product Circle", start: "2026-11-17T11:00:00.000Z", date: "2026-11-17", region: "sg", place_tag: "SG", topic: "founder", location: "Singapore", url: "https://luma.com/sgpc" },
    { ...base, id: "a000000000000007", name: "Global AI Grant closes", start: "2026-11-20T15:59:00.000Z", date: "2026-11-20", region: "online", place_tag: "ONLINE", topic: "ai", kind: "deadline", location: "Online", url: "https://example.org/grant" },
  ],
};
```

Create `events-src/tests/e2e/setup.ts`:

```ts
import { test as base, expect, type Locator } from "@playwright/test";
import type { EventsResponse } from "../../src/types";
import { fixture, NOW } from "./fixture";

export const test = base.extend<{ timetable: EventsResponse }>({
  timetable: [fixture, { option: true }],
  page: async ({ page, timetable }, use) => {
    await page.clock.setFixedTime(NOW);
    await page.route("**/api/events", (route) => route.fulfill({ json: timetable }));
    await use(page);
  },
});
export { expect };

/** Bring an element to the middle of the map so the floating display never covers it. */
export async function centre(locator: Locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: "center" }));
}
```

Create `events-src/tests/e2e/line.spec.ts`:

```ts
import { fixture } from "./fixture";
import { expect, test } from "./setup";

test("today is the first station, with live statuses", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("button", { name: "Sat 7 Nov, today: 3 events" })).toBeVisible();
  await expect(page.getByText("You are here")).toBeVisible();
  await expect(page.getByTestId("pids")).toContainText("NOW · SAT 7 NOV");
  await expect(page.getByRole("button", { name: /Weekend Hack Sprint/ })).toContainText("LIVE NOW");
  await expect(page.getByRole("button", { name: /Builders Demo Night/ })).toContainText("BOARDING · 38 MIN");
  await expect(page.getByRole("button", { name: /Morning Design Crit/ })).toContainText("DEPARTED");
});

test("branches appear only on days with overseas or online events", async ({ page }) => {
  await page.goto("./");
  const spurs = page.locator(".spur");
  await expect(spurs).toHaveCount(2);
  await expect(spurs.nth(0)).toContainText("OVERSEAS LINK");
  await expect(spurs.nth(0)).toContainText("SG Product Circle");
  await expect(spurs.nth(1)).toContainText("ONLINE LINK");
  await expect(spurs.nth(1)).toContainText("CLOSES IN 13D");
});

test.describe("with nothing scheduled", () => {
  test.use({ timetable: { ...fixture, events: [] } });
  test("says so and offers the subscription", async ({ page }) => {
    await page.goto("./");
    await expect(page.getByTestId("pids")).toContainText("NO SERVICE SCHEDULED");
    await expect(page.getByText("No departures yet.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Subscribe" })).toHaveAttribute("href", "webcal://events.hong.build/events.ics");
  });
});

test.describe("when OpenClaw has gone quiet", () => {
  test.use({ timetable: { ...fixture, last_ingest_at: "2026-11-04T00:00:00.000Z" } });
  test("the display admits the timetable is old", async ({ page }) => {
    await page.goto("./");
    await expect(page.getByTestId("pids")).toContainText("TIMETABLE UPDATED 3D AGO");
  });
});

test("falls back to the saved timetable when the API is down", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByTestId("pids")).toContainText("NOW · SAT 7 NOV");
  await page.route("**/api/events", (route) => route.abort());
  await page.reload();
  await expect(page.getByTestId("pids")).toContainText("SERVICE DISRUPTION · SHOWING SAVED TIMETABLE");
  await expect(page.getByRole("button", { name: /AI Tinker Night/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});

test("shows a friendly error with no saved copy", async ({ page }) => {
  await page.route("**/api/events", (route) => route.abort());
  await page.goto("./");
  await expect(page.getByText("We can’t reach the timetable right now.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});
```

- [ ] **Step 3: Run to see failure**

Run: `cd events-src && npx playwright test tests/e2e/line.spec.ts`
Expected: FAIL — the dev server can't resolve `./App` (and `./index.css`).

- [ ] **Step 4: Hooks**

Create `events-src/src/hooks/useNow.ts`:

```ts
import { useEffect, useState } from "react";

/** The current time, refreshed every `intervalMs` so statuses move on by themselves. */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
```

Create `events-src/src/hooks/useMedia.ts`:

```ts
import { useEffect, useState } from "react";

export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof matchMedia === "function" && matchMedia(query).matches);
  useEffect(() => {
    const mq = matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");
export const useIsDesktop = () => useMedia("(min-width: 900px)");
```

Create `events-src/src/hooks/useFlap.ts`:

```ts
import { useEffect, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Split-flap effect: letters scramble, then settle left to right. Instant with reduced motion. */
export function useFlap(text: string, reduced: boolean): string {
  const [shown, setShown] = useState(text);
  useEffect(() => {
    if (reduced) {
      setShown(text);
      return;
    }
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const c = text.charAt(i);
        out += c === " " || frame > 3 + i * 0.55 ? c : CHARS.charAt(Math.floor(Math.random() * CHARS.length));
      }
      setShown(out);
      if (frame > 4 + text.length * 0.55) {
        clearInterval(id);
        setShown(text);
      }
    }, 36);
    return () => clearInterval(id);
  }, [text, reduced]);
  return shown;
}
```

- [ ] **Step 5: Components**

Create `events-src/src/components/TopBar.tsx` (brand only; Task 12 adds the toggles):

```tsx
export function TopBar() {
  return (
    <header className="tx-top">
      <div className="tx-brand">
        <span className="logo" aria-hidden="true">B</span>
        <div>
          <h1>Builder Line</h1>
          <small>KL builder events</small>
        </div>
      </div>
    </header>
  );
}
```

Create `events-src/src/components/DayStation.tsx`:

```tsx
import type { Ref } from "react";
import type { Day } from "../lib/timetable";
import { dayLabel, dayShort, relativeHint } from "../lib/time";

interface Props {
  day: Day;
  todayKey: string;
  at: boolean;
  onSelect(): void;
  ref?: Ref<HTMLButtonElement>;
}

export function DayStation({ day, todayKey, at, onSelect, ref }: Props) {
  const count = day.main.length + day.branch.length;
  const cls = ["tx-day", day.isToday && "now", day.branch.length > 0 && "ix", at && "at"].filter(Boolean).join(" ");
  return (
    <button
      ref={ref}
      type="button"
      className={cls}
      onClick={onSelect}
      aria-label={`${dayShort(day.key)}${day.isToday ? ", today" : ""}: ${count} ${count === 1 ? "event" : "events"}`}
    >
      {dayLabel(day.key)}{" "}
      {day.isToday ? <span className="tx-here">You are here</span> : <small>{relativeHint(day.key, todayKey)}</small>}
    </button>
  );
}
```

Create `events-src/src/components/Stop.tsx`:

```tsx
import type { CSSProperties } from "react";
import { LINES } from "../lib/lines";
import { eventStatus } from "../lib/status";
import { timeLabel } from "../lib/time";
import type { PublicEvent } from "../types";

interface Props {
  event: PublicEvent;
  now: number;
  kept: boolean;
  /** Drawn on a branch: mirrored to the right-hand line. */
  branch: boolean;
  onOpen(id: string): void;
}

const tagClass = (e: PublicEvent) => (e.region === "sg" ? "sg" : e.region === "online" ? "on" : "ot");

export function Stop({ event, now, kept, branch, onOpen }: Props) {
  const status = eventStatus(event, now);
  const cls = ["tx-stop", `r-${event.region}`, branch && "ov", status.kind === "dep" && "dep", kept && "kept"]
    .filter(Boolean)
    .join(" ");
  const chip = status.chip ? <i className={`st ${status.kind}`}>{status.label}</i> : null;
  const when = event.all_day ? "All day" : `${timeLabel(event.start)}${event.region === "sg" ? " SGT" : ""}`;
  return (
    <button
      type="button"
      className={cls}
      style={{ "--c": LINES[event.topic].color } as CSSProperties}
      onClick={() => onOpen(event.id)}
      data-event-id={event.id}
    >
      {status.kind === "live" && <i className="pulse" aria-hidden="true" />}
      {kept && <em className="kb" aria-label="kept">🎟</em>}
      <b>{event.name}</b>
      <span>
        {event.place_tag && <i className={`rg ${tagClass(event)}`}>{event.place_tag}</i>}
        {when} · {event.location}
        {!branch && chip}
      </span>
      {branch && chip && <span className="stl">{chip}</span>}
    </button>
  );
}
```

Create `events-src/src/components/Spur.tsx`:

```tsx
import { useLayoutEffect, useRef, useState } from "react";
import { spurLabel, type Day } from "../lib/timetable";
import { Stop } from "./Stop";

interface Props {
  day: Day;
  now: number;
  kept: ReadonlySet<string>;
  /** The train is at this day: send the little teal train out along the branch. */
  active: boolean;
  reduced: boolean;
  onOpen(id: string): void;
}

/** A branch that curves off the main line under its day, runs right, then down past its stations. */
export function Spur({ day, now, kept, active, reduced, onOpen }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const label = spurLabel(day.branch);
  const allOnline = day.branch.every((e) => e.region === "online");
  const right = size ? size.w - 20 : 0;
  const curve = size ? `M20 0 C20 10 28 13 42 13 L${right - 22} 13 C${right - 6} 13 ${right} 19 ${right} 34` : "";
  const run = size ? `${curve} L${right} ${size.h - 22}` : "";

  return (
    <div ref={ref} className={`spur${allOnline ? " on" : ""}${active && !reduced ? " go" : ""}`}>
      {size && (
        <svg className="spur-svg" viewBox={`0 0 ${size.w} 40`} preserveAspectRatio="none" aria-hidden="true">
          <path className="spur-p" d={curve} />
        </svg>
      )}
      <span className="spur-l" aria-hidden="true">{label}</span>
      <i className="spur-rail" aria-hidden="true" />
      <i className="spur-end" aria-hidden="true" />
      {size && <i className="spur-train" aria-hidden="true" style={{ offsetPath: `path("${run}")` }} />}
      <ul className="stops" aria-label={label.toLowerCase()}>
        {day.branch.map((e) => (
          <li key={e.id}>
            <Stop event={e} now={now} kept={kept.has(e.id)} branch onOpen={onOpen} />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Create `events-src/src/components/Line.tsx` (no train yet; Task 11 replaces this file):

```tsx
import type { ReactNode, RefObject } from "react";
import type { Day } from "../lib/timetable";
import { DayStation } from "./DayStation";
import { Spur } from "./Spur";
import { Stop } from "./Stop";

export interface LineProps {
  days: Day[];
  todayKey: string;
  now: number;
  current: number;
  kept: ReadonlySet<string>;
  reduced: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  onSelectDay(index: number): void;
  onOpen(id: string): void;
  emptyMessage: ReactNode;
}

export function Line({ days, todayKey, now, current, kept, reduced, scrollRef, onSelectDay, onOpen, emptyMessage }: LineProps) {
  return (
    <div className="tx-map" ref={scrollRef}>
      <div className="tx-inner">
        <div className="tx-rail" aria-hidden="true" />
        <ol className="days" aria-label="Upcoming events by day">
          {days.map((day, i) => (
            <li key={day.key}>
              <DayStation day={day} todayKey={todayKey} at={i === current} onSelect={() => onSelectDay(i)} />
              {day.branch.length > 0 && (
                <Spur day={day} now={now} kept={kept} active={i === current} reduced={reduced} onOpen={onOpen} />
              )}
              {day.main.length > 0 && (
                <ul className="stops">
                  {day.main.map((e) => (
                    <li key={e.id}>
                      <Stop event={e} now={now} kept={kept.has(e.id)} branch={false} onOpen={onOpen} />
                    </li>
                  ))}
                </ul>
              )}
              {day.isToday && day.main.length + day.branch.length === 0 && emptyMessage}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
```

Create `events-src/src/components/PlatformDisplay.tsx`:

```tsx
import { useEffect, useMemo, useState } from "react";
import { useFlap } from "../hooks/useFlap";
import { LINES } from "../lib/lines";
import { eventStatus } from "../lib/status";
import { dayLabel, timeLabel } from "../lib/time";
import { dayEvents, type Day } from "../lib/timetable";

interface Props {
  day: Day | undefined;
  todayKey: string;
  now: number;
  reduced: boolean;
  /** Service notice (offline / stale), shown under the departure. */
  notice: string | null;
  /** Second line when the day has no departures. */
  fallback: string;
  onOpen(id: string): void;
}

/** Floating split-flap board. Decorative for screen readers: the list carries the same facts. */
export function PlatformDisplay({ day, todayKey, now, reduced, notice, fallback, onOpen }: Props) {
  const list = useMemo(() => (day ? dayEvents(day) : []), [day]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    if (list.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % list.length), 3200);
    return () => clearInterval(id);
  }, [list]);

  const event = list[index % Math.max(list.length, 1)];
  const shown = useFlap(event ? event.name.toUpperCase() : "NO SERVICE SCHEDULED", reduced);
  const header = day ? `${day.key === todayKey ? "NOW" : "STATION"} · ${dayLabel(day.key)}` : "";
  const status = event ? eventStatus(event, now) : null;
  const line = event ? LINES[event.topic] : null;
  const when = event ? (event.all_day ? "ALL DAY" : `${timeLabel(event.start)}${event.region === "sg" ? " SGT" : ""}`) : "";
  const place = event && event.location.toUpperCase() !== "ONLINE" ? ` · ${event.location.toUpperCase()}` : "";

  return (
    <div className="pids" data-testid="pids" aria-hidden="true" onClick={() => event && onOpen(event.id)}>
      <div className="pids-k">
        <span>{header}</span>
        <span className="pids-pg">
          {list.length > 1 && list.map((e, i) => <i key={e.id} className={i === index ? "on" : undefined} />)}
        </span>
      </div>
      <div className="pids-n">{shown}</div>
      <div className="pids-m">
        {event && line && status ? (
          <>
            {event.place_tag && <span className="p-sg">{event.place_tag} · </span>}
            {when}
            {place} · <span style={{ color: line.color, filter: "brightness(1.5)" }}>{line.name.toUpperCase()}</span>
            {status.chip && (
              <>
                {" · "}
                <span className={`s-${status.kind}`}>{status.label}</span>
              </>
            )}
          </>
        ) : (
          fallback
        )}
      </div>
      {notice && <div className="pids-x">{notice}</div>}
    </div>
  );
}
```

- [ ] **Step 6: App (first version)**

Create `events-src/src/App.tsx`:

```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Line } from "./components/Line";
import { PlatformDisplay } from "./components/PlatformDisplay";
import { TopBar } from "./components/TopBar";
import { useReducedMotion } from "./hooks/useMedia";
import { useNow } from "./hooks/useNow";
import { loadTimetable, staleDays, type Load } from "./lib/api";
import { readPref } from "./lib/prefs";
import { dayLabel, mytDateKey } from "./lib/time";
import { buildTimetable, dayEvents } from "./lib/timetable";

export default function App() {
  const [load, setLoad] = useState<Load | null>(null);
  const now = useNow();
  const reduced = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [kept] = useState<Set<string>>(() => new Set(readPref<string[]>("kept", [])));
  const scrollRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => {
    void loadTimetable().then(setLoad);
  }, []);
  useEffect(refresh, [refresh]);

  const data = load && load.state !== "error" ? load.data : null;
  const days = useMemo(() => (data ? buildTimetable(data.events, now) : []), [data, now]);

  if (!load) return <div className="boot" aria-busy="true">Loading the timetable…</div>;
  if (load.state === "error") {
    return (
      <div className="boot">
        <p>We can’t reach the timetable right now.</p>
        <button type="button" onClick={refresh}>Try again</button>
      </div>
    );
  }

  const todayKey = mytDateKey(now);
  const at = Math.min(current, days.length - 1);
  const stale = staleDays(load.data, now);
  const notice =
    load.state === "cached" ? "SERVICE DISRUPTION · SHOWING SAVED TIMETABLE" : stale !== null ? `TIMETABLE UPDATED ${stale}D AGO` : null;
  const next = days.slice(at + 1).flatMap(dayEvents)[0];
  const fallback = next ? `NEXT: ${next.name.toUpperCase()} · ${dayLabel(next.date)}` : "CHECK BACK SOON";

  return (
    <div className="shell">
      <main className="tx">
        <Line
          days={days}
          todayKey={todayKey}
          now={now}
          current={at}
          kept={kept}
          reduced={reduced}
          scrollRef={scrollRef}
          onSelectDay={setCurrent}
          onOpen={() => undefined}
          emptyMessage={
            load.data.events.length === 0 ? (
              <p className="tx-none">
                No departures yet. <a href="webcal://events.hong.build/events.ics">Subscribe</a> to get new ones as they’re added.
              </p>
            ) : null
          }
        />
        <div className="tx-fade" aria-hidden="true" />
        <TopBar />
        <PlatformDisplay day={days[at]} todayKey={todayKey} now={now} reduced={reduced} notice={notice} fallback={fallback} onOpen={() => undefined} />
        {load.state === "cached" && (
          <button type="button" className="retry" onClick={refresh}>Retry</button>
        )}
      </main>
      <aside className="aside" aria-label="Ticket" />
    </div>
  );
}
```

(`onOpen={() => undefined}` is replaced by the real ticket handler in Task 12.)

- [ ] **Step 7: Styles**

Create `events-src/src/index.css` (the full stylesheet, including the train, ticket and wallet styles used by Tasks 11–12):

```css
@import "tailwindcss";

:root {
  --bg: #f7f4ee; --fg: #1c1c1e; --mut: #6b6b70; --chip: #fff; --hover: #0000000a;
  --rail: var(--fg); --teal: #00a3a3;
  color-scheme: light;
}
:root.night { --bg: #0f1115; --fg: #eef0f4; --mut: #8b90a0; --chip: #1b1e25; --hover: #ffffff0d; color-scheme: dark; }

html, body, #root { height: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--fg); font-size: 12px;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased;
  transition: background-color .4s, color .4s;
}
button { font: inherit; color: inherit; cursor: pointer; }
a { color: inherit; }
:focus-visible { outline: 2px solid #2f6fde; outline-offset: 2px; border-radius: 6px; }

@keyframes ring { 0% { transform: scale(.6); opacity: 1 } 100% { transform: scale(2.2); opacity: 0 } }
@keyframes bump { 40% { transform: scale(1.22) } }
@keyframes hint { 50% { transform: translateY(3px) } }
@keyframes spurrun { from { offset-distance: 0%; opacity: 1 } to { offset-distance: 100%; opacity: 1 } }

.boot { min-height: 100dvh; display: grid; place-content: center; gap: 12px; text-align: center; font-size: 14px; color: var(--mut); }
.boot button, .retry { border: 0; border-radius: 999px; background: var(--fg); color: var(--bg); padding: 8px 16px; font-weight: 700; }

/* layout: one column on phones, line + ticket panel on desktop */
.shell { display: grid; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 900px) { .shell { grid-template-columns: minmax(0, 560px) 360px; gap: 28px; justify-content: center; padding: 0 24px; } }
.aside { display: none; }
@media (min-width: 900px) { .aside { display: block; padding-top: 150px; } }

.tx { position: relative; height: 100dvh; overflow: hidden; }
.tx-map { position: absolute; inset: 0; overflow-y: auto; scrollbar-width: none; padding: 0 14px; }
.tx-map::-webkit-scrollbar { display: none; }
.tx-inner { position: relative; padding: 150px 0 120px; }
.tx-fade { position: absolute; left: 0; right: 0; top: 0; height: 64px; background: linear-gradient(var(--bg) 0, var(--bg) 46px, transparent); z-index: 5; pointer-events: none; }

.tx-top { position: absolute; top: 14px; left: 14px; right: 14px; z-index: 6; display: flex; justify-content: space-between; align-items: center; }
.tx-brand { display: flex; gap: 8px; align-items: center; }
.tx-brand .logo { width: 28px; height: 28px; border-radius: 8px; background: var(--fg); color: var(--bg); display: grid; place-items: center; font-weight: 900; font-size: 15px; }
.tx-brand h1 { margin: 0; font-size: 15px; line-height: 1.1; }
.tx-brand small { font-size: 9.5px; color: var(--mut); }
.tx-icons { display: flex; gap: 6px; }
.tx-icons button { border: 0; background: var(--chip); border-radius: 999px; height: 30px; min-width: 30px; padding: 0 9px; font-size: 12px; font-weight: 700; box-shadow: 0 2px 8px #0000001a; }
.tx-icons .bump { animation: bump .45s cubic-bezier(.3, 1.8, .5, 1); }

/* floating platform display */
.pids {
  position: absolute; top: 54px; left: 10px; right: 10px; z-index: 6; cursor: pointer;
  background: #0b0c0ee8; -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  border: 1px solid #2a2c33; border-radius: 14px; padding: 9px 12px 10px; overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #ffb627; text-shadow: 0 0 6px #ffb62777;
  box-shadow: 0 22px 40px -14px #000000c0, 0 0 60px -14px #ffb62770;
}
.pids::after { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, #0000 0 2px, #00000030 2px 3px); pointer-events: none; }
.pids-k { display: flex; justify-content: space-between; align-items: center; font-size: 8.5px; letter-spacing: .13em; color: #ffb627aa; }
.pids-pg { display: flex; gap: 3px; }
.pids-pg i { width: 4px; height: 4px; border-radius: 50%; background: #ffb62740; }
.pids-pg i.on { background: #ffb627; }
.pids-n { font-size: 14px; font-weight: 700; margin-top: 4px; white-space: nowrap; overflow: hidden; min-height: 18px; }
.pids-m { font-size: 9.5px; margin-top: 3px; letter-spacing: .05em; white-space: nowrap; overflow: hidden; min-height: 12px; }
.pids-x { margin-top: 5px; font-size: 8.5px; letter-spacing: .12em; color: #ff9b7a; text-shadow: none; }
.s-live { color: #5dff9b; text-shadow: 0 0 6px #5dff9b88; }
.s-board { color: #ffe066; }
.s-dep, .s-closed { color: #777; text-shadow: none; }
.p-sg { color: #3fe0e0; text-shadow: 0 0 6px #3fe0e088; }
.retry { position: absolute; top: 140px; right: 18px; z-index: 6; padding: 4px 10px; font-size: 10px; }

/* the line */
.tx-rail { position: absolute; left: 17px; top: 120px; bottom: 120px; width: 6px; border-radius: 3px; background: var(--rail); }
.days, .stops { list-style: none; margin: 0; padding: 0; }
.tx-day {
  position: relative; display: flex; align-items: center; gap: 6px; width: 100%; min-height: 22px; margin: 14px 0 4px;
  padding: 0 0 0 44px; border: 0; background: none; text-align: left; font-weight: 800; font-size: 11px; letter-spacing: .05em;
}
.tx-day::before { content: ""; position: absolute; left: 9px; top: 0; width: 22px; height: 22px; border-radius: 50%; background: var(--bg); border: 5px solid var(--rail); box-sizing: border-box; z-index: 3; transition: transform .25s; }
.tx-day.ix::before { box-shadow: 0 0 0 3px var(--teal); }
.tx-day.at::before { transform: scale(1.3); }
.tx-day.now::after { content: ""; position: absolute; left: 9px; top: 0; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #e8453c; box-sizing: border-box; animation: ring 1.6s ease-out infinite; z-index: 2; }
.tx-day small { font-weight: 600; color: var(--mut); font-size: 9.5px; letter-spacing: 0; }
.tx-here { font-size: 9px; font-weight: 700; background: #e8453c; color: #fff; border-radius: 999px; padding: 2px 7px; letter-spacing: .02em; }
.tx-none { padding-left: 44px; font-size: 11px; color: var(--mut); }

.tx-stop {
  position: relative; display: flex; flex-direction: column; justify-content: center; width: 100%; min-height: 30px; margin: 3px 0;
  padding: 3px 0 3px 64px; border: 0; background: none; border-radius: 10px; text-align: left;
}
.tx-stop::before { content: ""; position: absolute; left: 23px; top: 50%; width: 26px; height: 5px; margin-top: -2.5px; background: var(--c); }
.tx-stop::after { content: ""; position: absolute; left: 44px; top: 50%; width: 15px; height: 15px; margin-top: -7.5px; border-radius: 50%; background: var(--bg); border: 4px solid var(--c); box-sizing: border-box; transition: transform .2s; }
.tx-stop:hover { background: var(--hover); }
.tx-stop:hover::after { transform: scale(1.3); }
.tx-stop b { font-size: 11.5px; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.tx-stop > span { font-size: 9.5px; color: var(--mut); }
.tx-stop .st { display: inline-block; font-style: normal; font-family: ui-monospace, Menlo, monospace; font-size: 8px; font-weight: 700; letter-spacing: .06em; padding: 1px 5px; border-radius: 4px; margin-left: 5px; background: #0b0c0e; color: #ffb627; vertical-align: 1px; }
.tx-stop .st.live { color: #5dff9b; }
.tx-stop .st.dep, .tx-stop .st.closed { color: #888; }
.tx-stop .stl { margin-top: 2px; }
.tx-stop.ov .st { margin: 0; }
.tx-stop.dep { opacity: .45; }
.tx-stop.dep b { text-decoration: line-through; }
.tx-stop .pulse { position: absolute; left: 44px; top: 50%; width: 15px; height: 15px; margin-top: -7.5px; border-radius: 50%; border: 2px solid var(--c); box-sizing: border-box; animation: ring 1.6s ease-out infinite; }
.tx-stop .kb { position: absolute; left: 54px; top: -3px; font-size: 11px; font-style: normal; z-index: 2; animation: bump .45s; }
.tx-stop.r-sg::after { border-radius: 4px; }
.tx-stop.r-online::after { border-style: dashed; }
.tx-stop.r-online::before { background: repeating-linear-gradient(90deg, var(--c) 0 5px, transparent 5px 8px); }
.tx-stop.ov { align-items: flex-end; text-align: right; padding: 3px 64px 3px 0; }
.tx-stop.ov::before { left: auto; right: 23px; }
.tx-stop.ov::after { left: auto; right: 44px; }
.tx-stop.ov .pulse { left: auto; right: 44px; }
.tx-stop.ov .kb { left: auto; right: 54px; }
.rg { display: inline-block; font-style: normal; font-size: 7.5px; font-weight: 800; letter-spacing: .06em; padding: 1px 4px; border-radius: 3px; margin-right: 5px; vertical-align: 1px; }
.rg.sg { background: var(--teal); color: #fff; }
.rg.on { border: 1px dashed var(--mut); color: var(--mut); padding: 0 4px; }
.rg.ot { border: 1px solid var(--teal); color: var(--teal); padding: 0 4px; }

/* a branch: only on days that need one */
.spur { position: relative; padding: 26px 0 14px; margin-bottom: 2px; }
.spur-svg { position: absolute; left: 0; top: 0; width: 100%; height: 40px; overflow: visible; pointer-events: none; }
.spur-p { fill: none; stroke: var(--teal); stroke-width: 6; stroke-linecap: round; }
.spur.on .spur-p { stroke-dasharray: 9 6; stroke-linecap: butt; }
.spur-rail { position: absolute; right: 17px; top: 33px; bottom: 12px; width: 6px; background: var(--teal); }
.spur.on .spur-rail { background: repeating-linear-gradient(180deg, var(--teal) 0 9px, transparent 9px 15px); }
.spur-end { position: absolute; right: 10px; bottom: 8px; width: 20px; height: 6px; border-radius: 3px; background: var(--teal); }
.spur-l { position: absolute; left: 50%; top: 7px; transform: translateX(-50%); font-size: 8px; font-weight: 800; letter-spacing: .12em; color: var(--teal); background: var(--bg); padding: 0 7px; white-space: nowrap; }
.spur-train { position: absolute; left: 0; top: 0; width: 16px; height: 10px; border-radius: 5px; background: var(--teal); box-shadow: 0 0 0 2px var(--bg); offset-rotate: auto; offset-distance: 0%; opacity: 0; z-index: 3; pointer-events: none; }
.spur.go .spur-train { animation: spurrun 1.5s cubic-bezier(.5, 0, .3, 1) forwards; }

/* the train */
.tx-train { position: absolute; left: 12px; top: 0; width: 16px; height: 28px; border-radius: 8px; background: #e8453c; box-shadow: 0 0 0 3px var(--bg), 0 4px 10px #0000003a; z-index: 4; cursor: grab; touch-action: none; transition: top .6s cubic-bezier(.5, 0, .2, 1); }
.tx-train::before { content: ""; position: absolute; left: 3px; right: 3px; top: 4px; height: 6px; border-radius: 3px; background: #ffffffaa; }
.tx-train::after { content: "drag me ↕"; position: absolute; left: -4px; top: -20px; font-size: 8.5px; font-weight: 700; background: var(--fg); color: var(--bg); border-radius: 999px; padding: 2px 6px; white-space: nowrap; animation: hint 1.6s ease-in-out infinite; }
.tx-train.used::after { display: none; }
.tx-train.drag { transition: none; cursor: grabbing; }

.tx-now { position: absolute; left: 50%; bottom: 18px; transform: translate(-50%, 20px); opacity: 0; pointer-events: none; border: 0; background: var(--fg); color: var(--bg); border-radius: 999px; padding: 8px 14px; font-size: 11.5px; font-weight: 700; box-shadow: 0 6px 18px #0000003a; transition: all .3s; z-index: 6; }
.tx-now.show { opacity: 1; transform: translate(-50%, 0); pointer-events: auto; }

/* sheet (phone) and panel (desktop) */
.tx-scrim { position: absolute; inset: 0; background: #0000; pointer-events: none; transition: background .3s; z-index: 7; }
.tx-scrim.show { background: #00000055; pointer-events: auto; }
.tx-sheet { position: absolute; left: 10px; right: 10px; bottom: 10px; transform: translateY(118%); transition: transform .42s cubic-bezier(.2, .9, .2, 1); z-index: 8; }
.tx-sheet.show { transform: none; }
.panel { position: sticky; top: 150px; }
.aside-empty { margin: 0; padding: 18px; border: 1.5px dashed var(--mut); border-radius: 18px; color: var(--mut); font-size: 12px; text-align: center; }

.tk { background: #fff; color: #1c1c1e; border-radius: 18px; overflow: hidden; box-shadow: 0 14px 34px #00000040; position: relative; }
.tk-band { display: flex; justify-content: space-between; align-items: center; padding: 8px 40px 8px 12px; color: #fff; font-size: 9.5px; font-weight: 800; letter-spacing: .1em; background: var(--c); }
.tk-band .ln { display: flex; align-items: center; gap: 6px; }
.tk-band .ln i { width: 17px; height: 17px; border-radius: 50%; background: #fff; color: var(--c); font-style: normal; font-size: 7px; display: grid; place-items: center; }
.tk-close { position: absolute; right: 8px; top: 5px; width: 24px; height: 24px; border: 0; border-radius: 50%; background: #ffffff33; color: #fff; font-size: 16px; line-height: 1; }
.tk-body { padding: 11px 13px 13px; }
.tk-body h2 { margin: 0; font-size: 15px; line-height: 1.25; padding-right: 54px; outline: none; }
.tk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px 10px; margin: 9px 0 0; }
.tk-grid dt { font-size: 8.5px; letter-spacing: .12em; color: #8a8a90; font-weight: 700; }
.tk-grid dd { margin: 0; font-size: 12px; font-weight: 600; }
.tk-perf { margin: 11px -13px; border-top: 2px dashed #e5e0d6; }
.tk-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.tk-btns a, .tk-btns button { display: block; text-align: center; padding: 9px 0; border: 0; border-radius: 10px; font-weight: 700; font-size: 11.5px; background: #f1ede5; color: #1c1c1e; text-decoration: none; }
.tk-btns .p { background: var(--c); color: #fff; }
.tk-btns .keep.on { background: #1c1c1e; color: #ffb627; }
.tk-stamp { position: absolute; right: 12px; top: 40px; border: 3px solid var(--c); color: var(--c); font-weight: 900; font-size: 12px; padding: 2px 7px; border-radius: 7px; transform: rotate(12deg) scale(1.8); opacity: 0; transition: all .3s cubic-bezier(.3, 1.6, .5, 1); letter-spacing: .06em; background: #fff; }
.tk.kept .tk-stamp { opacity: 1; transform: rotate(12deg) scale(1); }

.wl { background: #fff; color: #1c1c1e; border-radius: 18px; padding: 13px; box-shadow: 0 14px 34px #00000040; }
.wl h2 { margin: 0 0 8px; font-size: 14px; outline: none; }
.wl ul { list-style: none; margin: 0; padding: 0; }
.wl-t { display: block; width: 100%; text-align: left; border: 0; border-radius: 10px; padding: 7px 10px; margin-bottom: 6px; background: #f7f4ee; border-left: 6px solid var(--c); }
.wl-t b { font-size: 11.5px; display: block; }
.wl-t small { font-size: 9.5px; color: #7a7a80; }
.wl-cta { display: block; text-align: center; margin-top: 8px; background: #1c1c1e; color: #fff; border-radius: 10px; padding: 9px 0; font-weight: 700; font-size: 11.5px; text-decoration: none; }
.wl-empty { font-size: 11.5px; color: #7a7a80; margin: 4px 0 2px; }
.wl-sub { display: block; font-size: 10px; color: #7a7a80; text-align: center; margin-top: 8px; }

.toast { position: absolute; left: 50%; bottom: 70px; transform: translate(-50%, 10px); opacity: 0; background: var(--fg); color: var(--bg); border-radius: 999px; padding: 7px 14px; font-weight: 700; transition: all .3s; z-index: 9; pointer-events: none; white-space: nowrap; }
.toast.show { opacity: 1; transform: translate(-50%, 0); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 8: Run to see pass**

Run: `cd events-src && npx playwright test tests/e2e/line.spec.ts && npm run typecheck`
Expected: PASS on both `phone` and `desktop` projects; typecheck clean.

- [ ] **Step 9: Look at it**

Run: `cd events-src && npx playwright test tests/e2e/line.spec.ts --project=phone --headed` and watch the run, or add `await page.screenshot({ path: "test-results/line.png" })` temporarily to the first spec. Compare against `docs/events/prototype.html` (day mode). Fix visual drift in `index.css` only; remove any temporary screenshot line before committing.

- [ ] **Step 10: Commit**

```bash
git add events-src/index.html events-src/public/favicon.svg events-src/playwright.config.ts events-src/src/main.tsx events-src/src/App.tsx events-src/src/index.css events-src/src/hooks events-src/src/components events-src/tests/e2e
git commit -m "Render the Builder Line with branches, floating platform display and service states"
```

---

### Task 11: The draggable train and Back to now

**Files:**
- Modify (replace whole file): `events-src/src/components/Line.tsx`
- Create: `events-src/src/components/BackToNow.tsx`
- Modify: `events-src/src/App.tsx`
- Test: `events-src/tests/e2e/train.spec.ts`

**Interfaces:**
- Consumes: Task 10 components and hooks.
- Produces: `LineProps` gains `onPassDay(index: number): void`. Train element: `role="slider"`, accessible name `Train: choose a day`, `aria-valuetext` = `dayShort(key)`. `BackToNow` props `{ scrollRef: RefObject<HTMLDivElement | null>; onBack(): void }`.

- [ ] **Step 1: Write the failing specs**

Create `events-src/tests/e2e/train.spec.ts`:

```ts
import { fixture } from "./fixture";
import { centre, expect, test } from "./setup";

/** A dozen extra December meetups so the line is long enough to scroll on any viewport. */
const extra = Array.from({ length: 12 }, (_, i) => {
  const day = String(i + 1).padStart(2, "0");
  return { ...fixture.events[3]!, id: `b${String(i).padStart(15, "0")}`, name: `Extra Meetup ${i + 1}`, date: `2026-12-${day}`, start: `2026-12-${day}T11:00:00.000Z` };
});

test("arrow keys move the train a day at a time", async ({ page }) => {
  await page.goto("./");
  const train = page.getByRole("slider", { name: "Train: choose a day" });
  await train.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByTestId("pids")).toContainText("STATION · MON 9 NOV");
  await expect(train).toHaveAttribute("aria-valuetext", "Mon 9 Nov");
  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("pids")).toContainText("NOW · SAT 7 NOV");
});

test("dragging the train snaps it to the nearest day", async ({ page }) => {
  await page.goto("./");
  const train = page.getByRole("slider", { name: "Train: choose a day" });
  const target = page.getByRole("button", { name: /^Wed 11 Nov/ });
  const from = (await train.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByTestId("pids")).toContainText("STATION · WED 11 NOV");
  await expect(train).toHaveAttribute("aria-valuetext", "Wed 11 Nov");
});

test("tapping a day sends the train there and runs its branch", async ({ page }) => {
  await page.goto("./");
  const day = page.getByRole("button", { name: /^Tue 17 Nov/ });
  await centre(day);
  await day.click();
  await expect(page.getByTestId("pids")).toContainText("STATION · TUE 17 NOV");
  await expect(page.locator(".spur").first()).toHaveClass(/\bgo\b/);
});

test.describe("on a long timetable", () => {
  test.use({ timetable: { ...fixture, events: [...fixture.events, ...extra] } });
  test("Back to now appears after scrolling away and returns to today", async ({ page }) => {
    await page.goto("./");
    await page.locator(".tx-map").evaluate((el) => el.scrollTo({ top: 600 }));
    const back = page.getByRole("button", { name: "↑ Back to now" });
    await expect(back).toBeVisible();
    await back.click();
    await expect(page.getByTestId("pids")).toContainText("NOW · SAT 7 NOV");
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("branches don't animate", async ({ page }) => {
    await page.goto("./");
    const day = page.getByRole("button", { name: /^Tue 17 Nov/ });
    await centre(day);
    await day.click();
    await expect(page.getByTestId("pids")).toContainText("STATION · TUE 17 NOV");
    await expect(page.locator(".spur.go")).toHaveCount(0);
  });
});
```

- [ ] **Step 2: Run to see failure**

Run: `cd events-src && npx playwright test tests/e2e/train.spec.ts`
Expected: FAIL — no element with role `slider`; no "Back to now" button.

- [ ] **Step 3: Replace `Line.tsx`**

Replace the whole of `events-src/src/components/Line.tsx` with:

```tsx
import {
  useCallback, useLayoutEffect, useRef, useState,
  type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject,
} from "react";
import { dayShort } from "../lib/time";
import type { Day } from "../lib/timetable";
import { DayStation } from "./DayStation";
import { Spur } from "./Spur";
import { Stop } from "./Stop";

export interface LineProps {
  days: Day[];
  todayKey: string;
  now: number;
  current: number;
  kept: ReadonlySet<string>;
  reduced: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  /** Train arrives at a day (click, keyboard, or end of a drag). */
  onSelectDay(index: number): void;
  /** Train passes a day while being dragged. */
  onPassDay(index: number): void;
  onOpen(id: string): void;
  emptyMessage: ReactNode;
}

export function Line({
  days, todayKey, now, current, kept, reduced, scrollRef, onSelectDay, onPassDay, onOpen, emptyMessage,
}: LineProps) {
  const stations = useRef<(HTMLButtonElement | null)[]>([]);
  const innerRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef(current);
  currentRef.current = current;
  const grab = useRef(0);
  const passing = useRef(current);
  const [restY, setRestY] = useState(0);
  const [dragY, setDragY] = useState<number | null>(null);
  const [used, setUsed] = useState(false);

  /** Train top that lines up with a day's interchange circle. */
  const top = useCallback((i: number) => (stations.current[i]?.offsetTop ?? 0) - 3, []);

  useLayoutEffect(() => {
    setRestY(top(current));
  }, [current, days, top]);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setRestY(top(currentRef.current)));
    observer.observe(el);
    return () => observer.disconnect();
  }, [top]);

  const nearest = (y: number) => {
    let best = 0;
    let bestDistance = Infinity;
    days.forEach((_, i) => {
      const d = Math.abs(top(i) - y);
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    });
    return best;
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    grab.current = e.clientY - e.currentTarget.getBoundingClientRect().top;
    passing.current = current;
    setUsed(true);
    setDragY(restY);
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragY === null) return;
    const map = scrollRef.current;
    const inner = innerRef.current;
    if (!map || !inner) return;
    const box = map.getBoundingClientRect();
    if (e.clientY > box.bottom - 40) map.scrollTop += 10;
    else if (e.clientY < box.top + 150) map.scrollTop -= 10;
    const y = Math.max(top(0), Math.min(top(days.length - 1), e.clientY - inner.getBoundingClientRect().top - grab.current));
    setDragY(y);
    const i = nearest(y);
    if (i !== passing.current) {
      passing.current = i;
      onPassDay(i);
    }
  };

  const onUp = () => {
    if (dragY === null) return;
    setDragY(null);
    onSelectDay(passing.current);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    setUsed(true);
    const i = Math.max(0, Math.min(days.length - 1, current + step));
    if (i === current) return;
    onSelectDay(i);
    stations.current[i]?.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div className="tx-map" ref={scrollRef}>
      <div className="tx-inner" ref={innerRef}>
        <div className="tx-rail" aria-hidden="true" />
        <div
          className={`tx-train${dragY !== null ? " drag" : ""}${used ? " used" : ""}`}
          style={{ top: dragY ?? restY }}
          role="slider"
          tabIndex={0}
          aria-label="Train: choose a day"
          aria-valuemin={0}
          aria-valuemax={Math.max(0, days.length - 1)}
          aria-valuenow={current}
          aria-valuetext={days[current] ? dayShort(days[current].key) : ""}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={onKey}
        />
        <ol className="days" aria-label="Upcoming events by day">
          {days.map((day, i) => (
            <li key={day.key}>
              <DayStation
                ref={(el) => {
                  stations.current[i] = el;
                }}
                day={day}
                todayKey={todayKey}
                at={i === current}
                onSelect={() => onSelectDay(i)}
              />
              {day.branch.length > 0 && (
                <Spur day={day} now={now} kept={kept} active={i === current} reduced={reduced} onOpen={onOpen} />
              )}
              {day.main.length > 0 && (
                <ul className="stops">
                  {day.main.map((e) => (
                    <li key={e.id}>
                      <Stop event={e} now={now} kept={kept.has(e.id)} branch={false} onOpen={onOpen} />
                    </li>
                  ))}
                </ul>
              )}
              {day.isToday && day.main.length + day.branch.length === 0 && emptyMessage}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add `BackToNow`**

Create `events-src/src/components/BackToNow.tsx`:

```tsx
import { useEffect, useState, type RefObject } from "react";

interface Props {
  scrollRef: RefObject<HTMLDivElement | null>;
  onBack(): void;
}

export function BackToNow({ scrollRef, onBack }: Props) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => setShow(el.scrollTop > 120);
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, [scrollRef]);
  return (
    <button type="button" className={`tx-now${show ? " show" : ""}`} onClick={onBack} tabIndex={show ? 0 : -1} aria-hidden={!show}>
      ↑ Back to now
    </button>
  );
}
```

- [ ] **Step 5: Wire into `App.tsx`**

In `events-src/src/App.tsx`, add the import:

```tsx
import { BackToNow } from "./components/BackToNow";
```

Replace:

```tsx
          onSelectDay={setCurrent}
          onOpen={() => undefined}
```

with:

```tsx
          onSelectDay={setCurrent}
          onPassDay={setCurrent}
          onOpen={() => undefined}
```

Replace:

```tsx
        {load.state === "cached" && (
          <button type="button" className="retry" onClick={refresh}>Retry</button>
        )}
      </main>
```

with:

```tsx
        {load.state === "cached" && (
          <button type="button" className="retry" onClick={refresh}>Retry</button>
        )}
        <BackToNow
          scrollRef={scrollRef}
          onBack={() => {
            scrollRef.current?.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
            setCurrent(0);
          }}
        />
      </main>
```

- [ ] **Step 6: Run to see pass**

Run: `cd events-src && npx playwright test && npm run typecheck`
Expected: all specs PASS on both projects (Task 10's specs still pass).

- [ ] **Step 7: Commit**

```bash
git add events-src/src/components/Line.tsx events-src/src/components/BackToNow.tsx events-src/src/App.tsx events-src/tests/e2e/train.spec.ts
git commit -m "Add the draggable, keyboard-driven train and Back to now"
```

---

### Task 12: Tickets, My Journey, deep links, night service and chime

**Files:**
- Create: `events-src/src/lib/sound.ts`
- Create: `events-src/src/components/Sheet.tsx`, `Ticket.tsx`, `Wallet.tsx`, `Toast.tsx`
- Modify (replace whole file): `events-src/src/components/TopBar.tsx`
- Modify (replace whole file): `events-src/src/App.tsx`
- Test: `events-src/tests/e2e/ticket.spec.ts`

**Interfaces:**
- Consumes: Tasks 9–11.
- Produces: `unlockSound(): void`, `chime(): void`, `tick(): void`; `Sheet { open; variant: "sheet" | "panel"; label; onClose(); children }`; `Ticket { event; now; kept; onToggleKeep(); onShare(); onClose() }` with `data-testid="ticket"`; `Wallet { events; onOpen(id) }` with `data-testid="wallet"`; `Toast { message }`; `TopBar { night; sound; keptCount; bump; onNight(); onSound(); onWallet() }`. Deep link format `#e=<16hex>`. Preference keys: `kept`, `night`, `sound`, `timetable`.

- [ ] **Step 1: Write the failing specs**

Create `events-src/tests/e2e/ticket.spec.ts`:

```ts
import { centre, expect, test } from "./setup";

test("a station opens its ticket with sign-up and calendar links", async ({ page }) => {
  await page.goto("./");
  const stop = page.getByRole("button", { name: /AI Tinker Night/ });
  await centre(stop);
  await stop.click();
  const ticket = page.getByTestId("ticket");
  await expect(ticket).toContainText("AI LINE");
  await expect(ticket.getByRole("heading", { name: "AI Tinker Night" })).toBeFocused();
  await expect(ticket.getByRole("link", { name: "Sign up ↗" })).toHaveAttribute("href", "https://luma.com/tinker");
  await expect(ticket.getByRole("link", { name: "+ Calendar" })).toHaveAttribute("href", "/e/a000000000000004.ics");
  await expect(page).toHaveURL(/#e=a000000000000004$/);
});

test("Escape closes the ticket and returns focus to the station", async ({ page, isMobile }) => {
  await page.goto("./");
  const stop = page.getByRole("button", { name: /AI Tinker Night/ });
  await centre(stop);
  await stop.click();
  await page.keyboard.press("Escape");
  if (isMobile) await expect(page.getByTestId("ticket")).toHaveCount(0);
  await expect(stop).toBeFocused();
  await expect(page).not.toHaveURL(/#e=/);
});

test("kept tickets are stamped, counted, remembered and exportable", async ({ page }) => {
  await page.goto("./");
  const stop = page.getByRole("button", { name: /AI Tinker Night/ });
  await centre(stop);
  await stop.click();
  await page.getByRole("button", { name: "🎟 Keep" }).click();
  await expect(page.getByTestId("ticket")).toHaveClass(/kept/);
  await expect(page.getByRole("button", { name: "My Journey, 1 kept" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.reload();
  await page.getByRole("button", { name: "My Journey, 1 kept" }).click();
  const wallet = page.getByTestId("wallet");
  await expect(wallet).toContainText("AI Tinker Night");
  await expect(wallet.getByRole("link", { name: "Add 1 to my calendar" })).toHaveAttribute(
    "href",
    "/api/events/plan.ics?ids=a000000000000004",
  );
  await expect(wallet.getByRole("link", { name: "Subscribe to the whole line" })).toHaveAttribute(
    "href",
    "webcal://events.hong.build/events.ics",
  );
});

test("a shared link opens straight to the ticket", async ({ page }) => {
  await page.goto("./#e=a000000000000006");
  await expect(page.getByTestId("ticket")).toContainText("SG Product Circle");
  await expect(page.getByTestId("ticket")).toContainText("19:00 SGT");
});

test("a link to an event that has gone says so", async ({ page }) => {
  await page.goto("./#e=ffffffffffffffff");
  await expect(page.getByRole("status")).toHaveText("That event has left the line");
});

test("night service switches theme and is remembered", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Night service" }).click();
  await expect(page.locator("html")).toHaveClass(/night/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/night/);
});

test("the station chime can be turned on", async ({ page }) => {
  await page.goto("./");
  const chime = page.getByRole("button", { name: "Station chime" });
  await expect(chime).toHaveAttribute("aria-pressed", "false");
  await chime.click();
  await expect(chime).toHaveAttribute("aria-pressed", "true");
});

test("desktop shows the ticket beside the line and can copy a link", async ({ page, context }, info) => {
  test.skip(info.project.name !== "desktop", "desktop layout only");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  // Desktop Chrome on macOS has a native share sheet; force the copy-link path the test can observe.
  await page.addInitScript(() => Object.defineProperty(navigator, "share", { value: undefined, configurable: true }));
  await page.goto("./");
  await expect(page.getByText("Tap a station to see its ticket.")).toBeVisible();
  await page.getByRole("button", { name: /Builders Demo Night/ }).click();
  await expect(page.getByRole("complementary").getByTestId("ticket")).toContainText("Builders Demo Night");
  await page.getByRole("button", { name: "Share this event" }).click();
  await expect(page.getByRole("status")).toHaveText("Link copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("https://events.hong.build/#e=a000000000000003");
});
```

- [ ] **Step 2: Run to see failure**

Run: `cd events-src && npx playwright test tests/e2e/ticket.spec.ts`
Expected: FAIL — no ticket, no My Journey button, no toggles.

- [ ] **Step 3: Sound**

Create `events-src/src/lib/sound.ts`:

```ts
let ctx: AudioContext | null = null;

/** Browsers only allow audio after a user gesture; call this from a click/keypress handler. */
export function unlockSound(): void {
  ctx ??= new AudioContext();
  void ctx.resume();
}

function tone(freq: number, delay: number, duration: number, volume: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t = ctx.currentTime + delay;
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

/** Two-tone arrival chime. */
export function chime(): void {
  tone(784, 0, 0.55, 0.16);
  tone(622, 0.3, 0.8, 0.16);
}

/** Quiet tick as the dragged train passes a day. */
export function tick(): void {
  tone(1500, 0, 0.04, 0.04);
}
```

- [ ] **Step 4: Sheet, Ticket, Wallet, Toast**

Create `events-src/src/components/Sheet.tsx`:

```tsx
import { useEffect, type ReactNode } from "react";

interface Props {
  open: boolean;
  /** "sheet" slides up over the line (phones); "panel" sits beside it (desktop). */
  variant: "sheet" | "panel";
  label: string;
  onClose(): void;
  children: ReactNode;
}

export function Sheet({ open, variant, label, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (variant === "panel") {
    return (
      <section className="panel" aria-label={label}>
        {open ? children : <p className="aside-empty">Tap a station to see its ticket.</p>}
      </section>
    );
  }
  return (
    <>
      <div className={`tx-scrim${open ? " show" : ""}`} onClick={onClose} aria-hidden="true" />
      <div className={`tx-sheet${open ? " show" : ""}`} role="dialog" aria-modal="true" aria-label={label} inert={!open}>
        {open && children}
      </div>
    </>
  );
}
```

Create `events-src/src/components/Ticket.tsx`:

```tsx
import { useEffect, useRef, type CSSProperties } from "react";
import { LINES } from "../lib/lines";
import { eventStatus } from "../lib/status";
import { dayShort, timeLabel } from "../lib/time";
import type { PublicEvent } from "../types";

interface Props {
  event: PublicEvent;
  now: number;
  kept: boolean;
  onToggleKeep(): void;
  onShare(): void;
  onClose(): void;
}

export function Ticket({ event, now, kept, onToggleKeep, onShare, onClose }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [event.id]);

  const line = LINES[event.topic];
  const status = eventStatus(event, now);
  const zone = event.region === "sg" ? "SGT" : "MYT";
  const time = event.all_day ? "All day" : `${timeLabel(event.start)}${event.end ? `–${timeLabel(event.end)}` : ""} ${zone}`;

  return (
    <article className={`tk${kept ? " kept" : ""}`} style={{ "--c": line.color } as CSSProperties} data-testid="ticket">
      <div className="tk-band">
        <span className="ln">
          <i>{line.code}</i>
          {line.name.toUpperCase()}
          {event.place_tag ? ` · ${event.place_tag}` : ""}
        </span>
        <span>{status.label}</span>
      </div>
      <button type="button" className="tk-close" onClick={onClose} aria-label="Close ticket">×</button>
      <span className="tk-stamp" aria-hidden="true">KEPT ★</span>
      <div className="tk-body">
        <h2 ref={heading} tabIndex={-1}>{event.name}</h2>
        <dl className="tk-grid">
          <div><dt>DATE</dt><dd>{dayShort(event.date)}</dd></div>
          <div><dt>TIME</dt><dd>{time}</dd></div>
          <div><dt>STATION</dt><dd>{event.location}</dd></div>
          <div><dt>HOST</dt><dd>{event.organizer ?? "—"}</dd></div>
          {event.price && <div><dt>PRICE</dt><dd>{event.price}</dd></div>}
        </dl>
        <div className="tk-perf" />
        <div className="tk-btns">
          <a className="p" href={event.url} target="_blank" rel="noopener noreferrer">Sign up ↗</a>
          <a href={`/e/${event.id}.ics`} download>+ Calendar</a>
          <button type="button" className={`keep${kept ? " on" : ""}`} aria-pressed={kept} onClick={onToggleKeep}>
            {kept ? "🎟 Kept" : "🎟 Keep"}
          </button>
          <button type="button" onClick={onShare} aria-label="Share this event">Share</button>
        </div>
      </div>
    </article>
  );
}
```

Create `events-src/src/components/Wallet.tsx`:

```tsx
import { useEffect, useRef, type CSSProperties } from "react";
import { LINES } from "../lib/lines";
import { dayShort, timeLabel } from "../lib/time";
import type { PublicEvent } from "../types";

interface Props {
  events: PublicEvent[];
  onOpen(id: string): void;
}

export function Wallet({ events, onOpen }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="wl" data-testid="wallet">
      <h2 ref={heading} tabIndex={-1}>🎟 My Journey</h2>
      {events.length === 0 ? (
        <p className="wl-empty">No tickets yet. Tap a station and press <b>Keep</b>.</p>
      ) : (
        <>
          <ul>
            {events.map((e) => (
              <li key={e.id}>
                <button type="button" className="wl-t" style={{ "--c": LINES[e.topic].color } as CSSProperties} onClick={() => onOpen(e.id)}>
                  <b>{e.name}</b>
                  <small>{dayShort(e.date)} · {e.all_day ? "All day" : timeLabel(e.start)} · {e.location}</small>
                </button>
              </li>
            ))}
          </ul>
          <a className="wl-cta" href={`/api/events/plan.ics?ids=${events.map((e) => e.id).join(",")}`} download>
            Add {events.length} to my calendar
          </a>
        </>
      )}
      <a className="wl-sub" href="webcal://events.hong.build/events.ics">Subscribe to the whole line</a>
    </div>
  );
}
```

Create `events-src/src/components/Toast.tsx`:

```tsx
export function Toast({ message }: { message: string | null }) {
  return (
    <div className={`toast${message ? " show" : ""}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
```

- [ ] **Step 5: Replace `TopBar.tsx`**

Replace the whole of `events-src/src/components/TopBar.tsx` with:

```tsx
interface Props {
  night: boolean;
  sound: boolean;
  keptCount: number;
  /** Changes on every Keep, replaying the wallet's bump. */
  bump: number;
  onNight(): void;
  onSound(): void;
  onWallet(): void;
}

export function TopBar({ night, sound, keptCount, bump, onNight, onSound, onWallet }: Props) {
  return (
    <header className="tx-top">
      <div className="tx-brand">
        <span className="logo" aria-hidden="true">B</span>
        <div>
          <h1>Builder Line</h1>
          <small>KL builder events</small>
        </div>
      </div>
      <div className="tx-icons">
        <button type="button" onClick={onNight} aria-pressed={night} aria-label="Night service">{night ? "☀️" : "🌙"}</button>
        <button type="button" onClick={onSound} aria-pressed={sound} aria-label="Station chime">{sound ? "🔔" : "🔇"}</button>
        <button key={bump} type="button" className={bump ? "bump" : undefined} onClick={onWallet} aria-label={`My Journey, ${keptCount} kept`}>
          🎟 <span>{keptCount}</span>
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 6: Replace `App.tsx`**

Replace the whole of `events-src/src/App.tsx` with:

```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackToNow } from "./components/BackToNow";
import { Line } from "./components/Line";
import { PlatformDisplay } from "./components/PlatformDisplay";
import { Sheet } from "./components/Sheet";
import { Ticket } from "./components/Ticket";
import { Toast } from "./components/Toast";
import { TopBar } from "./components/TopBar";
import { Wallet } from "./components/Wallet";
import { useIsDesktop, useReducedMotion } from "./hooks/useMedia";
import { useNow } from "./hooks/useNow";
import { loadTimetable, staleDays, type Load } from "./lib/api";
import { readPref, writePref } from "./lib/prefs";
import { chime, tick, unlockSound } from "./lib/sound";
import { dayLabel, mytDateKey } from "./lib/time";
import { buildTimetable, dayEvents } from "./lib/timetable";
import type { PublicEvent } from "./types";

type Panel = { kind: "ticket"; id: string } | { kind: "wallet" } | null;

const prefersDark = () => typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;

export default function App() {
  const [load, setLoad] = useState<Load | null>(null);
  const now = useNow();
  const reduced = useReducedMotion();
  const desktop = useIsDesktop();
  const [current, setCurrent] = useState(0);
  const [kept, setKept] = useState<Set<string>>(() => new Set(readPref<string[]>("kept", [])));
  const [bump, setBump] = useState(0);
  const [night, setNight] = useState<boolean>(() => readPref<boolean | null>("night", null) ?? prefersDark());
  const [sound, setSound] = useState<boolean>(() => readPref<boolean>("sound", false));
  const [panel, setPanel] = useState<Panel>(null);
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const deepLinked = useRef(false);

  const refresh = useCallback(() => {
    void loadTimetable().then(setLoad);
  }, []);
  useEffect(refresh, [refresh]);

  useEffect(() => {
    document.documentElement.classList.toggle("night", night);
  }, [night]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const data = load && load.state !== "error" ? load.data : null;
  const days = useMemo(() => (data ? buildTimetable(data.events, now) : []), [data, now]);
  const byId = useMemo(() => new Map((data?.events ?? []).map((e) => [e.id, e])), [data]);

  // A shared link (#e=<id>) opens its ticket once the timetable has loaded.
  useEffect(() => {
    if (!data || deepLinked.current) return;
    deepLinked.current = true;
    const match = /^#e=([0-9a-f]{16})$/.exec(location.hash);
    if (!match) return;
    if (byId.has(match[1]!)) setPanel({ kind: "ticket", id: match[1]! });
    else {
      setToast("That event has left the line");
      history.replaceState(null, "", location.pathname);
    }
  }, [data, byId]);

  const play = (sfx: () => void) => {
    if (!sound) return;
    unlockSound();
    sfx();
  };

  const openTicket = (id: string) => {
    if (!panel) opener.current = document.activeElement as HTMLElement | null;
    setPanel({ kind: "ticket", id });
    history.replaceState(null, "", `#e=${id}`);
  };

  const closePanel = useCallback(() => {
    setPanel(null);
    history.replaceState(null, "", location.pathname);
    opener.current?.focus({ preventScroll: true });
  }, []);

  const selectDay = (i: number) => {
    setCurrent(i);
    play(chime);
  };
  const passDay = (i: number) => {
    setCurrent(i);
    play(tick);
  };

  const toggleKeep = (id: string) => {
    const next = new Set(kept);
    const adding = !next.has(id);
    if (adding) next.add(id);
    else next.delete(id);
    setKept(next);
    writePref("kept", [...next]);
    setBump((b) => b + 1);
    if (adding) play(chime);
  };

  const share = async (e: PublicEvent) => {
    const url = `https://events.hong.build/#e=${e.id}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: e.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setToast("Link copied");
    } catch {
      // The person closed the share sheet, or the clipboard is blocked: nothing to undo.
    }
  };

  const toggleNight = () => {
    const value = !night;
    setNight(value);
    writePref("night", value);
  };

  const toggleSound = () => {
    const value = !sound;
    setSound(value);
    writePref("sound", value);
    if (value) {
      unlockSound();
      chime();
    }
  };

  if (!load) return <div className="boot" aria-busy="true">Loading the timetable…</div>;
  if (load.state === "error") {
    return (
      <div className="boot">
        <p>We can’t reach the timetable right now.</p>
        <button type="button" onClick={refresh}>Try again</button>
      </div>
    );
  }

  const todayKey = mytDateKey(now);
  const at = Math.min(current, days.length - 1);
  const stale = staleDays(load.data, now);
  const notice =
    load.state === "cached" ? "SERVICE DISRUPTION · SHOWING SAVED TIMETABLE" : stale !== null ? `TIMETABLE UPDATED ${stale}D AGO` : null;
  const next = days.slice(at + 1).flatMap(dayEvents)[0];
  const fallback = next ? `NEXT: ${next.name.toUpperCase()} · ${dayLabel(next.date)}` : "CHECK BACK SOON";
  const openEvent = panel?.kind === "ticket" ? (byId.get(panel.id) ?? null) : null;
  const keptEvents = [...kept]
    .map((id) => byId.get(id))
    .filter((e): e is PublicEvent => e !== undefined)
    .sort((a, b) => a.start.localeCompare(b.start));

  const sheet = (
    <Sheet
      open={panel !== null}
      variant={desktop ? "panel" : "sheet"}
      label={panel?.kind === "wallet" ? "My Journey" : (openEvent?.name ?? "Ticket")}
      onClose={closePanel}
    >
      {panel?.kind === "wallet" ? (
        <Wallet events={keptEvents} onOpen={openTicket} />
      ) : openEvent ? (
        <Ticket
          event={openEvent}
          now={now}
          kept={kept.has(openEvent.id)}
          onToggleKeep={() => toggleKeep(openEvent.id)}
          onShare={() => void share(openEvent)}
          onClose={closePanel}
        />
      ) : null}
    </Sheet>
  );

  return (
    <div className="shell">
      <main className="tx">
        <Line
          days={days}
          todayKey={todayKey}
          now={now}
          current={at}
          kept={kept}
          reduced={reduced}
          scrollRef={scrollRef}
          onSelectDay={selectDay}
          onPassDay={passDay}
          onOpen={openTicket}
          emptyMessage={
            load.data.events.length === 0 ? (
              <p className="tx-none">
                No departures yet. <a href="webcal://events.hong.build/events.ics">Subscribe</a> to get new ones as they’re added.
              </p>
            ) : null
          }
        />
        <div className="tx-fade" aria-hidden="true" />
        <TopBar
          night={night}
          sound={sound}
          keptCount={keptEvents.length}
          bump={bump}
          onNight={toggleNight}
          onSound={toggleSound}
          onWallet={() => {
            opener.current = document.activeElement as HTMLElement | null;
            setPanel({ kind: "wallet" });
          }}
        />
        <PlatformDisplay day={days[at]} todayKey={todayKey} now={now} reduced={reduced} notice={notice} fallback={fallback} onOpen={openTicket} />
        {load.state === "cached" && (
          <button type="button" className="retry" onClick={refresh}>Retry</button>
        )}
        <BackToNow
          scrollRef={scrollRef}
          onBack={() => {
            scrollRef.current?.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
            selectDay(0);
          }}
        />
        {!desktop && sheet}
        <Toast message={toast} />
      </main>
      {desktop && <aside className="aside" aria-label="Ticket">{sheet}</aside>}
    </div>
  );
}
```

- [ ] **Step 7: Run to see pass**

Run: `cd events-src && npx playwright test && npm test && npm run typecheck`
Expected: every spec PASSes on both projects (the desktop-only test is skipped on `phone`); unit tests and typecheck pass.

- [ ] **Step 8: Commit**

```bash
git add events-src/src/lib/sound.ts events-src/src/components/Sheet.tsx events-src/src/components/Ticket.tsx events-src/src/components/Wallet.tsx events-src/src/components/Toast.tsx events-src/src/components/TopBar.tsx events-src/src/App.tsx events-src/tests/e2e/ticket.spec.ts
git commit -m "Add tickets, My Journey, shareable links, night service and the station chime"
```

---

### Task 13: Build, OpenClaw guide, local end-to-end check, and Hong's deploy checklist

**Files:**
- Create: `docs/events/openclaw-ingest.md`
- Create: `public/events/**` (build output)

**Interfaces:**
- Consumes: everything above.
- Produces: committed `public/events/` build; the OpenClaw guide; a verified local round trip.

- [ ] **Step 1: Build the app and check the budget**

Run: `npm run events:build`
Expected: `public/events/index.html` and `public/events/assets/*.js|*.css` written; Vite's size report shows the JS bundle under 100 KB gzip. If it is over, report the number — do not add code-splitting without asking.

- [ ] **Step 2: Write the OpenClaw guide**

Create `docs/events/openclaw-ingest.md`:

````markdown
# Pushing events to Builder Line (events.hong.build)

OpenClaw sends its **whole list of upcoming events** to the site once a day, and again whenever it finds new ones. The site updates in place; sending the same list twice changes nothing.

## Request

```bash
curl -sS -X POST https://events.hong.build/api/events/ingest \
  -H "Authorization: Bearer $EVENTS_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  --data @events.json
```

`events.json`:

```json
{
  "source": "openclaw",
  "events": [
    {
      "name": "Code Meets Animation - SwiftLah! Community x LottieFiles",
      "date_text": "Wednesday, 11 November 2026",
      "location_text": "Petaling Jaya",
      "signup_url": "https://luma.com/cwe18vhn"
    }
  ]
}
```

### Required per event
| Field | Notes |
|---|---|
| `name` | ≤ 200 characters |
| `date_text` | e.g. `Wednesday, 11 November 2026`, `11 Nov 2026`, `Nov 11, 2026`, `2026-11-11`. Not needed if `start` is sent. |
| `location_text` | City or venue, e.g. `Petaling Jaya`, `Singapore`, `Online` |
| `signup_url` | Must be `https://`. This is the event's identity — keep it stable. |

### Optional per event (send whenever the event page shows it)
| Field | Effect |
|---|---|
| `start`, `end` | ISO 8601 with offset, e.g. `2026-11-11T19:00:00+08:00`. Turns "All day" into a time and enables LIVE / BOARDING. |
| `organizer` | Shown as HOST on the ticket. |
| `topic` | One of `ai`, `founder`, `hack`, `design`, `hardware`, `community`. Otherwise guessed from the name. |
| `region` | One of `kv`, `sg`, `online`, `other`. Otherwise worked out from `location_text`. |
| `kind` | `deadline` for applications/grants (shown as CLOSES IN …), else `event`. |
| `price`, `image_url` | Free text; `https://` image. |

Luma pages show the start time, host and cover image — include them when available.

### Request options
| Option | Use |
|---|---|
| `"dry_run": true` | Validate and report without saving. Use while setting up. |
| `"allow_shrink": true` | Only when intentionally clearing most of the timetable. Without it, a push that would hide more than half the upcoming events (or contains none) is refused with `409` and nothing changes. |

## Responses
| Status | Meaning | What to do |
|---|---|---|
| `200` | Saved (or dry-run report). Body: `added`, `updated`, `removed`, `rejected[]`, `warnings[]`. | Fix each `rejected[].reason` and `warnings[].message` in the next push. |
| `401` | Token missing or wrong. | Check `EVENTS_INGEST_TOKEN`. |
| `400` | Body isn't JSON or has no `events` array. | Fix the payload. |
| `409` | Shrink guard: the push looked broken. Body: `current`, `accepted`. | Check the scrape; resend the full list. |
| `413` | Over 1 MB or over 1000 events. | Send only upcoming events. |

## Instructions to give OpenClaw

> Every day at 08:00 Malaysia time, and right after you discover new events, send the complete list of upcoming KL builder / tech / startup events you know about (plus any Singapore, online or international opportunities) to `https://events.hong.build/api/events/ingest` as described in this guide, using the `EVENTS_INGEST_TOKEN` secret as a Bearer token. Always include `name`, `date_text` (or `start`), `location_text` and `signup_url`. When an event page shows a start time, end time, host or cover image, include `start`, `end`, `organizer` and `image_url`. Send `topic` and `region` when you are sure of them. Mark application or grant deadlines with `"kind": "deadline"`. Never send `allow_shrink` unless I ask. After each push, read the response: if anything is in `rejected` or `warnings`, correct those events and push again; if you get `409`, do not retry blindly — tell me what happened.
````

- [ ] **Step 3: Local round trip through the real Worker**

Run each from the repo root (all local, nothing deployed):

```bash
npx wrangler d1 migrations apply hong-build-hack --local
printf 'EVENTS_INGEST_TOKEN=local-dev-token\n' > .dev.vars
npx next build
npx wrangler dev --port 8787
```

`npx next build` refreshes `out/` (which now includes `out/events/`). If `next build` fails because of unrelated work in progress on this branch, report the error and instead run `mkdir -p out/events && cp -R public/events/. out/events/` before `wrangler dev`. Leave `wrangler dev` running and in another terminal:

```bash
curl -sS -X POST localhost:8787/api/events/ingest -H "Authorization: Bearer local-dev-token" -H "Content-Type: application/json" \
  --data '{"source":"local","events":[{"name":"Code Meets Animation - SwiftLah! Community x LottieFiles","date_text":"Wednesday, 11 November 2026","location_text":"Petaling Jaya","signup_url":"https://luma.com/cwe18vhn"}]}'
```

Expected: `{"dry_run":false,"received":1,"added":1,...}` (if today is after 11 Nov 2026, change the date to a future one).

```bash
curl -sS localhost:8787/api/events
curl -sS -H "Host: events.hong.build" localhost:8787/ | head -5
curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" localhost:8787/events
```

Expected: the event in JSON; the Builder Line HTML shell (`<title>Builder Line — KL builder events</title>`); `308 https://events.hong.build/`. If the second command returns the hong.build home page instead, local `wrangler dev` rewrote the Host header — host routing is already covered by `worker/test/routing.test.ts`, so note it in the report and continue. Stop `wrangler dev` afterwards. `.dev.vars` is gitignored.

- [ ] **Step 4: Full test sweep**

Run: `npm run test:worker && npm run typecheck:worker && (cd events-src && npm test && npm run typecheck && npx playwright test)`
Expected: all pass (record any pre-existing Worker typecheck errors outside the new code in the report, as in Task 8).

- [ ] **Step 5: Commit**

```bash
git add docs/events/openclaw-ingest.md public/events
git commit -m "Build Builder Line into public/events and document the OpenClaw contract"
```

- [ ] **Step 6: Hand Hong the deploy checklist (do not run these)**

Report these steps for Hong to run, in order:

1. `npx wrangler secret put EVENTS_INGEST_TOKEN` — choose a long random value; give the same value to OpenClaw.
2. `npx wrangler d1 migrations apply hong-build-hack --remote`
3. `npm run build && npx wrangler deploy` — this also creates the `events.hong.build` custom domain.
4. Have OpenClaw run one push with `"dry_run": true`, review `rejected`/`warnings`, then a real push.
5. Open `https://events.hong.build` on a phone and desktop.
