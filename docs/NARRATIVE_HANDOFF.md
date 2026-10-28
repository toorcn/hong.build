# Narrative Rewrite — Handoff Brief

**Status:** design agreed, not implemented. The code in §5 was written against this
repo, passed `npm run typecheck` and `npm run fragments`, then was reverted so a
coding agent could land it deliberately. Treat it as verified-but-unlanded.

**Read first:** `PERSONAL_SITE_CODING_BRIEF.md` (the original creative brief) — but
see §1.1, one of its core premises has been retired by the owner.

---

## 1. What changed about the goal

### 1.1 This is no longer a client-acquisition site

`PERSONAL_SITE_CODING_BRIEF.md` states *"The goal is to attract clients."* The owner
has explicitly retired that: **"im not looking for client, i just want the site to be
about myself. no agenda in particular."**

Consequences — these are now wrong, not merely off-tone:

| Location | Current | Why it's wrong |
|---|---|---|
| `app/contact/page.tsx:14` | "Have an unusual interface in mind?" | pitch to a buyer |
| `app/work/[slug]/page.tsx:116` | "Build something like this →" (accent CTA button) | sales CTA on every case study |
| `content/site.ts:13` | `availability: "Open to select freelance & collab, Q4 2026"` | availability pitch |
| brief acceptance criteria | "at least three projects reachable", "contact reachable from every state" | client-funnel requirements |

Losing the client goal is **freeing**. A client site has to filter the owner down to
one legible offer, which is why the current build hides the ice skating club, the
anime society, and the counselling work. A site about the person keeps all of it,
because the range *is* the subject.

### 1.2 What the site is instead

A first-person, chronological, scroll-driven story. No agenda, no funnel. The
measure of success is whether a stranger reaches the end feeling like they met
someone specific.

---

## 2. Verified facts — the source of truth

Everything here was confirmed by the owner directly or fetched from a public API.
**Do not embellish past this. Three earlier narrative drafts were killed for
inventing connective tissue.**

### 2.1 Age 12 — the Minecraft chapter (fetched, high confidence)

Source: [Spiget API](https://spiget.org/) — SpigotMC author `Hg748`, id `398416`.
(`spigotmc.org` itself 403s on automated fetches; the API does not.)

| Plugin | Released | Downloads | Rating | Size |
|---|---|---|---|---|
| Maintenance — Whitelist Replacement, GUI Control Panel | 2017-12-08 (updated 12-15) | **1,248** | 5.0 / 5 (2 votes) | 18.7 KB |
| SpawnerChunks — Spawner Limiter, Upgradeable | 2017-12-16 | **347** | — | 15.9 KB |

- **1,595 total downloads.** Tested against Minecraft 1.8–1.12.
- Both resources link to a PayPal for **"Hyzon Network"**. ⚠️ Unconfirmed whether
  this was the owner's own server — see §6.
- He shipped an *update* one week after release, i.e. there were real users.
- Motivation, in his words: he was playing Minecraft, wanted to control who got
  into his server, and learned Java to do it.
- **This chapter then stopped.** It is not the start of a continuous career.

### 2.2 2018 → 2021 — quiet

Owner, twice: *"nothing much happened."* Take this literally. There is no code, no
competition, nothing on the record between Dec 2017 and Oct 2022.

### 2.3 Oct 2022 → Jun 2026 — the run

30 events. Full log with months, orgs and results is in §5.3 (rebuilt `awards.ts`).
Derived counts, computed from that file:

```
events entered .......... 30
own placements .......... 18
produced nothing ........ 11
won outright ............  6
entries per year ........ 2022:2  2023:4  2024:8  2025:12  2026:4
```

**The three facts that matter most, and that the current site omits entirely:**

1. **The first five entries produced no placement at all.** Oct 2022 → Oct 2023.
2. **The sixth result wasn't his.** Nov 2023, Sime Darby Young Innovators Challenge
   National Championship — he *mentored* team INSLABBY to the win. He coached
   someone else across the line roughly a year before placing himself.
3. **First win of his own: Oct 2024**, UCSI Cybersecurity — two years after the
   first entry.

The venues also scale on their own without ever being announced: Taylor's →
UM / UITM / IIUM / UCSI national → ASEAN → HackHarvard, Macau, Singapore, OpenAI,
500 Global.

### 2.4 The pivot — Aug 2025

Owner's words: *"after winning student champion of the asean ai summit buildathon,
Managing Partner of 500 Global invited us as they see us young builders as the
future/unicorns."*

- Event: ASEAN AI Malaysia Summit (aaims25) — AI CodeFest & AI Buildathon.
  Ministry of Digital & AI Tinkerer. Result: **Student Champion**.
- Outcome: invited into the **500 Global AI residency**. Note "**us**" — plural,
  it was a team.
- AI Hackerdorm was co-founded the same month (Aug 2025).

### 2.5 The seven clubs — 2024 onward, all genuine interests

Owner on all seven: *"all of them were an interest of mine."* He also pushed back
explicitly on being framed as a detached organiser: *"of course im involved im not
just make it happen im also part of it."* **Do not write him as a professional
committee-holder.** He is a participant who ends up building.

| Org | Role | Dates |
|---|---|---|
| Taylor's Anime Society | Secretary | Feb 2024 – Nov 2024 (10 mos) |
| Taylor's Anime Society | Vice President | Jul 2024 – Jan 2025 (7 mos) |
| Taylor's Anime Society | President | Jan 2025 – Dec 2025 (1 yr) |
| Taylor's Esports Club | Developer | Apr 2024 – Oct 2025 (1 yr 7 mos) |
| Taylor's Elite Valorant | Coach | Aug 2024 – Nov 2024 (4 mos) |
| Taylor's Student Welfare | Student Immersion Programme — Student Leader | Sep 2024 – Jul 2025 (11 mos) |
| Taylor's Student Welfare | SWAT Ambassadors — Treasurer | Jul 2025 – present |
| FamBiz Club (Centre for Family Business) | Vice President | Feb 2025 – Oct 2025 (9 mos) |
| Counselling Services (CCS) | Mental Health Ambassador | Apr 2025 – Dec 2025 (9 mos) |
| Counselling Services (CCS) | Peer Counselling Buddy (PCB) | Dec 2025 – Feb 2026 (3 mos) |
| Luminice Ice Skating Club | Co-Founder & Treasurer | Sep 2025 – present |
| AI Hackerdorm | Co-Founder & Vice-President | Aug 2025 – present |

**The overlaps are a character note worth using:** the Anime Society secretary, VP
and president terms run into each other (Feb 2024 → Dec 2025). Six roles started
in 2025 alone. He does not finish one thing before starting the next.

### 2.6 Also on the record

- **YTL AI Labs** — AI Engineer (internship), Apr 2026 – present.
- **KiyokoCon 2025** — founder & organising chairman. 1,700 attendees, 50 booths,
  35 partners. Event of the Year 2025 Gold, Taylor's Student Development.
- **AI Hackerdorm** — 500+ students, 19 campuses. Co-organised Cursor × Anthropic
  Hackathon Malaysia 2025 ($410k USD).
- **Tack** (tack.im) — real-time AI meeting moderator. Launched on Product Hunt.
- Study: computer science & psychology, Taylor's University.
- First Malaysian student showcase @ ACM SIGGRAPH Asia.
- ⚠️ Unverified / needs owner review: the SF research lab (`role.research` in
  `content/site.ts`), Polytera, and how much can be said publicly about YTL AI Labs.
  See the existing `REVIEW BEFORE LAUNCH` comment at `content/site.ts:30`.

### 2.7 Corrected numbers — the current site is wrong

- `lib/story.ts:63` says **"Nineteen hackathons"** → it's **30 events**.
- `content/awards.ts` `WIN_COUNT` drives a "19 wins" headline on `/notes` → the
  honest split is **18 placements, 6 outright wins, 11 that produced nothing**.
- `content/awards.ts` is missing **all of 2022 and 2023** and most of 2024,
  including every no-placement entry.

---

## 3. Diagnosis of the current build

### 3.1 What is genuinely good — keep it

1. **The metaphor is load-bearing, not decorative.** 6000 fragments resolving into
   form, keyed to the thesis *"meaning is found in the absurdity of our perception."*
2. **`resolveAmount()` in `lib/story.ts:137`** makes the cloud legible only at beat
   centers and noise between them. That is real narrative rhythm, and almost no
   portfolio has any.
3. **The COLD START "wrong angle" beat** (`components/cold-start.tsx:303`) is the
   best storytelling in the build. It teaches the entire interaction model in ~1.5s
   with two words and no tutorial. Do not touch it.
4. **Chrome discipline** — mono microcopy, truthful byte counts in the loader, a
   real skip affordance, restrained accent use.
5. **The fallback path** (`components/narrative-fallback.tsx`) and the
   reduced-motion / no-WebGL branches are properly thought through.

### 3.2 What is broken

**a) The beats are a sitemap wearing a story costume.**
`ORIGIN / WORK / PROOF / PROCESS / SIGNALS / CONTACT` is a taxonomy of *categories
of information*, not a sequence of *events*. Test: shuffle beats 1–4 into any order
and nothing breaks. No beat opens a question the next beat answers.

