# Handoff — hongbing.dev narrative journey

For the next agent. Read this before touching the scene.

## What this is

A personal site that is **one continuous scroll journey through a single
morphing 3D fragment cloud** — not a portfolio with pages. The thesis:
*nothing here means anything until you find the angle.* 6,000 fragments sit
in a void; scrolling flies the camera along an authored spine, and at each
story beat the cloud dissolves to noise and re-forms as a silhouette tied
to that chapter of Hong Bing's life. Dragging looks around freely; release
springs back to the authored angle ("hybrid option A" — a deliberate,
confirmed product decision).

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
- **Beats are NOT evenly spaced** — `BEAT_T = [0, .26, .44, .6, .74, .88, 1]`
  mirrors real elapsed time (four quiet years get the longest dissolve).
  `storyPosition(t)` normalizes `mix` per segment; `resolveAmount(t)` is 1
  at a beat, 0 mid-segment; `spinePose(t)` smoothstep-interpolates poses.
- Content routes map back to beats via `beatForRoute(pathname)`. Opening a
  route "holds" that beat: the rig flies to its pose, keeps its silhouette
  resolved behind the scrim, dollies in (`PANEL_*` consts in lab-rig), and
  `originT` in story-store lets the spine restore your place on return.

### 2. The cloud (`components/lab-cloud.tsx` + `public/fragments.bin`)

- One pool of 6,000 fragments. Each carries per-beat resolved targets
  (`aTarget0..N`), a dissolve noise vector, and a seed. The custom shader
  morphs between the two nearest beats by `uMix`, mixes in `aNoise` at
  midpoints (dissolve→reform is THE signature transition), staggers per
  fragment, swells/accent-colors by `uResolve`, and dims via `uDim` when a
  reading panel opens.
- `fragments.bin` v2 layout: header(magic "FRAG", version=2, count, beats)
  then `targets[beats*count*3] f32` + `noise[count*3] f32` + `seeds[count]`.
  Generated offline by `scripts/generate-fragments.ts` (rasterizes
  `assets/silhouettes.ts` with sharp, unprojects through each beat camera
  with ±3.4 depth jitter). **Always regenerate after changing BEATS or
  silhouettes: `npm run fragments`.**
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

The working tree has **uncommitted changes to `lib/story.ts`** — a 6→7 beat
rewrite with real biography (HG748 Minecraft plugin → four quiet years →
five lost hackathons → mentored win → Top 1s → seven committees → ASEAN/500
Global → "now"). It is **incomplete**:

1. **`fragments.bin` and `lib/generated/fragments-meta.ts` are still the
   6-beat build.** `tsc` passes, but at runtime the 7th beat (`id: 6`, the
   HONG BING wordmark finale) reads a nonexistent `aTarget6` block — the
   finale will silently render as beat 5's silhouette. Fix:
   `npm run fragments` (silhouettes 5–8 already exist in
   `assets/silhouettes.ts`, so the generator has everything it needs),
   then sanity-render with `scripts/render-morph-checks.ts`.
2. **`useStoryStore.goToBeat` still assumes even spacing**
   (`t = beat / (BEAT_COUNT - 1)`). With uneven `BEAT_T` it scrolls chapter
   dots to the wrong positions. It should use `beatT(beat)` from story.ts
   (and BEAT_T-scaled scroll math). ChapterRail and the mobile chapter
   strip both call it.
3. **`fidelity(t)` is exported but unwired** — meant to make beat 0 render
   coarse/blocky and sharpen through the journey ("the rendering technique
   narrates the growth"). No `uFidelity` uniform exists yet. Either
   implement it in the shader (e.g. quantize `gl_PointSize`/positions early)
   or drop the export.
4. The COLD START status log hardcodes "6000 fragments · 6 beats" — update
   to 7 after regenerating.

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
- CPU legibility proofs (no GPU): `scripts/render-morph-checks.ts` renders
  each beat + a dissolve midpoint from `fragments.bin` — run this BEFORE
  browser testing when touching the generator.

## Tuning knobs

- Feel of drag/spring: `DRAG_SPEED`, `EL_LIMIT`, the `0.94` spring and
  damping `k`/`kSlow` in `components/lab-rig.tsx`.
- Dissolve character: noise radius in `scripts/generate-fragments.ts`
  (shell r 3.5–8), `aNoise * dissolve * 0.9` and stagger `0.35` in the
  vertex shader, aberration `0.0038` in `lab-effects.tsx`.
- Entrance pacing: `ENTRANCE_TIMING`, `WRONG_ANGLE`, `RESOLVE_FROM/TO`,
  `OVER_CONTRACT`, `SWEEP_SPREAD` in `lib/entrance.ts`.
- Beat rhythm: `BEAT_T` gaps and per-beat camera poses in `lib/story.ts`
  (regenerate fragments after pose changes).

## Content state

Case studies (`content/projects/*.mdx`) and `ABOUT_FACTS` in
`content/site.ts` were drafted from LinkedIn and are **DRAFT — confirm with
the user before treating as final**. Awards live in `content/awards.ts`.
The 7-beat copy in story.ts (`line`/`turn`) is authored and intentional;
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
