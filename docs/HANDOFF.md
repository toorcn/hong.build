# Handoff — hong.build narrative journey

For the next agent. Read this before touching the scene.

## What this is

A personal site that is **one continuous scroll journey — a walk through
eleven rooms of a 3D fragment cloud** — not a portfolio with pages. The
thesis: *nothing here means anything until you find the angle.* 7,000
fragments are split across eleven chapters of Hong Bing's life; scrolling
walks the camera along a winding path from room to room, and each room's
dust gathers into that chapter's silhouette as you arrive. Dragging looks
around freely; release springs back to the authored angle ("hybrid option
A" — a deliberate, confirmed product decision).

Stack: Next.js 16 App Router (Turbopack), React 19, R3F 9 + three 0.185,
Tailwind v4, Zustand 5, sharp (build-time rasterization), MDX for case
studies, WebAudio-synthesized UI sounds (no assets).

## The three systems (and how they interlock)

### 1. The journey (`lib/story.ts` — single source of truth)

- `storyT` ∈ [0,1] is the journey position, driven by window scroll over a
  `BEATS.length * 100vh` spacer (`components/story-spine.tsx` →
  `useStoryStore.storyT`).
- Each beat: authored camera pose (az/el/distance), a silhouette id, two
  lines of copy (`line` lands on resolve, `turn` lands during dissolve),
  optional detail route.
- **Beats are NOT evenly spaced** — `BEAT_T` (11 entries, gaps .20 then
  shrinking to .08) mirrors real elapsed time (four quiet years get the
  longest stretch). `goToBeat` and the chapter rail read `beatT()`.
  `storyPosition(t)` normalizes `mix` per segment; `resolveAmount(t)` is 1
  at a beat, 0 mid-segment; `spinePose(t)` smoothstep-interpolates poses.
- Content routes map back to beats via `beatForRoute(pathname)`. Opening a
  route "holds" that beat: the rig flies to its pose, keeps its silhouette
  resolved behind the scrim, dollies in (`PANEL_*` consts in lab-rig), and
  `originT` in story-store lets the spine restore your place on return.

### 2. The cloud (`components/lab-cloud.tsx` + `public/fragments.bin`)

- One pool of 7,000 fragments, each with a single **home** chapter — there
  is no morph. `BEAT_ALLOCATIONS` in story.ts splits the pool per chapter;
  `ROOMS` places each chapter's room along the walk. A fragment lives as
  dust in its room's shell, gathers into its silhouette as the camera
  nears, and relaxes back toward the walls once the walk moves on.
  `components/lab-path.tsx` draws the dust thread the camera walks.
- `fragments.bin` v3 layout: header(magic, version, count, beats) then
  `targets[count*3]` + `dust[count*3]` + `seeds[count]` + `homes[count]`,
  all f32. Generated offline by `scripts/generate-fragments.ts`
  (rasterizes `assets/silhouettes.ts` with sharp; `fidelity(t)` scales the
  depth jitter so early chapters scatter and late ones set tight).
  **Always regenerate after changing BEATS, ROOMS or silhouettes:
  `npm run fragments`.**
- Some silhouettes are hand-drawn charts of real data (06: committee terms;
  09: entries per year from `content/awards.ts`). They don't update
  themselves — redraw them when the data changes.
- Per-frame values NEVER go through React: rig writes `mixRef/resolveRef/
  dimRef/motionScaleRef`, cloud reads them in `useFrame`. Zustand only sees
  discrete changes (active beat).

### 3. COLD START (`lib/entrance.ts` + `components/cold-start.tsx`)

First-load entrance (once per session, skipped on deep links/returns):
boot → load (real streamed bytes from `loadFragments(onProgress)`) →
arrival (fragments ignite) → wrong (held at a useless angle) → snap
(camera finds the angle, wordmark sweeps in L→R) → hold → done.

- Two channels: `entranceSignal` (module singleton, per-frame, read inside
  the Canvas) and `useEntranceStore` (coarse phase/bytes for DOM).
- `ENTRANCE_BOOT_SCRIPT` runs inline in `<head>` to hide chrome pre-paint —
  if you add a CSP, it needs a nonce.
- The rig checks `entranceSignal.authority > 0` first in `useFrame` and
  yields the camera until handover (`resolveSignal()`).
- `scripts/verify-cold-start.mjs` (`npm run verify:entrance`) drives the
  real page headlessly and asserts phases/skip/fallbacks. Use it.

## Known issues / in-flight work (READ FIRST)

The 6→7 beat issues this section used to list are all resolved: the
journey is now 11 beats, `fragments.bin` is regenerated to match,
`goToBeat` reads `beatT()`, `fidelity(t)` is wired into the generator, and
the COLD START log reads its counts from `lib/generated/fragments-meta.ts`.

Still open:

1. **Draft content.** Case studies (`content/projects/*.mdx`) and
   `ABOUT_FACTS` in `content/site.ts` were drafted from LinkedIn and are not
   yet confirmed by the owner.
2. **Counts in copy are hand-written.** Chapter 09's line and the about
   page quote event/result totals that `content/awards.ts` computes. When
   the run log changes, update both and redraw silhouette 09.
3. **`NARRATIVE_HANDOFF.md` is historical** — it briefs the 7-beat rewrite
   that has since landed and been superseded by the 11-beat walk.

## How to validate (this environment)

- `npx tsc --noEmit` and `npm run build` — both must be clean (build
  prerenders all routes and catches most wiring errors deterministically).
- **Sandbox blocks binding dev-server ports**: run
  `nohup npm run dev > /tmp/next-dev.log 2>&1 < /dev/null & disown` with
  `required_permissions: ["all"]`.
- **Headless screenshots**: puppeteer is a devDependency; Chromium binaries
  are cached at `~/.cache/puppeteer/chrome-headless-shell/mac_arm-*/chrome-headless-shell-mac-arm64/chrome-headless-shell`.
  If npm tries to re-download the browser it will hang — reinstall with
  `PUPPETEER_SKIP_DOWNLOAD=1 npm i -D puppeteer`. Drive it with
  `executablePath` pointed at the cached binary and
  `--use-angle=swiftshader --enable-unsafe-swiftshader`. Arc does NOT work
  headless (hangs); don't try. Screenshots land in `public/preview/`.
- CPU legibility proofs (no GPU): `scripts/render-walk-checks.ts` (`npm run check:walk`) renders
  each beat + a dissolve midpoint from `fragments.bin` — run this BEFORE
  browser testing when touching the generator.

## Tuning knobs

- Feel of drag/spring: `DRAG_SPEED`, `EL_LIMIT`, the `0.94` spring and
  damping `k`/`kSlow` in `components/lab-rig.tsx`.
- Gather character: room sizes in `ROOMS` (lib/story.ts), dust-shell
  spread (`room.radius * …`) in `scripts/generate-fragments.ts`, the
  stagger uniforms (`uStaggerAxis`/`uStaggerSpread`) in
  `components/lab-cloud.tsx`, aberration in `lab-effects.tsx`.
- Entrance pacing: `ENTRANCE_TIMING`, `WRONG_ANGLE`, `RESOLVE_FROM/TO`,
  `OVER_CONTRACT`, `SWEEP_SPREAD` in `lib/entrance.ts`.
- Beat rhythm: `BEAT_T` gaps and per-beat camera poses in `lib/story.ts`
  (regenerate fragments after pose changes).

## Content state

Case studies (`content/projects/*.mdx`) and `ABOUT_FACTS` in
`content/site.ts` were drafted from LinkedIn and are **DRAFT — confirm with
the user before treating as final**. Awards live in `content/awards.ts`.
The 11-beat copy in story.ts (`line`/`turn`) is authored and intentional;
preserve its voice (short, plain, past-tense claims).

## Don't regress

- Never `Date.now()` in render paths; never per-frame React state in the
  Canvas (use refs / the `entranceSignal` pattern).
- The `LabFallback`/`NarrativeFallback` no-WebGL path and reduced-motion
  path (resolve pinned to 1, no travel dissolve) must keep working —
  `JourneyOverlays`/`WebglSpacer` gate on the WebGL capability probe.
- Keep `fragments.bin` version checks in `lib/fragments.ts`; bump `version`
  if the layout changes.
- `suppressHydrationWarning` on `<html>` exists because the boot script
  mutates `data-entrance` — don't remove it.
