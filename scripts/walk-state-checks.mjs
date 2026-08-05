/**
 * State checks for the walk: reduced-motion mid-journey + panel hold.
 * Usage: BASE=http://localhost:3000 node scripts/walk-state-checks.mjs
 */

import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = "/tmp/walk-shots";
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: true });

// 1. Reduced motion: every artifact pinned resolved while the camera walks.
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.evaluateOnNewDocument(() => {
    try {
      sessionStorage.setItem("lab.entrance.seen", "1");
    } catch {}
  });
  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector("canvas", { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3500));
  await page.evaluate(() => {
    const spine = document.getElementById("story-spine");
    if (!spine) return;
    window.scrollTo({ top: spine.offsetTop + 0.52 * (spine.offsetHeight - innerHeight), behavior: "instant" });
  });
  await new Promise((r) => setTimeout(r, 1600));
  await page.screenshot({ path: `${OUT}/state-reduced-motion.png` });
  console.log("shot state-reduced-motion (storyT=0.52, reduced motion)");
  await page.close();
}

// 2. Panel hold: deep link to /notes — camera must fly to room 5 and hold.
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => {
    try {
      sessionStorage.setItem("lab.entrance.seen", "1");
    } catch {}
  });
  await page.goto(`${BASE}/notes`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.waitForSelector("canvas", { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 4500));
  await page.screenshot({ path: `${OUT}/state-panel-notes.png` });
  console.log("shot state-panel-notes (/notes deep link)");
  await page.close();
}

await browser.close();
console.log("done");
