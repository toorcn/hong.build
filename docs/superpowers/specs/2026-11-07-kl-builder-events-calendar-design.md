# Builder Line — KL builder events calendar (events.hong.build)

**Status:** design approved 2026-11-07 · **Visual reference:** [`docs/events/prototype.html`](../../events/prototype.html) (open in a browser; fully interactive)

## 1. Goal

A public, interactive calendar of builder/tech/startup events in Kuala Lumpur, fed daily by Hong's OpenClaw agent, at `events.hong.build`. It is presented as a **KL transit map**: time runs down a main line, days are interchange stations, events are stations coloured by topic. It must be fun and animated without ever confusing a first-time visitor.

Focus is Klang Valley; Singapore, online and international opportunities appear occasionally and must not crowd KL.

### Non-goals (explicitly cut during design)

- Topic-line filter chips, network switch (KV / SG / Online), sideways desktop network map, Bahasa Malaysia signage, search, accounts, admin UI, per-event OG images, push notifications.

## 2. Architecture

```
OpenClaw (daily cron + on discovery)
   │ POST https://events.hong.build/api/events/ingest
   │ Authorization: Bearer <EVENTS_INGEST_TOKEN>
   ▼
Worker  worker/index.ts  (existing "hong-build" Worker, now also on events.hong.build)
   ├─ normalize + validate → D1 `events`, log → D1 `event_ingests`
   ├─ GET  /api/events     → upcoming events JSON
   ├─ GET  /events.ics     → subscription feed
   ├─ GET  /e/<id>.ics     → single-event calendar file
   └─ host events.hong.build → static app from public/events/
hong.build/events → 308 → https://events.hong.build/
```

- **No new infrastructure.** Same Worker, same D1 database (`hong-build-hack`), same deploy (`npm run build && npx wrangler deploy`).
- **Frontend is a separate Vite app** (`events-src/` → `public/events/`), mirroring `hack-src/`. Not a Next route, because `app/layout.tsx` mounts the 3D `LabScene` on every page.
- **Push model:** OpenClaw sends its *complete* list of upcoming events each time (a snapshot). Upserts are keyed on a stable id, so pushes are idempotent.

### Worker routing changes

- `wrangler.jsonc`: add route `{ "pattern": "events.hong.build", "custom_domain": true }`; add `"!/events/assets/*"` to `run_worker_first` exclusions.
- In `fetch`: API paths (`/api/events`, `/api/events/ingest`, `/events.ics`, `/e/*.ics`) are handled on any host. When `Host` is `events.hong.build`, every other non-asset path serves `/events/index.html` (SPA). On `hong.build`, `/events` and `/events/` redirect 308 to `https://events.hong.build/`.
- `Env` gains `EVENTS_INGEST_TOKEN: string` (set with `wrangler secret put EVENTS_INGEST_TOKEN`; never committed, never handled by Claude).
- Event code lives in `worker/events/` (`normalize.ts`, `places.ts`, `topics.ts`, `ingest.ts`, `api.ts`, `ics.ts`); `worker/index.ts` only routes.

## 3. Data contract

### 3.1 Ingest request

`POST /api/events/ingest` · `Content-Type: application/json` · `Authorization: Bearer <token>` · body ≤ 1 MB · ≤ 1000 events.

```jsonc
{
  "source": "openclaw",          // optional, logged
  "dry_run": false,              // optional: validate + report, write nothing
  "allow_shrink": false,         // optional: bypass the shrink guard (3.4)
  "events": [
    {
      // required (OpenClaw's current shape)
      "name": "Code Meets Animation - SwiftLah! Community x LottieFiles",
      "date_text": "Wednesday, 11 November 2026",   // required unless "start" is given
      "location_text": "Petaling Jaya",
      "signup_url": "https://luma.com/cwe18vhn",
      // optional enrichments
      "start": "2026-11-11T19:00:00+08:00",         // ISO 8601; wins over date_text
      "end": "2026-11-11T22:00:00+08:00",
      "organizer": "SwiftLah! × LottieFiles",
      "topic": "design",            // ai | founder | hack | design | hardware | community
      "region": "kv",               // kv | sg | online | other
      "kind": "event",              // event | deadline
      "price": "Free",
      "image_url": "https://…"
    }
  ]
}
```

### 3.2 Normalization (Worker)