**b) Every caption is a closing summary, not an opening.**
"Three things I built that taught me the most." Good line — but it terminates. It
creates no pull toward the next beat.

**c) The best material is buried post-click.**
`content/projects/ai-hackerdorm.mdx` opens with *"Two years before we started, I
knew nothing about tech."* That's a story's first sentence, three clicks deep.
Meanwhile beat 0 — the front door, immediately after an entrance that announced
"0 meaning / wrong angle" — says **"AI engineer & builder, Kuala Lumpur."** The
entrance promises a thesis about perception; the journey delivers a business card.

**d) Every beat's payoff is leaving.** The immersive layer is a beautiful table of
contents. Tension builds, then releases by navigating away.

**e) ~40% of journey duration is narratively empty.** The dissolve between beats —
which the concept says is the interesting part — carries no words at all.

**f) The name resolves before anything has been said.** Beat 0 resolves into the
HONG BING wordmark. Identity is announced, not earned.

**g) No time axis.** A story about a two-year detonation exposes zero dates.
`content/awards.ts` has every year and the journey ignores all of them.

**h) Two silhouettes are meaningless.** `lib/story.ts:59` admits PROOF and SIGNALS
share the waveform. The window frame (WORK) and `@` (CONTACT) are UI clipart.
Spending 6000 particles to draw a window-chrome icon undercuts the whole conceit.

**i) No vulnerability anywhere in the journey layer.** The honest writing — *"some
of my worst came from throwing everything at the wall,"* *"still figuring out the
best way to work with all of this"* — is all post-click.

---

## 4. Target design

### 4.1 The organising idea

**He doesn't stop at participating.**

He played Minecraft and ended up writing plugins for it. He joined the esports club
and ended up being its developer. He joined clubs and ended up co-founding two of
them. Being genuinely into the thing is the *precondition*; the building is what
happens when being into it runs out of room.

This is deliberately thinner than the grander theses that were tried and rejected.
It requires no invented continuity, and it puts him *inside* the rooms rather than
behind them.

> **Rejected framings — do not reintroduce:**
> - *"Two years ago I couldn't read a line of code."* — factually false (shipping
>   at 12) and the clichéd version.
> - *"Nine years building instruments for rooms."* — stitches a 2017 spike onto a
>   2024 run to fake a continuous career. Owner rejected it.
> - *"He never joined the activity, he joined the part that holds it up."* — makes
>   him a detached treasurer. Owner explicitly rejected it.

### 4.2 Non-uniform beat spacing — the key mechanic

Beats are currently evenly spaced (`lib/story.ts:106`, `beatT = id / (BEAT_COUNT-1)`).
**Make the spacing the timeline.** Gaps shrink as you scroll because the life
accelerated. One long silence early (the four quiet years), then a quickening.

```
00 ▓                                          dec 2017 — age 12
                                               ↓ the long dark: 2018–2021.
                                                 No caption. The only earned
                                                 silence in the piece.
01                    ▓                       oct 2022 — the first five
02                          ▓                 nov 2023 — someone else's win
03                              ▓             2024 — the loop
04                                  ▓         2024–25 — all of it at once
05                                      ▓     aug 2025 — the room got bigger
06                                        ▓   now — HONG BING
```

