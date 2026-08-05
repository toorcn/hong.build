/**
 * Proof that the cloud reacts to the cursor, and that the chapter rail reads
 * as a time axis.
 *
 * The reactivity check is a pixel diff: park the pointer off to one side, let
 * the scene settle, shoot it; sweep the pointer across the middle of the frame,
 * shoot again mid-sweep. If the cursor has no effect the two frames differ only
 * by idle drift, so the test compares the sweep diff against a same-length
 * baseline diff taken with the pointer held still. The sweep has to move
 * materially more pixels than idle drift does, or the feature isn't there.
 *
 * Usage: BASE=http://localhost:3000 node scripts/cursor-checks.mjs
 */

import puppeteer from "puppeteer";
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = "/tmp/cursor-shots";
mkdirSync(OUT, { recursive: true });

const raw = (p) => sharp(p).removeAlpha().raw().toBuffer({ resolveWithObject: true });

/** Fraction of pixels differing by more than a small threshold. */
async function diffRatio(pathA, pathB) {
  const [a, b] = await Promise.all([raw(pathA), raw(pathB)]);
  let changed = 0;
  for (let i = 0; i < a.data.length; i += 3) {
    const d =
      Math.abs(a.data[i] - b.data[i]) +
      Math.abs(a.data[i + 1] - b.data[i + 1]) +
      Math.abs(a.data[i + 2] - b.data[i + 2]);
    if (d > 24) changed++;
  }
  return changed / (a.info.width * a.info.height);
}

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.evaluateOnNewDocument(() => {
  try {
    sessionStorage.setItem("lab.entrance.seen", "1");
  } catch {}
});
await page.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForSelector("canvas", { timeout: 30000 });
await new Promise((r) => setTimeout(r, 4000));

// Sit mid-corridor, where there is dust to disturb as well as an artifact.
await page.evaluate(() => {
  const spine = document.getElementById("story-spine");
  window.scrollTo({
    top: spine.offsetTop + 0.44 * (spine.offsetHeight - innerHeight),
    behavior: "instant",
  });
});
await new Promise((r) => setTimeout(r, 2500));

// Baseline: pointer parked far left and still. Two shots, 250ms apart, so we
// know how much the scene changes on its own.
await page.mouse.move(60, 820);
await new Promise((r) => setTimeout(r, 1800));
await page.screenshot({ path: `${OUT}/idle-a.png` });
await new Promise((r) => setTimeout(r, 250));
await page.screenshot({ path: `${OUT}/idle-b.png` });

// Sweep the pointer through the middle of the frame and shoot mid-sweep.
for (let i = 0; i <= 10; i++) {
  await page.mouse.move(400 + i * 60, 450);
  await new Promise((r) => setTimeout(r, 25));
}
await page.screenshot({ path: `${OUT}/swept.png` });

const idle = await diffRatio(`${OUT}/idle-a.png`, `${OUT}/idle-b.png`);
const swept = await diffRatio(`${OUT}/idle-b.png`, `${OUT}/swept.png`);
console.log(`idle drift over 250ms : ${(idle * 100).toFixed(3)}% of pixels`);
console.log(`pointer sweep         : ${(swept * 100).toFixed(3)}% of pixels`);
console.log(
  swept > idle * 2.5
    ? `PASS — the sweep moves ${(swept / Math.max(idle, 1e-9)).toFixed(1)}x more than idle drift`
    : "FAIL — the cursor is not measurably disturbing the cloud",
);

// The rail, at a late beat, with a chapter hovered so its phase label shows.
await page.evaluate(() => {
  const spine = document.getElementById("story-spine");
  window.scrollTo({
    top: spine.offsetTop + 0.84 * (spine.offsetHeight - innerHeight),
    behavior: "instant",
  });
});
await new Promise((r) => setTimeout(r, 2000));
const rows = await page.$$('nav[data-rail="desktop"] button');
console.log(`chapter rail rows     : ${rows.length}`);
if (rows[5]) await rows[5].hover();
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: `${OUT}/rail.png` });

await browser.close();
console.log("shots in", OUT);