| Field | Rule |
|---|---|
| `id` | First 16 hex chars of SHA-256 of the normalized `signup_url`: lowercase scheme+host, drop `utm_*` params and fragment, drop trailing `/`. |
| Time zone | All dates are interpreted in `Asia/Kuala_Lumpur` (UTC+8; SGT is identical). |
| `start_at` / `all_day` | `start` if present (timed). Else parse `date_text` → all-day on that local date. Accepted: `Wednesday, 11 November 2026`, `11 November 2026`, `11 Nov 2026`, `Nov 11, 2026`, `2026-11-11` (weekday optional, case-insensitive). |
| `end_at` | `end` if present; else null. For status only, a timed event with no end lasts 3 h; an all-day event lasts the local day. |
| `region` | Explicit `region` wins. Else from `location_text` (case-insensitive, `places.ts`): Klang Valley list (Kuala Lumpur, KL, KLCC, KL Sentral, Bukit Bintang, Petaling Jaya, PJ, Bangsar, Bangsar South, Mid Valley, TTDI, Damansara, Mont Kiara, Sri Hartamas, Cyberjaya, Putrajaya, Subang, Subang Jaya, Puchong, Shah Alam, Cheras, Ampang, Bukit Jalil, Sunway, Kepong, Setapak, Klang) → `kv`; Singapore → `sg`; online/virtual/zoom/remote/livestream → `online`; any other known place → `other`; unrecognised → `kv` **plus a warning** in the response. |
| `place_tag` | Branch label: `SG`, `ONLINE`, or the upper-cased place for `other` (e.g. `PENANG`, `TOKYO`). Null for `kv`. |
| `topic` | Explicit `topic` wins. Else keyword match on `name` (`topics.ts`), first hit in this order: hack (`hackathon`, `hack`, `buildathon`) → ai (`AI`, `LLM`, `GPT`, `agent`, `machine learning`, `ML`) → hardware (`hardware`, `IoT`, `robot`, `maker`, `electronics`) → design (`design`, `UX`, `UI`, `animation`, `figma`) → founder (`startup`, `founder`, `pitch`, `VC`, `investor`, `demo day`). Else `community`. Word-boundary matches only. |
| `kind` | `deadline` or `event` (default). |

### 3.3 Validation → per-event rejection (push still succeeds)

Missing `name`/`location_text`/`signup_url`; `signup_url` not `https://`; neither parsable `start` nor `date_text`; date earlier than 1 day ago or more than 365 days ahead; `name` > 200 chars; `end` before `start`; `image_url` not `https://` (field dropped, warning only). Duplicate ids within one push: last wins, warning.

### 3.4 Snapshot semantics and safety

- Each accepted event is upserted with `last_seen = ingest time`, `removed = 0`.
- After upsert: `UPDATE events SET removed = 1 WHERE removed = 0 AND start_at >= <start of today MYT> AND last_seen < <ingest time>` — upcoming events absent from the snapshot are hidden, not deleted.
- **Shrink guard:** if the push has 0 accepted events, or (currently-visible upcoming ≥ 4 and accepted upcoming < 50% of it), respond `409` and write nothing, unless `allow_shrink: true`.
- Prune: delete rows with `start_at < now − 30 days` on each successful ingest.

### 3.5 Ingest responses

| Case | Status | Body |
|---|---|---|
| Bad/missing token (constant-time compare) | 401 | `{ "error": "unauthorized" }` |
| Not JSON / no `events` array | 400 | `{ "error": "…" }` |
| Body > 1 MB or > 1000 events | 413 | `{ "error": "…" }` |
| Shrink guard | 409 | `{ "error": "shrink_guard", "current": n, "accepted": m }` |
| OK (incl. dry run) | 200 | `{ "dry_run", "received", "added", "updated", "removed", "rejected": [{ "index", "signup_url", "reason" }], "warnings": [{ "index", "message" }] }` |

Every call (except 401) is logged to `event_ingests`.

### 3.6 D1 schema — `migrations/0002_events.sql`

```sql
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_at INTEGER NOT NULL,          -- unix seconds (UTC)
  end_at INTEGER,
  all_day INTEGER NOT NULL DEFAULT 0,
  date_local TEXT NOT NULL,           -- YYYY-MM-DD in Asia/Kuala_Lumpur
  region TEXT NOT NULL,               -- kv | sg | online | other
  place_tag TEXT,
  topic TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'event',
  location_text TEXT NOT NULL,
  signup_url TEXT NOT NULL,
  organizer TEXT,
  price TEXT,
  image_url TEXT,
  raw TEXT NOT NULL,                  -- OpenClaw's original record (JSON)
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  removed INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS events_visible ON events (removed, start_at);

CREATE TABLE IF NOT EXISTS event_ingests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  source TEXT,
  status TEXT NOT NULL,               -- ok | dry_run | shrink_guard | invalid
  dry_run INTEGER NOT NULL DEFAULT 0,
  received INTEGER, added INTEGER, updated INTEGER, removed INTEGER, rejected INTEGER,
  detail TEXT                         -- JSON: rejections + warnings
);
```