`resolveAmount()` needs **no change** — because `mix` is normalised per segment, a
long segment automatically becomes a longer, slower dissolve. The four quiet years
get the longest dissolve in the piece, which is exactly the intent.

### 4.3 Two lines per beat — the interstitials carry the narration

Replace `caption: string` with:

- **`line`** — the claim. Holds the frame while the cloud is resolved.
- **`turn`** — the consequence. Takes over as the cloud dissolves, handing off to
  the next beat.

Both crossfade against `resolveAmount`, so copy and geometry are driven by the same
number and can never drift. This converts the dead 40% into the narration, and it
makes the no-WebGL fallback read as a real essay instead of six icons and six
sentences.

### 4.4 The journey, end to end

| # | Label | When | Silhouette | Route |
|---|---|---|---|---|
| 00 | HG748 | dec 2017 | 5 · voxel gate | — |
| 01 | FIRST FIVE | oct 2022 – oct 2023 | 6 · five tally marks | — |
| 02 | SOMEONE ELSE'S WIN | nov 2023 | 7 · the hand-off | — |
| 03 | THE LOOP | 2024 | 2 · recursion loop *(exists)* | `/process` |
| 04 | ALL OF IT AT ONCE | 2024 – 2025 | 8 · seven overlapping rings | `/about` |
| 05 | THE ROOM GOT BIGGER | aug 2025 – 2026 | 3 · run plotted by year | `/notes` |
| 06 | HONG BING | now | 0 · wordmark *(exists)* | `/contact` |

**00 · HG748**
> I was twelve, playing Minecraft, and I wanted to control who got into my server.
> So I learned Java.
>
> *(dissolve)* Two plugins. 1,595 strangers ran them. Then I stopped for four years.

**01 · FIRST FIVE**
> First hackathon, October 2022. Then four more.
>
> *(dissolve)* No placement. Five times.

**02 · SOMEONE ELSE'S WIN**
> The sixth one I didn't compete in. I mentored a team called INSLABBY, and they
> took the national championship.
>
> *(dissolve)* I could see it before I could do it.

**03 · THE LOOP** → `/process`
> think. build. test. break. correct. repeat.
>
> *(dissolve)* Ten months later, my own Top 1. Then another one in December.

**04 · ALL OF IT AT ONCE** → `/about`
> Anime society. Esports. Family business. Counselling. Ice skating. Student
> welfare. Seven committees, and I meant all of them.
>
> *(dissolve)* Plus a 1,700-person convention and 500 students across 19 campuses.
> I never finished one thing before starting the next.

**05 · THE ROOM GOT BIGGER** → `/notes`
> Student champion at the ASEAN AI Summit buildathon. A managing partner from
> 500 Global was watching, and pulled us into the residency.
>
> *(dissolve)* Then HackHarvard. Macau. Singapore. OpenAI. Nobody announced the
> venues getting bigger — they just did.

**06 · HONG BING** → `/contact`
> Thirty events. Eleven of them gave me nothing. Still entering.
>
> *(dissolve)* Say hi.

Read 00 → 06 straight through: it argues, it has a fuse and a detonation, and it
earns the name at the end instead of announcing it at the start. Shuffle any two
beats and it breaks — the test the current spine fails.

### 4.5 Optional, not yet implemented

- **Climbing fidelity.** `fidelity(t)` is included in §5.1 but **not yet wired into
  the shader**. Intent: beat 00 resolves coarse and blocky — honest to an 18 KB jar
  written by a twelve-year-old — and the cloud sharpens across the journey, so the
  rendering technique narrates the growth. Wire into point size / jitter /
  effective count in `components/lab-cloud.tsx`.
- **A year counter during the long dark.** The 2018–2021 stretch is ~2 screens of
  near-empty scroll. A faint mono `// 2018 … 2021` ticking up would keep it reading
  as deliberate silence rather than a broken page. Recommended.
- **Earned resolution at one beat.** Require a small orbit/drag to find the angle at
  a single beat, with a visible hint and auto-resolve after ~4s. Turns the thesis
  into a mechanic. One beat only — more violates the brief's "usability must not be
  mysterious."
- **In-world shallow reveals** at beats 05/06 — a few project rows or event ticks
  readable without leaving, with the case study as a second step.

---

## 5. Implementation

Six files change plus one regeneration. All of the below typechecked clean and the
generator ran successfully before being reverted.

### 5.1 `lib/story.ts` — full replacement

