/**
 * The resolved silhouettes as SVG markup, rasterized to alpha masks with
 * sharp by scripts/generate-fragments.ts. Opaque pixels are what get
 * rejection-sampled into fragments.
 *
 * Everything is drawn in a 1000 x 1000 viewBox centered on (500, 500).
 *
 * INDICES MATCH BEAT IDS — silhouettes[n] is beat n's artifact. Reorder a
 * beat and you reorder these.
 *
 * ── What these have to survive ──────────────────────────────────────────
 *
 * Each shape is drawn with somewhere between 480 and 900 particles, additively
 * blended, seen from one authored angle. That budget rules out illustration:
 * anything thinner than ~20px in this viewBox samples to a dotted line, and
 * interior detail on a filled shape is invisible because the mask is alpha
 * only — white on white reads as one blob. So the rules are:
 *
 *   - Detail lives on OUTLINES (fill="none" + a fat stroke), never inside fills.
 *   - Nothing thinner than 16px, and load-bearing strokes are 22–52px.
 *   - Under a dozen elements per shape, or the particle budget spreads too
 *     thin for any of them to read.
 *
 * The earlier set failed a different test: tally marks, overlapping rings, a
 * refresh icon and an `@` are stock pictograms. They described a category of
 * thing ("some attempts", "some commitments") rather than a specific one, so
 * 6,000 particles were spent drawing clipart. Each shape here is answerable
 * to a fact in content/awards.ts or the committee record: the bar cascade in
 * 06 is the real term dates, the plot in 09 is the real per-year entry counts.
 * If those facts change, redraw the shape and re-run `npm run fragments`.
 */