### 3.7 Read API

`GET /api/events` → `Cache-Control: public, max-age=60` (D1 is read per request; add edge caching only if traffic needs it).

```jsonc
{
  "generated_at": "2026-11-07T10:52:00Z",
  "last_ingest_at": "2026-11-07T00:05:12Z",   // last status=ok ingest; drives the staleness notice
  "tz": "Asia/Kuala_Lumpur",
  "events": [
    { "id": "…", "name": "…", "start": "ISO", "end": "ISO|null", "all_day": true,
      "date": "2026-11-11", "region": "kv", "place_tag": null, "topic": "design",
      "kind": "event", "location": "Petaling Jaya", "url": "https://luma.com/…",
      "organizer": "…|null", "price": "…|null", "image": "…|null" }
  ]
}
```

Returns non-removed events starting from the start of today (MYT) to +180 days, plus multi-day events that started earlier but have not ended yet, sorted by `start_at`. Also sends `Access-Control-Allow-Origin: *` so others can reuse the data.

### 3.8 Calendar files

- `/events.ics` — VCALENDAR of non-removed events from −30 to +180 days; `X-WR-CALNAME:Builder Line — KL builder events`; offered as `webcal://events.hong.build/events.ics`.
- `/e/<id>.ics` — single VEVENT, `Content-Disposition: attachment`. 404 if unknown.
- `/api/events/plan.ics?ids=<id>,<id>…` — the kept tickets as one calendar file (≤ 50 ids, 16-hex each; 400 if none valid). Used by My Journey's "Add all to my calendar".
- `UID:<id>@events.hong.build`; all-day → `DTSTART;VALUE=DATE`; timed → UTC `…Z`; `URL` = signup url; RFC 5545 escaping and 75-octet line folding.

## 4. The page (events-src/)

Vite + React + TypeScript + Tailwind v4, `base: '/events/'`, `outDir: '../public/events'`. No 3D. Budget: < 100 KB JS gzipped. Look and motion follow `docs/events/prototype.html`.

### 4.1 Visual tokens

| Token | Value |
|---|---|
| Day background / text | `#f7f4ee` / `#1c1c1e` |
| Night background / text | `#0f1115` / `#eef0f4` |
| Topic lines | AI `#e8453c` · Founder `#2f6fde` · Hack `#1aa260` · Design `#9b51e0` · Hardware `#f39c12` · Community `#8a8f98` |
| Branch (non-KV) | `#00a3a3`; online-only branches dashed |
| Platform display | `#0b0c0e` @ 90% + 10px backdrop blur; amber `#ffb627` monospace with glow; live `#5dff9b`; scanlines |
| Train | `#e8453c`, 16×28 rounded |

### 4.2 Components

| Component | Responsibility |
|---|---|
| `App` | Fetches `/api/events`; holds `now` (ticks every 30 s), selected day, open ticket; reads `#e=<id>` deep link. |
| `TopBar` | Name, night toggle, chime toggle, My Journey button with count. Floats over the map with a fade into the background. |
| `PlatformDisplay` | Floating split-flap panel. Header `NOW · SAT 7 NOV` / `STATION · TUE 17 NOV`. Cycles the selected day's events every 3.2 s (name + time · place · line · status), with pager dots. Tapping it opens the shown event's ticket. `aria-hidden` (duplicates the list). |
| `Line` | Full-bleed scroll area; main rail; renders days that have events (today always). Semantic `<ol>` of days → `<ul>` of stops. |
| `DayStation` | Interchange circle + label + relative hint (`tomorrow`, `in 4 days`); "You are here" + pulse on today; teal ring when the day has a branch. Click → train goes there. |
| `Stop` | Station in topic colour; title, time · place, status chip; strikethrough + fade when DEPARTED; pulse when LIVE; 🎟 badge when kept. Button → ticket. |
| `Spur` | For days with non-KV events only: teal branch curving off the main line beneath that day's station, running right, then down past its stations to a terminus bar; label `OVERSEAS LINK` / `ONLINE LINK` / `OVERSEAS & ONLINE LINK`. Stops on it mirror to the right with `place_tag` chips (SG = rounded-square station; ONLINE = dashed). A small teal train runs along it when the main train arrives (CSS `offset-path`). |
| `Train` | Pointer-draggable along the rail with edge auto-scroll; live-updates the display while passing days; snaps to nearest day on release; glides on day click. Keyboard: `role="slider"`, ↑/↓ = previous/next day, `aria-valuetext` = day label. "drag me ↕" hint until first drag. |
| `TicketSheet` | Bottom sheet (mobile) / side panel (≥ 900 px). Topic-coloured band with line name + status; name; date, time (`MYT`/`SGT` labels), station, host; perforation; **Sign up ↗** (opens `url` in new tab, `rel="noopener"`), **+ Calendar** (`/e/<id>.ics`), **Keep** (stamp animation), **Share** (`navigator.share`, else copy `https://events.hong.build/#e=<id>`). |
| `JourneyWallet` | Kept tickets list; **Add all to my calendar** (`/api/events/plan.ics?ids=…`); **Subscribe to the whole line** (`webcal://…/events.ics`). |
| `BackToNow` | Pill shown once scrolled past today; scrolls up and sends the train to today. |