```ts
/**
 * The narrative spine — single source of truth for the scroll journey.
 *
 * storyT runs 0..1 across the whole journey. Beats are stops along it, and
 * they are deliberately NOT evenly spaced: the gaps mirror real elapsed
 * time. One spark at twelve, four quiet years, then everything at once.
 * The gaps shrink as you scroll because the life accelerated.
 *
 * Each beat owns an authored camera pose, a silhouette the fragment cloud
 * resolves into, and two lines: `line` lands when the cloud resolves,
 * `turn` lands as it dissolves and hands off to the next beat. The
 * interstitials carry the narration rather than being dead scroll.
 */

export const BEAT_COUNT = 7;

/**
 * Beat positions along storyT. Uneven on purpose — see the note above.
 * Gaps: .26 .18 .16 .14 .14 .12 — monotonically tightening.
 *
 * The first gap is the long one: Dec 2017 → Oct 2022, when nothing was
 * shipped and nothing was entered. It is the only silence in the piece
 * that is earned, so it gets the most room.
 */
const BEAT_T = [0, 0.26, 0.44, 0.6, 0.74, 0.88, 1.0] as const;

export interface Beat {
  id: number;
  /** Machine label for chrome. */
  code: string;
  /** Display label. */
  label: string;
  /** Rough date this beat sits at, for the chrome's time readout. */
  when: string;
  /** The silhouette id in silhouettes.ts this beat resolves to. */
  silhouette: number;
  /** Authored camera azimuth (deg), elevation (deg), distance. */
  azimuthDeg: number;
  elevationDeg: number;
  distance: number;
  /** The claim. Lands as the cloud resolves. */
  line: string;
  /** The consequence. Lands as the cloud dissolves toward the next beat. */
  turn: string;
  /** Optional route for the "read more" detail layer. */
  route?: string;
  /** Route label. */
  routeLabel?: string;
}

export const BEATS: readonly Beat[] = [
  {
    id: 0,
    code: "00",
    label: "HG748",
    when: "dec 2017",
    silhouette: 5, // voxel gate — coarse on purpose
    azimuthDeg: 0,
    elevationDeg: 10,
    distance: 11,
    line: "I was twelve, playing Minecraft, and I wanted to control who got into my server. So I learned Java.",
    turn: "Two plugins. 1,595 strangers ran them. Then I stopped for four years.",
  },
  {
    id: 1,
    code: "01",
    label: "FIRST FIVE",
    when: "oct 2022 — oct 2023",
    silhouette: 6, // five marks, none struck through
    azimuthDeg: 52,
    elevationDeg: 14,
    distance: 12,
    line: "First hackathon, October 2022. Then four more.",
    turn: "No placement. Five times.",
  },
  {
    id: 2,
    code: "02",
    label: "SOMEONE ELSE'S WIN",
    when: "nov 2023",
    silhouette: 7, // the hand-off
    azimuthDeg: 108,
    elevationDeg: 8,
    distance: 12,
    line: "The sixth one I didn't compete in. I mentored a team called INSLABBY, and they took the national championship.",
    turn: "I could see it before I could do it.",
  },
  {
    id: 3,
    code: "03",
    label: "THE LOOP",
    when: "2024",
    silhouette: 2, // recursion loop
    azimuthDeg: 160,
    elevationDeg: 16,
    distance: 11,
    line: "think. build. test. break. correct. repeat.",
    turn: "Ten months later, my own Top 1. Then another one in December.",
    route: "/process",
    routeLabel: "how I build",
  },
  {
    id: 4,
    code: "04",
    label: "ALL OF IT AT ONCE",
    when: "2024 — 2025",
    silhouette: 8, // seven overlapping rings
    azimuthDeg: 212,
    elevationDeg: 12,
    distance: 12,
    line: "Anime society. Esports. Family business. Counselling. Ice skating. Student welfare. Seven committees, and I meant all of them.",
    turn: "Plus a 1,700-person convention and 500 students across 19 campuses. I never finished one thing before starting the next.",
    route: "/about",
    routeLabel: "the human",
  },
  {
    id: 5,
    code: "05",
    label: "THE ROOM GOT BIGGER",
    when: "aug 2025 — 2026",
    silhouette: 3, // the run, plotted by year
    azimuthDeg: 268,
    elevationDeg: 10,
    distance: 12,
    line: "Student champion at the ASEAN AI Summit buildathon. A managing partner from 500 Global was watching, and pulled us into the residency.",
    turn: "Then HackHarvard. Macau. Singapore. OpenAI. Nobody announced the venues getting bigger — they just did.",
    route: "/notes",
    routeLabel: "the run log",
  },
  {
    id: 6,
    code: "06",
    label: "HONG BING",
    when: "now",
    silhouette: 0, // the wordmark — earned, not announced
    azimuthDeg: 330,
    elevationDeg: 12,
    distance: 10,
    line: "Thirty events. Eleven of them gave me nothing. Still entering.",
    turn: "Say hi.",
    route: "/contact",
    routeLabel: "say hi",
  },
] as const;

/** storyT position of a beat. Uneven — reads from BEAT_T. */
export function beatT(id: number): number {
  return BEAT_T[Math.min(Math.max(id, 0), BEAT_COUNT - 1)] ?? 0;
}

/**
 * The beat a content route belongs to, or null on the journey itself.
 * Longest match wins so /work/tack still maps to its beat — the scene
 * holds that beat's silhouette while its detail layer is open.
 */
export function beatForRoute(pathname: string): number | null {
  let best: Beat | null = null;
  for (const b of BEATS) {
    if (!b.route) continue;
    if (pathname !== b.route && !pathname.startsWith(`${b.route}/`)) continue;
    if (!best || b.route.length > best.route!.length) best = b;
  }
  return best?.id ?? null;
}

/**
 * Continuous beat position from storyT: the segment you're in and how far
 * through it you are. Walks BEAT_T rather than assuming even spacing, so
 * `mix` stays normalised 0..1 per segment however long that segment is.
 */
export function storyPosition(t: number): { from: number; to: number; mix: number } {
  const clamped = Math.min(Math.max(t, 0), 1);

  // Find the segment. BEAT_COUNT is small enough that a linear walk is
  // cheaper than the branch-heavy binary search it would replace.
  let from = 0;
  for (let i = BEAT_COUNT - 2; i >= 0; i--) {
    if (clamped >= BEAT_T[i]!) {
      from = i;
      break;
    }
  }
  const to = Math.min(from + 1, BEAT_COUNT - 1);

  const a = BEAT_T[from]!;
  const b = BEAT_T[to]!;
  const span = b - a;
  const mix = span > 0 ? Math.min(Math.max((clamped - a) / span, 0), 1) : 1;

  return { from, to, mix };
}

/**
 * How "resolved" the cloud is at storyT — 1 at a beat center, 0 midway
 * between two beats. Because `mix` is normalised per segment, a long
 * segment simply means a longer, slower dissolve. The four quiet years
 * get the longest one in the piece, which is the point.
 */
export function resolveAmount(t: number): number {
  const { mix } = storyPosition(t);
  return Math.abs(mix - 0.5) * 2; // 1 at beats, 0 at the midpoint
}

/**
 * Fidelity of the resolve, 0..1, climbing across the journey. Beat 0 lands
 * coarse and blocky — honest to an 18 KB jar written by a twelve-year-old —
 * and the cloud sharpens as the story advances. The rendering technique
 * narrates the growth alongside the copy.
 *
 * NOT YET WIRED. See §4.5 — consume in components/lab-cloud.tsx.
 */
export function fidelity(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1);
  // Eased so the early gain is visible rather than all of it arriving late.
  return 0.35 + 0.65 * clamped * clamped;
}

export interface CameraPose {
  x: number;
  y: number;
  z: number;
}

export function beatPose(b: Beat): CameraPose {
  const az = (b.azimuthDeg * Math.PI) / 180;
  const el = (b.elevationDeg * Math.PI) / 180;
  return {
    x: b.distance * Math.cos(el) * Math.sin(az),
    y: b.distance * Math.sin(el),
    z: b.distance * Math.cos(el) * Math.cos(az),
  };
}

/** Interpolated camera pose along the spine at storyT. */
export function spinePose(t: number): CameraPose {
  const { from, to, mix } = storyPosition(t);
  const a = beatPose(BEATS[from]!);
  const b = beatPose(BEATS[to]!);
  // Smoothstep easing keeps velocity continuous through beats.
  const s = mix * mix * (3 - 2 * mix);
  return {
    x: a.x + (b.x - a.x) * s,
    y: a.y + (b.y - a.y) * s,
    z: a.z + (b.z - a.z) * s,
  };
}
```

