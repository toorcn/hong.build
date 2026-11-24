/**
 * Draws the README art: an animated banner, a logo mark, and one pixel sprite
 * per chapter of the journey. Everything is generated from the bitmaps below,
 * so there are no binary assets to keep in step.
 *
 * Run: npm run readme:art   (writes docs/assets/)
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "docs", "assets");
const SPRITES = join(OUT, "sprites");
mkdirSync(SPRITES, { recursive: true });

const VOID = "#0a0b0d";
const RAISED = "#101216";
const LINE = "#23262e";
const ACCENT = "#c8ff4d";
const ACCENT_DIM = "#8fb53a";
const SLATE = "#4a5468";
const TYPE = "#edede8";

/** Deterministic noise, so regenerating produces identical files. */
const hash = (n) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

/* ------------------------------------------------------------------ */
/* Pixel font — only the letters the banner and logo need.            */
/* ------------------------------------------------------------------ */

const FONT = {
  H: ["X...X", "X...X", "X...X", "XXXXX", "X...X", "X...X", "X...X"],
  O: [".XXX.", "X...X", "X...X", "X...X", "X...X", "X...X", ".XXX."],
  N: ["X...X", "XX..X", "X.X.X", "X..XX", "X...X", "X...X", "X...X"],
  G: [".XXX.", "X...X", "X....", "X.XXX", "X...X", "X...X", ".XXX."],
  B: ["XXXX.", "X...X", "X...X", "XXXX.", "X...X", "X...X", "XXXX."],
  I: ["XXXXX", "..X..", "..X..", "..X..", "..X..", "..X..", "XXXXX"],
};

/** Rows of pixels for a string, as [col, row] cells. */
function pixelText(text, gap = 1, space = 3) {
  const cells = [];
  let x = 0;
  for (const ch of text) {
    if (ch === " ") {
      x += space;
      continue;
    }
    const g = FONT[ch];
    g.forEach((row, y) => {
      [...row].forEach((c, i) => {
        if (c === "X") cells.push([x + i, y]);
      });
    });
    x += 5 + gap;
  }
  return { cells, cols: x - gap, rows: 7 };
}

/* ------------------------------------------------------------------ */
/* Banner                                                              */
/* ------------------------------------------------------------------ */

