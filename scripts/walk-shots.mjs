/**
 * Live journey screenshots for the walk (v3).
 *
 * Drives the real page: skips the entrance via sessionStorage, scrolls the
 * story spine to chosen storyT positions, lets the camera settle, shoots.
 *
 * Usage: BASE=http://localhost:3000 node scripts/walk-shots.mjs
 */

import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = "/tmp/walk-shots";

/** storyT positions to shoot: every waypoint (BEAT_T) + two corridors. */
const STOPS = [
  ["00-gate", 0],
  ["corridor-0-1", 0.1],
  ["01-first-five", 0.2],
  ["02-someone-elses-win", 0.32],
  ["03-the-loop", 0.42],
  ["04-joined-then-built", 0.51],
  ["05-kiyokocon", 0.6],
  ["06-eleven-terms", 0.68],
  ["07-room-got-bigger", 0.76],
  ["corridor-7-8", 0.8],
  ["08-nineteen-campuses", 0.84],
  ["09-the-run", 0.92],
  ["10-wordmark", 1.0],
];

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.evaluateOnNewDocument(() => {
  try {
    sessionStorage.setItem("lab.entrance.seen", "1");
  } catch {}
});

mkdirSync(OUT, { recursive: true });

await page.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
await page.waitForSelector("canvas", { timeout: 30000 });
// Let the payload land and the scene warm up.
await new Promise((r) => setTimeout(r, 3500));

for (const [name, t] of STOPS) {
  await page.evaluate((tt) => {
    const spine = document.getElementById("story-spine");
    if (!spine) return;
    const y = spine.offsetTop + tt * (spine.offsetHeight - window.innerHeight);
    window.scrollTo({ top: y, behavior: "instant" });
  }, t);
  // Camera damping (0.16/frame) needs a moment to catch the scroll.
  await new Promise((r) => setTimeout(r, 1600));
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`shot ${name} (storyT=${t})`);
}

await browser.close();
console.log(`done → ${OUT}`);