### 5.2 `assets/silhouettes.ts` — four new forms, one re-authored

Indices 0–4 keep their positions so nothing shifts. 1 and 4 become unused (the
window frame and the `@`) — keep them, they cost nothing and preserve indices.
**3 is re-authored** from a generic waveform into the actual per-year entry counts.
**5–8 are new.**

```ts
  // 3 · THE RUN — hackathon entries per year, to scale. Derived from
  // BY_YEAR in content/awards.ts: 2022:2 2023:4 2024:8 2025:12 2026:4.
  // The last bar is short because 2026 isn't over. If the log changes,
  // redraw these bars and re-run `npm run fragments`.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <rect x="145" y="673" width="110" height="87"  fill="#fff"/>
    <rect x="295" y="587" width="110" height="173" fill="#fff"/>
    <rect x="445" y="413" width="110" height="347" fill="#fff"/>
    <rect x="595" y="240" width="110" height="520" fill="#fff"/>
    <rect x="745" y="587" width="110" height="173" fill="#fff"/>
    <rect x="120" y="782" width="760" height="16"  fill="#fff"/>
  </svg>`,

  // 5 · HG748 — a gate, built from visible blocks. The first plugin decided
  // who was allowed onto the server. Coarse on purpose: 18 KB, age twelve.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <g fill="#fff">
      <rect x="202" y="202" width="96" height="96"/>
      <rect x="302" y="202" width="96" height="96"/>
      <rect x="402" y="202" width="96" height="96"/>
      <rect x="502" y="202" width="96" height="96"/>
      <rect x="602" y="202" width="96" height="96"/>
      <rect x="702" y="202" width="96" height="96"/>
      <rect x="202" y="302" width="96" height="96"/>
      <rect x="702" y="302" width="96" height="96"/>
      <rect x="202" y="402" width="96" height="96"/>
      <rect x="702" y="402" width="96" height="96"/>
      <rect x="202" y="502" width="96" height="96"/>
      <rect x="702" y="502" width="96" height="96"/>
      <rect x="202" y="602" width="96" height="96"/>
      <rect x="702" y="602" width="96" height="96"/>
      <rect x="202" y="702" width="96" height="96"/>
      <rect x="702" y="702" width="96" height="96"/>
    </g>
  </svg>`,

  // 6 · FIRST FIVE — five tally marks, and nothing crossing them.
  // Five hackathons, no placement.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <g fill="#fff">
      <rect x="180" y="300" width="56" height="400" rx="12"/>
      <rect x="330" y="300" width="56" height="400" rx="12"/>
      <rect x="480" y="300" width="56" height="400" rx="12"/>
      <rect x="630" y="300" width="56" height="400" rx="12"/>
      <rect x="780" y="300" width="56" height="400" rx="12"/>
    </g>
  </svg>`,

  // 7 · SOMEONE ELSE'S WIN — the mark lands in the other bracket. Mentored
  // INSLABBY to a national championship before placing anywhere himself.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <path d="M 258 340 L 148 340 L 148 660 L 258 660" fill="none" stroke="#fff"
      stroke-width="44" stroke-linecap="square"/>
    <rect x="352" y="478" width="196" height="44" fill="#fff"/>
    <polygon points="612,500 536,452 536,548" fill="#fff"/>
    <path d="M 742 340 L 852 340 L 852 660 L 742 660" fill="none" stroke="#fff"
      stroke-width="44" stroke-linecap="square"/>
    <circle cx="800" cy="500" r="68" fill="#fff"/>
  </svg>`,

  // 8 · ALL OF IT AT ONCE — seven rings, overlapping. Seven committees whose
  // terms ran into each other; nothing finished before the next began.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <g fill="none" stroke="#fff" stroke-width="28">
      <circle cx="500" cy="500" r="168"/>
      <circle cx="665" cy="500" r="175"/>
      <circle cx="582" cy="357" r="160"/>
      <circle cx="418" cy="357" r="172"/>
      <circle cx="335" cy="500" r="165"/>
      <circle cx="418" cy="643" r="178"/>
      <circle cx="582" cy="643" r="163"/>
    </g>
  </svg>`,
```

> ⚠️ These are first-pass geometry, verified only as valid SVG that rasterizes and
> samples. **They have not been looked at as rendered point clouds.** Silhouettes 7
> (hand-off) and 8 (overlapping rings) are the risky ones — stroked forms sample
> thinner than filled ones, and 6000 fragments spread over seven ring outlines may
> read as mush. Render checks exist: `scripts/render-checks.ts` and
> `scripts/render-morph-checks.ts`. Expect to iterate.

### 5.3 `content/awards.ts` — full replacement

Merge, not overwrite: the existing file has richer `org` values and project notes
than the owner's raw list, and includes two entries absent from it (KiyokoCon,
Loophole). The version below preserves those and adds the missing 2022–2024 run.

Schema changes: `result` becomes `string | null`, `win: boolean` is dropped in favour
of derived counts, and `month`, `compCode`, `mentored` are added.

```ts
/**
 * The run log — every hackathon and competition entered, Oct 2022 onward,
 * including the ones that produced nothing.
 *
 * The empty results are the point. The first five entries have no placement
 * at all, and the sixth result wasn't his: he mentored INSLABBY to a
 * national championship before he ever placed himself. A wall of wins reads
 * as talent, which nobody relates to. The losses are what make the rest
 * legible.
 *
 * `result: null` means entered, no placement. That is data, not a gap.
 */