function banner() {
  const W = 1280;
  const H = 320;
  const title = pixelText("HONG BING");
  const px = 16;
  const x0 = Math.round((W - title.cols * px) / 2);
  const y0 = 70;

  // Each pixel starts somewhere out in the dust and gathers into place.
  const rects = title.cells
    .map(([c, r], i) => {
      const dx = Math.round((hash(i * 3.1) - 0.5) * 900);
      const dy = Math.round((hash(i * 5.7 + 1) - 0.5) * 420);
      const delay = (hash(i * 7.3 + 2) * 1.4).toFixed(2);
      const hot = hash(i * 2.9 + 4) > 0.82;
      return `<rect class="g" x="${x0 + c * px}" y="${y0 + r * px}" width="${px - 2}" height="${px - 2}" fill="${hot ? TYPE : ACCENT}" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${delay}s"/>`;
    })
    .join("\n    ");

  // Background dust: slate and accent motes that twinkle and drift.
  const motes = Array.from({ length: 110 }, (_, i) => {
    const x = Math.round(hash(i * 1.7 + 9) * W);
    const y = Math.round(hash(i * 2.3 + 3) * H);
    const r = (0.8 + hash(i * 4.1) * 2.2).toFixed(1);
    const warm = hash(i * 6.2) > 0.78;
    const dur = (3 + hash(i * 8.8) * 5).toFixed(1);
    const delay = (hash(i * 9.9) * 4).toFixed(1);
    const dy = Math.round((hash(i * 3.3) - 0.5) * 18);
    return `<circle class="m" cx="${x}" cy="${y}" r="${r}" fill="${warm ? ACCENT : SLATE}" style="--drift:${dy}px;animation-duration:${dur}s;animation-delay:${delay}s"/>`;
  }).join("\n    ");

  const baseY = y0 + 7 * px + 56;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Hong Bing — hong.build">
  <style>
    .g { animation: gather 1.6s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
    .m { animation: twinkle 5s ease-in-out infinite alternate; }
    .t { animation: rise 1.2s ease-out 1.6s backwards; }
    .scan { animation: scan 6s linear infinite; }
    @keyframes gather { from { transform: translate(var(--dx), var(--dy)); opacity: 0; } }
    @keyframes twinkle { from { opacity: 0.15; transform: translateY(0); } to { opacity: 0.75; transform: translateY(var(--drift)); } }
    @keyframes rise { from { opacity: 0; transform: translateY(8px); } }
    @keyframes scan { from { transform: translateX(-120px); } to { transform: translateX(${W}px); } }
    @media (prefers-reduced-motion: reduce) { .g, .m, .t, .scan { animation: none; } }
  </style>
  <defs>
    <linearGradient id="scan" x1="0" x2="1">
      <stop offset="0" stop-color="${ACCENT}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${ACCENT}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.45" r="0.6">
      <stop offset="0" stop-color="${ACCENT}" stop-opacity="0.09"/>
      <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${VOID}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g>
    ${motes}
  </g>
  <rect class="scan" x="0" y="0" width="120" height="${H}" fill="url(#scan)"/>
  <g>
    ${rects}
  </g>
  <g class="t" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" text-anchor="middle">
    <text x="${W / 2}" y="${baseY}" fill="${TYPE}" font-size="20" letter-spacing="6">FOUNDER, BUILDING IN STEALTH</text>
    <text x="${W / 2}" y="${baseY + 32}" fill="${ACCENT_DIM}" font-size="14" letter-spacing="4">NOTHING HERE MEANS ANYTHING UNTIL YOU FIND THE ANGLE</text>
  </g>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="${LINE}"/>
</svg>
`;
}

/* ------------------------------------------------------------------ */
/* Logo mark: an "H" and a "B" made of dust                           */
/* ------------------------------------------------------------------ */

function logo() {
  const S = 256;
  const px = 18;
  const h = pixelText("H");
  const b = pixelText("B");
  const gapCols = 1;
  const cols = h.cols + gapCols + b.cols;
  const x0 = Math.round((S - cols * px) / 2);
  const y0 = Math.round((S - 7 * px) / 2);
  const cell = (c, r, i, fill) =>
    `<rect x="${x0 + c * px}" y="${y0 + r * px}" width="${px - 2}" height="${px - 2}" fill="${fill}"/>`;
  const out = [];
  h.cells.forEach(([c, r], i) => out.push(cell(c, r, i, hash(i * 3.3) > 0.8 ? TYPE : ACCENT)));
  b.cells.forEach(([c, r], i) => out.push(cell(c + h.cols + gapCols, r, i, hash(i * 5.1 + 7) > 0.8 ? TYPE : ACCENT)));
  const motes = Array.from({ length: 26 }, (_, i) => {
    const x = Math.round(hash(i * 1.9 + 2) * S);
    const y = Math.round(hash(i * 2.7 + 5) * S);
    return `<circle cx="${x}" cy="${y}" r="${(1 + hash(i) * 2).toFixed(1)}" fill="${hash(i * 4.4) > 0.7 ? ACCENT : SLATE}" opacity="0.5"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="HB">
  <rect width="${S}" height="${S}" rx="36" fill="${VOID}"/>
  <rect x="1" y="1" width="${S - 2}" height="${S - 2}" rx="35" fill="none" stroke="${LINE}" stroke-width="2"/>
  ${motes}
  ${out.join("\n  ")}
</svg>
`;
}

/* ------------------------------------------------------------------ */
/* Chapter sprites, 16x16. "X" accent, "o" bright, "-" dim, "." empty. */
/* ------------------------------------------------------------------ */

const SPRITE_ART = {
  "00-gate": [
    "................",
    "................",
    ".....XXXXXX.....",
    "...XXXXXXXXXX...",
    "..XXXX....XXXX..",
    "..XXX......XXX..",
    "..XXX......XXX..",
    "..XX........XX..",
    "..XX........XX..",
    "..XX........XX..",
    "..XX........XX..",
    "..XX........XX..",
    "..XX........XX..",
    "..XX........XX..",
    "..XXXXXXXXXXXX..",
    "................",
  ],
  "01-losses": [
    "................",
    "................",
    ".XXX.XXX.XXX....",
    ".X.X.X.X.X.X....",
    ".XXX.XXX.XXX....",
    "................",
    "..XXX.XXX.......",
    "..X.X.X.X.......",
    "..XXX.XXX.......",
    "................",
    "................",
    "...-.-.-.-.-....",
    "................",
    "................",
    "................",
    "................",
  ],
  "02-hand-off": [
    "................",
    "................",
    "...XXXXXXXX.....",
    "...XooooooX.....",
    "..XXooooooXXX...",
    "..X.XooooX.X....",
    "..X..XXXX..X....",
    "...X..XX..X.....",
    "....XXXXXX......",
    ".....XXXX.......",
    "......XX........",
    "....XXXXXX......",
    "...XXXXXXXX.....",
    "...XXXXXXXX.....",
    "................",
    "................",
  ],
  "03-loop": [
    "................",
    "................",
    "....XXXXXXX.....",
    "..XXX.....XXXX..",
    ".XX.........XX..",
    ".XX.........XXX.",
    ".X...........XX.",
    ".X..........XXXX",
    ".X...........XX.",
    ".XX.........XX..",
    ".XX........XX...",
    "..XXX....XXX....",
    "....XXXXXX......",
    "................",
    "................",
    "................",
  ],
  "04-turn": [
    "................",
    "................",
    "................",
    "..XXXXXXXXXXXX..",
    ".XXXXXXXXXXXXXX.",
    ".XXX.XXXXXXoXXX.",
    ".XXXXXXXXXoXoXX.",
    ".XXX.XXXXXXoXXX.",
    ".XXXXXXXXXXXXXX.",
    ".XXXXXXXXXXXXXX.",
    ".XXXX......XXXX.",
    ".XXX........XXX.",
    ".XX..........XX.",
    "................",
    "................",
    "................",
  ],
  "05-gathering": [
    "................",
    "..XX........XX..",
    "..XXXXXXXXXXXX..",
    "..XXoooooooXXX..",
    "..XXoooooooXXX..",
    "..XXXXXXXXXXXX..",
    "..XX........XX..",
    "................",
    "................",
    "..-.-.-.-.-.-...",
    ".-.-.-.-.-.-.-..",
    "..-.-.-.-.-.-...",
    ".-.-.-.-.-.-.-..",
    "................",
    "................",
    "................",
  ],
  "06-all-at-once": [
    "................",
    "................",
    "..XXXXXX........",
    "................",
    "....XXXXXXXX....",
    "................",
    "..XXXXXXXXXXXX..",
    "................",
    "......XXXXXXXX..",
    "................",
    "..XXXXXXX.......",
    "................",
    "........XXXXXX..",
    "................",
    "................",
    "................",
  ],
  "07-room-got-bigger": [
    "XXXXXXXXXXXXXXXX",
    "X..............X",
    "X.XXXXXXXXXXXX.X",
    "X.X..........X.X",
    "X.X.XXXXXXXX.X.X",
    "X.X.X......X.X.X",
    "X.X.X..oo..X.X.X",
    "X.X.X.oooo.X.X.X",
    "X.X.X..oo..X.X.X",
    "X.X.X.o..o.X.X.X",
    "X.X.XXXXXXXX.X.X",
    "X.X..........X.X",
    "X.XXXXXXXXXXXX.X",
    "X..............X",
    "XXXXXXXXXXXXXXXX",
    "................",
  ],
  "08-network": [
    "................",
    "......XX........",
    "......XX........",
    ".....-XX-.......",
    "..XX..XX..XX....",
    "..XX-.XX.-XX....",
    "...-XXXXXX-.....",
    "....XXooXX......",
    "....XXooXX......",
    "...-XXXXXX-.....",
    "..XX-.XX.-XX....",
    "..XX..XX..XX....",
    ".....-XX-.......",
    "......XX........",
    "......XX........",
    "................",
  ],
  "09-run": [
    "................",
    "................",
    "..............XX",
    "..............XX",
    ".............oXX",
    "...........XXoXX",
    "...........XXoXX",
    ".......XXX.XXoXX",
    ".......XXX.XXoXX",
    "...XXX.XXX.XXoXX",
    "...XXX.XXX.XXoXX",
    ".XX-XX.XXX.XXXXX",
    ".XX-XX.XXX.XXXXX",
    "................",
    "................",
    "................",
  ],
  "10-now": [
    "................",
    "................",
    "................",
    "..X...X..XXXX...",
    "..X...X..X...X..",
    "..X...X..X...X..",
    "..XXXXX..XXXX...",
    "..X...X..X...X..",
    "..X...X..X...X..",
    "..X...X..XXXX...",
    "................",
    "..-.-.-.-.-.-...",
    "................",
    "................",
    "................",
    "................",
  ],
};

function sprite(rows) {
  const px = 12;
  const size = 16 * px;
  const color = { X: ACCENT, o: TYPE, "-": SLATE };
  const rects = [];
  rows.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === ".") return;
      rects.push(`<rect x="${x * px}" y="${y * px}" width="${px - 1}" height="${px - 1}" fill="${color[c]}"/>`);
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
  <rect width="${size}" height="${size}" rx="14" fill="${RAISED}"/>
  ${rects.join("\n  ")}
</svg>
`;
}

for (const [name, rows] of Object.entries(SPRITE_ART)) {
  if (rows.length !== 16 || rows.some((r) => r.length !== 16)) {
    throw new Error(`sprite ${name} must be 16x16`);
  }
  writeFileSync(join(SPRITES, `${name}.svg`), sprite(rows));
}
writeFileSync(join(OUT, "banner.svg"), banner());
writeFileSync(join(OUT, "logo.svg"), logo());
console.log(`readme art: banner, logo, ${Object.keys(SPRITE_ART).length} sprites -> docs/assets/`);