### 4.3 Status (computed client-side from `now`, MYT)

| Status | Rule |
|---|---|
| `LIVE NOW` | start ≤ now < effective end (timed only) |
| `BOARDING · n MIN` | 0 < start − now ≤ 60 min |
| `DEPARTED` | effective end ≤ now (only today's are still listed) |
| `TODAY` | all-day event on today |
| `TOMORROW` / `IN nD` | otherwise, by local-date difference |
| Deadlines | `CLOSES TODAY` / `CLOSES IN nD` / `CLOSED` |

### 4.4 Preferences and persistence (`localStorage`, wrapped in try/catch)

Kept ticket ids; night mode (defaults to `prefers-color-scheme` until toggled); chime on/off (default off); last good `/api/events` response (offline fallback).

### 4.5 Sound

WebAudio two-tone chime (784 Hz → 622 Hz) on arrival and on Keep; quiet tick when the dragged train passes a day. Only after the user turns sound on (user gesture).

### 4.6 Desktop (≥ 900 px)

Same vertical line in a centred column (~560 px), display floating at the top of the column, ticket opens in a side panel to the right instead of a bottom sheet.

### 4.7 Accessibility and motion

Full keyboard path (Tab through stops, Enter opens, Esc closes, focus returns to the stop); visible focus rings; colour is never the only signal (statuses are text, branch stops carry text tags); `prefers-reduced-motion` disables split-flap scramble, train glide, spur train and pulses.

## 5. Error handling (page)

| Situation | Behaviour |
|---|---|
| `/api/events` fails, cached copy exists | Render cached data; display shows `SERVICE DISRUPTION · SHOWING SAVED TIMETABLE`; retry button. |
| Fails, no cache | Friendly empty state with retry. |
| Zero events | Display `NO SERVICE SCHEDULED`; subscribe link. |
| `last_ingest_at` older than 48 h | Display footer note `TIMETABLE UPDATED nD AGO`. |
| Deep link id not found | Open nothing; brief toast "That event has left the line". |

## 6. OpenClaw integration deliverable

`docs/events/openclaw-ingest.md`: the contract above, a `curl` example, and a paste-ready instruction block for OpenClaw: push the full upcoming list daily (and after discovering new events), always include the four required fields, add optional fields when the source page shows them (Luma pages show time, host, cover), use `dry_run` while testing, read `rejected`/`warnings` and fix next push, never set `allow_shrink` unless intentionally clearing.

## 7. Testing

- **Unit (Vitest):** `date_text` formats and failures; URL → id normalization (utm stripping, case, trailing slash); place → region/tag table; topic inference order and word boundaries; validation reasons; status boundaries (BOARDING at 60/61 min, LIVE at start, DEPARTED at end, 3 h default, all-day); ICS escaping/folding.
- **Worker (Vitest + `@cloudflare/vitest-pool-workers`, local D1 with migrations):** happy-path ingest; re-push idempotent (0 added/updated changes counted correctly); removal of missing upcoming; shrink guard 409 and `allow_shrink`; 401; 413; dry run writes nothing; `GET /api/events` shape/window/order; ICS endpoints; host routing and `/events` redirect.
- **UI (Playwright, phone + desktop viewports, fixture API):** today renders with "You are here"; dragging the train updates the display; stop opens ticket; Keep persists across reload; deep link opens ticket; spur renders only on non-KV days; reduced motion; offline fallback banner.

## 8. Rollout

1. Migration `0002_events.sql` + Worker endpoints + tests.
2. Hong sets `EVENTS_INGEST_TOKEN` via `wrangler secret put`; deploy.
3. OpenClaw `dry_run` pushes until rejections are understood; then first real push.
4. Build `events-src/`, add `events.hong.build` custom-domain route, deploy.
5. Optional later: link from hong.build (nav or hackathon guide).

## 9. Open items

- Final product name (working name **Builder Line**).