export interface Award {
  year: number;
  /** Month or span, lowercase, as it appears in the log. */
  month: string;
  event: string;
  /** Placement, or null for entered-no-placement. */
  result: string | null;
  org?: string;
  /** Competitive programming rather than a build event. */
  compCode?: boolean;
  /** Placement earned by a team he mentored, not competed on. */
  mentored?: boolean;
  /** One-line note for the log. */
  note?: string;
}

export const AWARDS: readonly Award[] = [
  // ── 2026 ──────────────────────────────────────────────────────────────
  {
    year: 2026,
    month: "jun",
    event: "'Sup × OpenAI Hackathon, Singapore",
    result: "Champion — Overall",
    org: "OpenAI, 'Sup, Carousell",
    note: "AUNTIE — trust-first AI copilot for SEA live commerce. 550+ international sign-ups.",
  },
  {
    year: 2026,
    month: "may",
    event: "Beyond Hack 2026, Macau",
    result: "2nd — Innovation & Creativity",
    org: "Beyond Expo",
  },
  {
    year: 2026,
    month: "may",
    event: "OpenAI × January Capital × Jelawang Capital",
    result: "3rd — $5k credits + 1y Pro",
    org: "OpenAI",
  },
  {
    year: 2026,
    month: "mar",
    event: "LotusHacks × HackHarvard",
    result: "Top 5% of 210 teams · 4 track placements",
    org: "LotusHacks & HackHarvard",
    note: "3rd Edtech (Etest Vietnam) · 1st Agora · 1st fal · 1st Exa",
  },

  // ── 2025 ──────────────────────────────────────────────────────────────
  {
    year: 2025,
    month: "oct",
    event: "Vortex XRJam: FuturScape 2025",
    result: "Champion",
    org: "Vortex XR Lab",
    note: "Mindspace — AR spatial organization companion.",
  },
  { year: 2025, month: "oct", event: "Lovable", result: null },
  {
    year: 2025,
    month: "sep",
    event: "ElevenLabs: Sight and Sound Playground",
    result: null,
  },
  {
    year: 2025,
    month: "sep",
    event: "Great Malaysia AI Hackathon 2025",
    result: "Finalist — Top 5 of 550",
    org: "MDEC, AWS, APU",
  },
  {
    year: 2025,
    month: "aug",
    event: "ASEAN AI Malaysia Summit (aaims25)",
    result: "Student Champion",
    org: "Ministry of Digital & AI Tinkerer",
    note: "AI CodeFest & AI Buildathon. A managing partner from 500 Global was watching — the residency invite came out of this room.",
  },
  {
    year: 2025,
    month: "jul",
    event: "iCube IGNITE 2025",
    result: "Finalist",
    org: "iCube International",
  },
  {
    year: 2025,
    month: "jul",
    event: "Top Coders 2025, Taylor's University",
    result: "Top 2 — 1st runner-up",
    org: "Data Science Association",
    compCode: true,
  },
  {
    year: 2025,
    month: "jul",
    event: "FutureHack! A.I. Battlefield",
    result: "Semi-finalist & Speaker",
    org: "Newell",
  },
  {
    year: 2025,
    month: "jul",
    event: "Turboline × IIMS International Hackathon",
    result: "Special Recognition",
    org: "Turboline",
  },
  {
    year: 2025,
    month: "apr–jul",
    event: "ViTrox Tech 4 Good 2025",
    result: "Grand Finalist",
    org: "ViTrox",
  },
  {
    year: 2025,
    month: "jun",
    event: "ImagineHack 2025",
    result: "Best Technical Implementation",
    org: "Taylor's Agents Of Tech",
  },
  {
    // CONFIRM — in the repo already, absent from the master list the owner sent.
    year: 2025,
    month: "—",
    event: "Loophole Hackathon 2025",
    result: "Judges' Favourite",
    org: "Build Club MY",
  },

  // ── 2024 ── the placements start ──────────────────────────────────────
  {
    year: 2024,
    month: "dec",
    event: "Top Coders 2024, Taylor's University",
    result: "Champion — Top 1",
    org: "Data Science Association",
    compCode: true,
  },
  {
    year: 2024,
    month: "nov",
    event: "PayNet PayHack 2024",
    result: "Semi-finalist",
    org: "PayNet",
  },
  { year: 2024, month: "nov", event: "Deriv AI Hackathon", result: null },
  { year: 2024, month: "oct", event: "IIUM I-Hax", result: null },
  {
    year: 2024,
    month: "oct",
    event: "UCSI Hackathon — Cybersecurity Beyond Thinkable",
    result: "Champion — Top 1",
    org: "UCSI & Palo Alto Networks",
    note: "The first one he won himself, two years after the first entry.",
  },
  {
    year: 2024,
    month: "aug",
    event: "Google Workspace Hackathon 2024",
    result: "Finalist — Top 7 of 400 · Popularity Champion",
    org: "GDSC APU",
  },
  {
    year: 2024,
    month: "may",
    event: "UM Programming League National",
    result: null,
    compCode: true,
  },
  { year: 2024, month: "feb", event: "Hilti IT Competition", result: null },

  // ── 2023 ── the only result this year belongs to someone else ─────────
  {
    year: 2023,
    month: "nov",
    event: "Sime Darby Young Innovators Challenge — National Championship",
    result: "Winning team",
    org: "Sime Darby",
    mentored: true,
    note: "Mentored team INSLABBY. Coached someone else across the line a year before getting there himself.",
  },
  {
    year: 2023,
    month: "oct",
    event: "UITM International C-PROM",
    result: null,
    compCode: true,
  },
  {
    year: 2023,
    month: "may",
    event: "Taylor's Agents Of Tech ImagineHack",
    result: null,
  },
  {
    year: 2023,
    month: "jan",
    event: "RHB Get Your Hack On: ASEAN",
    result: null,
    org: "RHB",
  },

  // ── 2022 ── where it starts. Nothing to show for either. ──────────────
  { year: 2022, month: "oct", event: "Hong Leong Bank Hackathon", result: null },
  {
    year: 2022,
    month: "oct",
    event: "UM Odyssey Hackfest",
    result: null,
    note: "The first one.",
  },
] as const;

