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