export const SILHOUETTES: readonly string[] = [
  // ── 00 · HG748 ─────────────────────────────────────────────────────────
  // A gate built out of blocks, with a padlock hanging in the opening. The
  // first plugin was a whitelist: it decided who was allowed onto the server.
  // Coarse and rectilinear on purpose — 18 KB of Java, written at twelve.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <g fill="#fff">
      <rect x="152" y="172" width="96" height="96"/>
      <rect x="252" y="172" width="96" height="96"/>
      <rect x="352" y="172" width="96" height="96"/>
      <rect x="452" y="172" width="96" height="96"/>
      <rect x="552" y="172" width="96" height="96"/>
      <rect x="652" y="172" width="96" height="96"/>
      <rect x="752" y="172" width="96" height="96"/>
      <rect x="152" y="272" width="96" height="96"/>
      <rect x="752" y="272" width="96" height="96"/>
      <rect x="152" y="372" width="96" height="96"/>
      <rect x="752" y="372" width="96" height="96"/>
      <rect x="152" y="472" width="96" height="96"/>
      <rect x="752" y="472" width="96" height="96"/>
      <rect x="152" y="572" width="96" height="96"/>
      <rect x="752" y="572" width="96" height="96"/>
      <rect x="152" y="672" width="96" height="96"/>
      <rect x="752" y="672" width="96" height="96"/>
      <rect x="152" y="772" width="96" height="96"/>
      <rect x="752" y="772" width="96" height="96"/>
      <!-- the lock: shackle as three bars, then the body -->
      <rect x="432" y="352" width="136" height="42"/>
      <rect x="432" y="352" width="42" height="116"/>
      <rect x="526" y="352" width="42" height="116"/>
      <rect x="400" y="452" width="200" height="176"/>
    </g>
  </svg>`,

  // ── 01 · FIRST FIVE ────────────────────────────────────────────────────
  // Five entries standing on the floor, each one topped by an empty ring.
  // Five hackathons, and not one placement — the medals are hollow rather
  // than absent, because he did finish all five.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <g fill="none" stroke="#fff" stroke-width="24">
      <circle cx="162" cy="300" r="62"/>
      <circle cx="332" cy="300" r="62"/>
      <circle cx="502" cy="300" r="62"/>
      <circle cx="672" cy="300" r="62"/>
      <circle cx="842" cy="300" r="62"/>
    </g>
    <g fill="#fff">
      <rect x="130" y="400" width="64" height="300"/>
      <rect x="300" y="400" width="64" height="300"/>
      <rect x="470" y="400" width="64" height="300"/>
      <rect x="640" y="400" width="64" height="300"/>
      <rect x="810" y="400" width="64" height="300"/>
      <rect x="96" y="716" width="808" height="18"/>
    </g>
  </svg>`,

  // ── 02 · SOMEONE ELSE'S WIN ────────────────────────────────────────────
  // Two podiums. His is empty; the trophy is on the other one, and the arrow
  // points that way. He mentored INSLABBY to a national championship a full
  // year before he placed anywhere himself.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <g fill="#fff">
      <rect x="96" y="718" width="268" height="92"/>
      <rect x="636" y="718" width="268" height="92"/>
      <!-- the hand-off -->
      <rect x="392" y="748" width="152" height="32"/>
      <polygon points="604,764 528,718 528,810"/>
      <!-- the trophy, on their podium -->
      <rect x="676" y="660" width="188" height="58"/>
      <rect x="748" y="540" width="44" height="120"/>
      <polygon points="650,180 890,180 844,540 696,540"/>
    </g>
    <g fill="none" stroke="#fff" stroke-width="26">
      <path d="M 652 214 C 570 214 562 420 658 420"/>
      <path d="M 888 214 C 970 214 978 420 882 420"/>
    </g>
  </svg>`,

  // ── 03 · THE LOOP ──────────────────────────────────────────────────────
  // think · build · test · break · correct — five nodes on a ring — and
  // repeat, which is the arrowhead crossing the gap. The gap is the point:
  // the loop is not closed, it is re-entered.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <path d="M 595.8 236.9 A 280 280 0 0 1 734.8 652.5 A 280 280 0 0 1 298.6 694.5 A 280 280 0 0 1 360.0 257.5"
      fill="none" stroke="#fff" stroke-width="34"/>
    <polygon points="439.7,211.5 393.0,314.7 327.0,200.3" fill="#fff"/>
    <!-- The nodes have to be much fatter than the ring or they vanish into
         it — beads on a wire, not a thicker wire. -->
    <g fill="#fff">
      <rect x="244.0" y="244.0" width="116" height="116"/>
      <rect x="178.9" y="537.8" width="116" height="116"/>
      <rect x="417.6" y="720.9" width="116" height="116"/>
      <rect x="684.5" y="582.0" width="116" height="116"/>
      <rect x="671.4" y="281.4" width="116" height="116"/>
    </g>
  </svg>`,

  // ── 04 · JOINED, THEN BUILT ────────────────────────────────────────────
  // A controller, with a shell prompt where the maker's logo would go. He
  // joined the esports club because he plays; he left it as its developer.
  // Outlined rather than filled so the prompt inside can be seen at all.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <g fill="none" stroke="#fff" stroke-width="30">
      <rect x="196" y="360" width="608" height="220" rx="104"/>
      <rect x="232" y="540" width="148" height="240" rx="72"/>
      <rect x="620" y="540" width="148" height="240" rx="72"/>
    </g>
    <g fill="#fff">
      <rect x="298" y="410" width="44" height="120"/>
      <rect x="260" y="448" width="120" height="44"/>
      <circle cx="652" cy="432" r="28"/>
      <circle cx="712" cy="492" r="28"/>
      <rect x="530" y="446" width="56" height="50"/>
    </g>
    <path d="M 452 424 L 512 470 L 452 516" fill="none" stroke="#fff"
      stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // ── 05 · KIYOKOCON ─────────────────────────────────────────────────────
  // A stage, a truss above it, and the room in front of it. He founded the
  // convention and chaired it: 50 booths, 35 partners, 1,700 people. The
  // figures face the stage because he was never the one on it.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <g fill="#fff">
      <!-- Stage slab between two speaker stacks. An earlier version added a
           truss across the full width and an apron under the slab; together
           those four elements closed into a rectangle and the whole thing read
           as an abstract frame, not a stage. Three heavy blocks and nothing
           else is what makes the silhouette legible. -->
      <rect x="150" y="150" width="92"  height="210"/>
      <rect x="758" y="150" width="92"  height="210"/>
      <rect x="276" y="262" width="448" height="98"/>
      <!-- back row -->
      <circle cx="130" cy="486" r="30"/><rect x="96"  y="514" width="68" height="96" rx="22"/>
      <circle cx="212" cy="486" r="30"/><rect x="178" y="514" width="68" height="96" rx="22"/>
      <circle cx="294" cy="486" r="30"/><rect x="260" y="514" width="68" height="96" rx="22"/>
      <circle cx="376" cy="486" r="30"/><rect x="342" y="514" width="68" height="96" rx="22"/>
      <circle cx="458" cy="486" r="30"/><rect x="424" y="514" width="68" height="96" rx="22"/>
      <circle cx="540" cy="486" r="30"/><rect x="506" y="514" width="68" height="96" rx="22"/>
      <circle cx="622" cy="486" r="30"/><rect x="588" y="514" width="68" height="96" rx="22"/>
      <circle cx="704" cy="486" r="30"/><rect x="670" y="514" width="68" height="96" rx="22"/>
      <circle cx="786" cy="486" r="30"/><rect x="752" y="514" width="68" height="96" rx="22"/>
      <circle cx="868" cy="486" r="30"/><rect x="834" y="514" width="68" height="96" rx="22"/>
      <!-- front row -->
      <circle cx="172" cy="672" r="36"/><rect x="130" y="702" width="84" height="112" rx="26"/>
      <circle cx="266" cy="672" r="36"/><rect x="224" y="702" width="84" height="112" rx="26"/>
      <circle cx="360" cy="672" r="36"/><rect x="318" y="702" width="84" height="112" rx="26"/>
      <circle cx="454" cy="672" r="36"/><rect x="412" y="702" width="84" height="112" rx="26"/>
      <circle cx="548" cy="672" r="36"/><rect x="506" y="702" width="84" height="112" rx="26"/>
      <circle cx="642" cy="672" r="36"/><rect x="600" y="702" width="84" height="112" rx="26"/>
      <circle cx="736" cy="672" r="36"/><rect x="694" y="702" width="84" height="112" rx="26"/>
      <circle cx="830" cy="672" r="36"/><rect x="788" y="702" width="84" height="112" rx="26"/>
    </g>
  </svg>`,

  // ── 06 · ELEVEN TERMS ──────────────────────────────────────────────────
  // The committee record, plotted on a real time axis: Feb 2024 on the left
  // edge, now on the right, three dotted gridlines at Jan 2024 / 25 / 26.
  // Every bar is an actual term, at its actual dates, sorted by start —
  // which is why it falls as a cascade and why nothing lines up with
  // anything. Six of the eleven start after the middle gridline.
  //
  //   0 anime society · secretary          feb 2024 – nov 2024
  //   1 esports club · developer           apr 2024 – oct 2025
  //   2 anime society · vice president     jul 2024 – jan 2025
  //   3 elite valorant · coach             aug 2024 – nov 2024
  //   4 student welfare · SIP leader       sep 2024 – jul 2025
  //   5 anime society · president          jan 2025 – dec 2025
  //   6 fambiz club · vice president       feb 2025 – oct 2025
  //   7 counselling · mental health amb.   apr 2025 – dec 2025
  //   8 student welfare · SWAT treasurer   jul 2025 – now
  //   9 luminice ice skating · co-founder  sep 2025 – now
  //  10 counselling · peer buddy           dec 2025 – feb 2026
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <g fill="#fff">
      <rect x="113" y="120" width="20" height="680"/>
      <rect x="467" y="120" width="20" height="680"/>
      <rect x="859" y="120" width="20" height="680"/>
    </g>
    <g fill="#fff">
      <rect x="118" y="158" width="294" height="42" rx="14"/>
      <rect x="183" y="216" width="588" height="42" rx="14"/>
      <rect x="281" y="274" width="196" height="42" rx="14"/>
      <rect x="314" y="332" width="98"  height="42" rx="14"/>
      <rect x="347" y="390" width="327" height="42" rx="14"/>
      <rect x="477" y="448" width="359" height="42" rx="14"/>
      <rect x="510" y="506" width="261" height="42" rx="14"/>
      <rect x="575" y="564" width="261" height="42" rx="14"/>
      <rect x="673" y="622" width="229" height="42" rx="14"/>
      <rect x="739" y="680" width="163" height="42" rx="14"/>
      <rect x="837" y="738" width="65"  height="42" rx="14"/>
    </g>
  </svg>`,

  // ── 07 · THE ROOM GOT BIGGER ───────────────────────────────────────────
  // Four rooms, nested, each with a doorway in the same place, and one
  // figure at the centre that never changes size. Student champion at the
  // ASEAN AI Summit; a managing partner from 500 Global happened to be in
  // the room. He didn't grow — the rooms did.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <g fill="none" stroke="#fff" stroke-linecap="square">
      <path d="M 468 600 L 400 600 L 400 400 L 600 400 L 600 600 L 532 600" stroke-width="22"/>
      <path d="M 458 680 L 320 680 L 320 320 L 680 320 L 680 680 L 542 680" stroke-width="26"/>
      <path d="M 445 784 L 216 784 L 216 216 L 784 216 L 784 784 L 555 784" stroke-width="30"/>
      <path d="M 430 904 L 96 904 L 96 96 L 904 96 L 904 904 L 570 904" stroke-width="34"/>
    </g>
    <g fill="#fff">
      <circle cx="500" cy="470" r="18"/>
      <rect x="478" y="494" width="44" height="60" rx="14"/>
    </g>
  </svg>`,

  // ── 08 · NINETEEN CAMPUSES ─────────────────────────────────────────────
  // One hub, eighteen campuses, every one of them wired to it. AI Hackerdorm:
  // 500+ students across 19 campuses. Radial rather than a mesh because that
  // is what it actually is — a place, and everyone's route into it.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <g stroke="#fff" stroke-width="16" fill="none">
      <path d="M 500 500 L 500 270"/>
      <path d="M 500 500 L 320 357"/>
      <path d="M 500 500 L 276 551"/>
      <path d="M 500 500 L 400 707"/>
      <path d="M 500 500 L 600 707"/>
      <path d="M 500 500 L 724 551"/>
      <path d="M 500 500 L 680 357"/>
      <path d="M 500 500 L 659 159"/>
      <path d="M 500 500 L 449 127"/>
      <path d="M 500 500 L 256 214"/>
      <path d="M 500 500 L 140 392"/>
      <path d="M 500 500 L 138 603"/>
      <path d="M 500 500 L 251 782"/>
      <path d="M 500 500 L 443 872"/>
      <path d="M 500 500 L 654 843"/>
      <path d="M 500 500 L 815 706"/>
      <path d="M 500 500 L 876 503"/>
      <path d="M 500 500 L 818 299"/>
    </g>
    <g fill="#fff">
      <circle cx="500" cy="500" r="72"/>
      <circle cx="500" cy="270" r="30"/>
      <circle cx="320" cy="357" r="30"/>
      <circle cx="276" cy="551" r="30"/>
      <circle cx="400" cy="707" r="30"/>
      <circle cx="600" cy="707" r="30"/>
      <circle cx="724" cy="551" r="30"/>
      <circle cx="680" cy="357" r="30"/>
      <circle cx="659" cy="159" r="26"/>
      <circle cx="449" cy="127" r="26"/>
      <circle cx="256" cy="214" r="26"/>
      <circle cx="140" cy="392" r="26"/>
      <circle cx="138" cy="603" r="26"/>
      <circle cx="251" cy="782" r="26"/>
      <circle cx="443" cy="872" r="26"/>
      <circle cx="654" cy="843" r="26"/>
      <circle cx="815" cy="706" r="26"/>
      <circle cx="876" cy="503" r="26"/>
      <circle cx="818" cy="299" r="26"/>
    </g>
  </svg>`,

  // ── 09 · THE RUN ───────────────────────────────────────────────────────
  // Entries per year, to scale, with a tick under each year. Derived from
  // BY_YEAR in content/awards.ts: 2022:2 2023:4 2024:8 2025:10 2026:9,
  // at 52 units per entry. If the log changes, redraw these bars and
  // re-run `npm run fragments`.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <g fill="#fff">
      <rect x="145" y="656" width="110" height="104"/>
      <rect x="295" y="552" width="110" height="208"/>
      <rect x="445" y="344" width="110" height="416"/>
      <rect x="595" y="240" width="110" height="520"/>
      <rect x="745" y="292" width="110" height="468"/>
      <rect x="120" y="782" width="760" height="16"/>
      <rect x="192" y="812" width="16" height="40"/>
      <rect x="342" y="812" width="16" height="40"/>
      <rect x="492" y="812" width="16" height="40"/>
      <rect x="642" y="812" width="16" height="40"/>
      <rect x="792" y="812" width="16" height="40"/>
    </g>
  </svg>`,

  // ── 10 · HONG BING ─────────────────────────────────────────────────────
  // The wordmark, condensed heavy display type. Last, and earned: the name
  // is the only thing in the piece that is never explained.
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
    <text x="500" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900"
      font-size="218" letter-spacing="2" fill="#fff">HONG</text>
    <text x="500" y="640" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900"
      font-size="218" letter-spacing="2" fill="#fff">BING</text>
  </svg>`,
] as const;