/** Every event entered. */
export const EVENT_COUNT = AWARDS.length;

/** Entries that produced a placement of his own. */
export const PLACEMENT_COUNT = AWARDS.filter((a) => a.result && !a.mentored).length;

/** Entries that produced nothing. Kept visible on purpose. */
export const NO_PLACEMENT_COUNT = AWARDS.filter((a) => a.result === null).length;

/** Outright event wins — champion or top 1. */
export const CHAMPION_COUNT = AWARDS.filter(
  (a) => a.result && !a.mentored && /champion|top 1/i.test(a.result),
).length;

/** The first year of the run. */
export const FIRST_YEAR = Math.min(...AWARDS.map((a) => a.year));

/**
 * Entries per year, oldest first. Silhouette 3 in assets/silhouettes.ts is
 * drawn from this shape — if these counts change, redraw those bars and
 * re-run `npm run fragments`.
 */
export const BY_YEAR: readonly { year: number; count: number }[] = [
  ...new Set(AWARDS.map((a) => a.year)),
]
  .sort((a, b) => a - b)
  .map((year) => ({ year, count: AWARDS.filter((a) => a.year === year).length }));
```

Verify with:

```bash
npx tsx -e "import {EVENT_COUNT,PLACEMENT_COUNT,NO_PLACEMENT_COUNT,CHAMPION_COUNT,BY_YEAR} from './content/awards.ts'; console.log({EVENT_COUNT,PLACEMENT_COUNT,NO_PLACEMENT_COUNT,CHAMPION_COUNT,BY_YEAR})"
# expect: 30, 18, 11, 6, [2022:2, 2023:4, 2024:8, 2025:12, 2026:4]
```

### 5.4 `components/beat-caption.tsx` — full replacement

Drives both lines off `resolveAmount` instead of tracking `activeBeat` with a
timer, so copy and geometry share one source of truth. Also adds an `sr-only` block
carrying every beat in order — the journey is currently invisible to screen readers
and to anything that can't observe scroll.

```tsx
"use client";

import Link from "next/link";
import { BEATS, resolveAmount, storyPosition } from "@/lib/story";
import { useStoryStore } from "@/lib/story-store";

/**
 * In-world narrative captions, two lines per beat.
 *
 * `line` is the claim — it holds the frame while the cloud is resolved.
 * `turn` is the consequence — it takes over as the cloud dissolves, so the
 * interstitial carries the handoff to the next beat instead of being dead
 * scroll. The two crossfade against `resolveAmount`, which means the copy
 * and the geometry are driven by the same number and can never drift.
 *
 * Long-form reading lives on the detail routes; these stay short.
 */
export function BeatCaption() {
  const storyT = useStoryStore((s) => s.storyT);

  const { from } = storyPosition(storyT);
  const resolved = resolveAmount(storyT);
  const beat = BEATS[from];
  if (!beat) return null;

  // Fully resolved → the claim, at full strength. Fully dissolved → the
  // turn. The dead zone between keeps them from ghosting over each other.
  const claimOpacity = Math.max(0, (resolved - 0.35) / 0.65);
  const turnOpacity = Math.max(0, (0.5 - resolved) / 0.5);

  // The route link only earns its place once the form is legible.
  const linkVisible = resolved > 0.72;

  return (
    <div
      // Revealed last: the resolved mark holds the frame alone for a beat
      // before the journey's copy arrives.
      style={{ "--reveal-delay": "300ms" } as React.CSSProperties}
      className="entrance-hide pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center px-6 pb-24 sm:pb-20"
    >
      <div className="relative w-full max-w-xl text-center">
        {/* The claim. */}
        <div
          className="transition-opacity duration-200"
          style={{ opacity: claimOpacity }}
          aria-hidden={claimOpacity < 0.5}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
            {beat.code} — {beat.label}
            <span className="ml-3 text-type-faint">{beat.when}</span>
          </p>
          <p className="mt-3 text-balance font-display text-xl leading-snug text-type sm:text-2xl">
            {beat.line}
          </p>
          {beat.route ? (
            <Link
              href={beat.route}
              tabIndex={linkVisible ? 0 : -1}
              className="focus-ring pointer-events-auto mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.2em] text-type-dim underline decoration-line underline-offset-4 transition-all duration-300 hover:text-accent hover:decoration-accent"
              style={{ opacity: linkVisible ? 1 : 0 }}
            >
              {beat.routeLabel} →
            </Link>
          ) : null}
        </div>

        {/* The turn, stacked in the same place so nothing reflows. */}
        <p
          className="absolute inset-x-0 top-0 text-balance font-display text-lg leading-snug text-type-dim transition-opacity duration-200 sm:text-xl"
          style={{ opacity: turnOpacity }}
          aria-hidden={turnOpacity < 0.5}
        >
          {beat.turn}
        </p>
      </div>

      {/* Both halves of every beat, in order, for screen readers and for
          anything that can't observe scroll. */}
      <div className="sr-only">
        {BEATS.map((b) => (
          <p key={b.id}>
            {b.code} {b.label}, {b.when}. {b.line} {b.turn}
          </p>
        ))}
      </div>
    </div>
  );
}
```

> ⚠️ The absolutely-positioned `turn` at `top: 0` assumes it's shorter than the
> claim block. Some turns are long ("Plus a 1,700-person convention…"). **Check
> every beat at 375px width for overflow off the bottom of the viewport.** May need
> a grid-stack (both children in the same grid cell) rather than absolute
> positioning.

### 5.5 `lib/story-store.ts` — two-line fix

`goToBeat` hardcodes even spacing. Without this, every chapter-rail click and every
mobile dot lands in the wrong place.

```diff
-import { BEAT_COUNT } from "@/lib/story";
+import { BEAT_COUNT, beatT } from "@/lib/story";
```

```diff
     const clamped = Math.min(Math.max(beat, 0), BEAT_COUNT - 1);
-    const t = clamped / (BEAT_COUNT - 1);
+    // Beats are unevenly spaced along storyT (see lib/story.ts) — ask for
+    // the position rather than assuming a uniform division.
+    const t = beatT(clamped);
```

### 5.6 `components/narrative-fallback.tsx` — render both lines

```diff
           <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
             {beat.code} — {beat.label}
