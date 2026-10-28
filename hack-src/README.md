# Hackathon field manual

Served at `hong.build/hack/`. A Vite + React app that builds into `../public/hack/`, so the main Next export ships it.

- Content lives in `src/data/` (`qa.ts`, `playbook.ts`, `resources.ts`, `guide.ts`).
- Styling reuses the hong.build tokens (`src/index.css`), so keep the two in step.
- Q&A upvotes go through `/api/qa-votes`, served by the site's Worker (`../worker/index.ts`) with D1.

```bash
npm ci
npm run build   # writes ../public/hack/
```

Then build and deploy the site from the repo root (`npm run build && npx wrangler deploy`).