+            <span className="ml-3 text-type-faint">{beat.when}</span>
           </p>
```

```diff
-          <p className="mt-8 max-w-md text-balance font-display text-2xl leading-snug text-type">
-            {beat.caption}
-          </p>
+          {/* Both lines, stacked. Without the dissolve to carry the turn,
+              the fallback simply reads it as the next paragraph — which is
+              what makes this path a real essay rather than six icons. */}
+          <p className="mt-8 max-w-md text-balance font-display text-2xl leading-snug text-type">
+            {beat.line}
+          </p>
+          <p className="mt-4 max-w-md text-balance text-base leading-relaxed text-type-dim">
+            {beat.turn}
+          </p>
```

### 5.7 `app/page.tsx` — more scroll distance

The uneven spacing needs room, or the long first gap reads as a broken page.

```diff
-      <WebglSpacer height={`${BEATS.length * 100}vh`} />
+      {/* Slightly more than one viewport per beat: the beats are unevenly
+          spaced (lib/story.ts), and the long first gap — the four quiet
+          years — needs real distance to read as silence rather than a bug. */}
+      <WebglSpacer height={`${BEATS.length * 115}vh`} />
```

### 5.8 `app/notes/page.tsx` — rebuild around the losses

Currently keys off `WIN_COUNT` and `a.win`, both of which are gone. Rebuild to:

- Lead with why the blanks are in the list.
- A four-stat row: `entered 30 · placed 18 · nothing 11 · won outright 6`.
- Group by year descending, showing `{n} entered` beside each year heading.
- Per row: month · status glyph · event (+ `comp` tag) · org · note · result.
- Three status glyphs, not two: `● placed` (accent), `◐ mentor` (dim),
  `○` (faint) for no placement, with `—` in the result column.
- Closing mono line: `// two years between the first entry and the first win.`
- Retire the old closer `// sep 2026: SF → Yale → Harvard → MIT → Tokyo` — or
  confirm it with the owner, it's next month and unverified.

### 5.9 De-client-ing (per §1.1)

| File | Change |
|---|---|
| `app/work/[slug]/page.tsx:111-118` | Replace the accent "Build something like this →" button with a plain `← back to the journey` link to `/` |
| `content/site.ts:13` | Drop `availability`; add `status: "AI engineering at YTL AI Labs since Apr 2026. Building Tack."` |
| `app/contact/page.tsx:14-20` | Replace the pitch. Suggested: *"That's the whole story. Thanks for scrolling it."* / *"I'm not selling anything here. But if any of it landed — if you're building something strange, or you're five hackathons in with nothing to show and wondering whether that's normal — I'd genuinely like to hear about it."* |
| `app/contact/page.tsx:41-43` | `availability` row → `right now` / `{SITE.status}` |
| `app/contact/page.tsx:7` | metadata description → `"The end of the story. Say hi."` |

Also update `content/site.ts` `NAV` labels — `Signals` → `Run log` — and the
`/notes` metadata title, if the route keeps its path.

### 5.10 Regenerate and verify

```bash
npm run fragments   # MUST run — BEAT_COUNT 6→7 changes the binary layout
npm run typecheck
npm run build
```

`npm run fragments` rewrites `public/fragments.bin` (515.6 KB → 586.0 KB) and
`lib/generated/fragments-meta.ts` (`BEAT_TARGET_COUNT` 6 → 7). Both are committed
files. Forgetting this ships a 6-beat binary against a 7-beat scene.

---

## 6. Open questions for the owner

1. **Hyzon Network** — was that his own Minecraft server? Both 2017 plugins link to
   its PayPal. "Ran a server with a donation link at twelve" is a stronger beat 00
   than "published two plugins," but it must be confirmed first.
2. **Loophole Hackathon 2025** (Judges' Favourite, Build Club MY) — in the repo but
   absent from the master list he supplied. Real? If it's dropped, `EVENT_COUNT`
   becomes 29, 2025 becomes 11, and silhouette 3's bars must be redrawn.
3. **The SF research lab and Polytera** — both in `content/site.ts`, neither in the
   experience list he supplied. Nameable publicly? See the existing
   `REVIEW BEFORE LAUNCH` comment at `content/site.ts:30`.
4. **`content/site.ts:12`** — `email: "hello@hongbing.dev"` is still a placeholder.
   **Ship blocker.** The GitHub handle at `:16` is also marked unconfirmed.
5. **`// sep 2026: SF → Yale → Harvard → MIT → Tokyo`** (`app/notes/page.tsx:61`) —
   next month, unverified. Keep or cut.
6. **All three case studies** still carry `{/* DRAFT — please review */}` —
   `content/projects/{tack,kiyokocon,ai-hackerdorm}.mdx`. `ai-hackerdorm.mdx` also
   opens with *"Two years before we started, I knew nothing about tech,"* which
   conflicts with §2.1. Needs a rewrite in his voice.
7. **Something unlisted he's oddly proud of** — asked, not yet answered. A small
   thing with no award attached would do more for this site than any of the 30
   events.

---

## 7. Guardrails

- **Don't invent connective tissue.** Three narrative drafts were killed for it.
  If a claim isn't in §2, it doesn't go on the site.
- **Don't write him as a detached organiser.** He is a genuine participant in all
  seven clubs and said so explicitly.
- **Don't say "nine years" or imply a continuous career from 2017.** The Minecraft
  chapter closed. 2018–2021 is genuinely empty.
- **Keep the losses.** The eleven no-placement entries and the mentored win are
  the load-bearing part of the whole story. Any change that quietly drops them
  defeats the rewrite.
- **Don't touch COLD START.** `components/cold-start.tsx` is the strongest thing
  in the build. It needs no narrative change — it already sets up "wrong angle,"
  which the new beat 06 finally pays off by resolving the wordmark last.
- **Preserve the accessibility work.** Reduced motion, no-WebGL, keyboard, mobile
  strip, and the sound toggle's deliberate exemption from `entrance-hide` are all
  intentional. The new `sr-only` beat list in §5.4 exists because the journey
  currently has no text alternative at all.
