/**
 * Drives the real page and verifies COLD START: the phase sequence, the skip
 * gesture, and each fallback path. Screenshots land in /tmp/cold-start/.
 *
 * Usage: node scripts/verify-cold-start.mjs [origin]
 */

import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer";

const ORIGIN = process.argv[2] ?? "http://localhost:3987";
const SHOTS = "/tmp/cold-start";
mkdirSync(SHOTS, { recursive: true });

/** Poll the entrance phase off <html> so we see the real machine, not a mock. */
async function recordPhases(page, ms) {
  return page.evaluate(
    (duration) =>
      new Promise((resolve) => {
        const seen = [];
        const t0 = performance.now();
        const id = setInterval(() => {
          const phase = document.documentElement.dataset.entrance ?? "(none)";
          const last = seen[seen.length - 1];
          if (!last || last.phase !== phase) {
            seen.push({ phase, at: Math.round(performance.now() - t0) });
          }
          if (performance.now() - t0 > duration) {
            clearInterval(id);
            resolve(seen);
          }
        }, 20);
      }),
    ms,
  );
}

async function newPage(browser, { reducedMotion = false, webgl = true } = {}) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  if (reducedMotion) {
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  }
  if (!webgl) {
    // Make the capability probe fail exactly the way a real blocked GPU does.
    await page.evaluateOnNewDocument(() => {
      HTMLCanvasElement.prototype.getContext = function () {
        return null;
      };
    });
  }
  return { context, page };
}

const results = [];
function check(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

const browser = await puppeteer.launch({
  headless: true,
  args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
});

/* ---------- 0. nothing leaks before first paint ---------- */
{
  const { context, page } = await newPage(browser);
  // Block the bundles so React never hydrates. Whatever is true here is true
  // of the very first paint, and it isolates the inline boot script: if it
  // didn't run during parsing, the identity is on screen and the reveal is
  // already spoiled before the entrance begins.
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (/\/_next\/static\/chunks\/.*\.js$/.test(req.url())) req.abort();
    else req.continue();
  });
  await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
  const early = await page.evaluate(() => {
    const mark = [...document.querySelectorAll("a")].find((a) =>
      /home/i.test(a.getAttribute("aria-label") ?? ""),
    );
    return {
      attr: document.documentElement.dataset.entrance ?? "(none)",
      markOpacity: mark ? getComputedStyle(mark).opacity : "(missing)",
    };
  });
  check(
    "identity is hidden before first paint",
    early.attr === "boot" && early.markOpacity === "0",
    JSON.stringify(early),
  );
  await context.close();
}

/* ---------- 1. full entrance ---------- */
{
  const { context, page } = await newPage(browser);
  const phasesPromise = page
    .goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" })
    .then(() => recordPhases(page, 4200));

  // Screenshot the phases as they happen.
  const shots = [
    [180, "01-boot"],
    [700, "02-arrival"],
    [1300, "03-wrong-angle"],
    [1950, "04a-snap-flying"],
    [2120, "04b-sweep-start"],
    [2230, "04c-sweep-mid"],
    [2330, "04d-sweep-late"],
    [2450, "04e-lock"],
    [2700, "05-hold"],
    [3800, "06-revealed"],
  ];
  const t0 = Date.now();
  for (const [at, name] of shots) {
    const wait = at - (Date.now() - t0);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    await page.screenshot({ path: `${SHOTS}/${name}.png` });
  }

  const phases = await phasesPromise;
  const order = phases.map((p) => p.phase);
  console.log("  phases:", phases.map((p) => `${p.phase}@${p.at}ms`).join(" → "));

  const expected = ["boot", "load", "arrival", "wrong", "snap", "hold", "done"];
  const gotAll = expected.every((p) => order.includes(p));
  check("full entrance walks every phase in order", gotAll, order.join(" → "));

  const doneAt = phases.find((p) => p.phase === "done")?.at ?? -1;
  check(
    "entrance completes in under 3.5s",
    doneAt > 0 && doneAt < 3500,
    `done at ${doneAt}ms`,
  );

  // The overlays must be held back until done, then revealed.
  const revealed = await page.evaluate(() => {
    const rail = document.querySelector("nav[aria-label='Chapters'] , .entrance-hide");
    const cue = [...document.querySelectorAll(".entrance-hide")];
    return {
      attr: document.documentElement.dataset.entrance ?? "(none)",
      hidden: cue.filter((el) => getComputedStyle(el).opacity === "0").length,
      count: cue.length,
      hasRail: !!rail,
    };
  });
  check(
    "entrance CSS detaches after the reveal",
    revealed.attr === "(none)",
    `data-entrance=${revealed.attr}`,
  );
  check(
    "overlays are visible once revealed",
    revealed.count > 0 && revealed.hidden === 0,
    `${revealed.hidden}/${revealed.count} still hidden`,
  );

  // Sound toggle must be reachable during the entrance, so it is never hidden.
  const toggleHidden = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      /sound/i.test(b.getAttribute("aria-label") ?? ""),
    );
    return btn ? btn.closest(".entrance-hide") !== null : "missing";
  });
  check("sound toggle is exempt from the entrance hold", toggleHidden === false, String(toggleHidden));

  await context.close();
}

/* ---------- 2. skip gesture ---------- */
{
  const { context, page } = await newPage(browser);
  await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 450));
  const before = await page.evaluate(() => document.documentElement.dataset.entrance);
  await page.keyboard.press("Space");
  await new Promise((r) => setTimeout(r, 120));
  const after = await page.evaluate(() => ({
    phase: document.documentElement.dataset.entrance,
    overflow: document.body.style.overflow,
  }));
  await page.screenshot({ path: `${SHOTS}/07-skipped.png` });
  check(
    "any key skips straight to done",
    before !== "done" && after.phase === "done",
    `${before} → ${after.phase}`,
  );
  check("skip restores scrolling", after.overflow !== "hidden", `overflow=${after.overflow || "(empty)"}`);
  await context.close();
}

/* ---------- 3. scroll is held, then released ---------- */
{
  const { context, page } = await newPage(browser);
  await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 300));
  const locked = await page.evaluate(() => document.body.style.overflow);
  await new Promise((r) => setTimeout(r, 3400));
  const released = await page.evaluate(() => document.body.style.overflow);
  check(
    "scroll held during the entrance, released after",
    locked === "hidden" && released !== "hidden",
    `${locked} → ${released || "(empty)"}`,
  );
  await context.close();
}

/* ---------- 4. returning visitor ---------- */
{
  const { context, page } = await newPage(browser);
  await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
  // Let the entrance play through, then come back the way a visitor would.
  await page.waitForFunction(() => document.documentElement.dataset.entrance === "done", {
    timeout: 8000,
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 400));
  const state = await page.evaluate(() => ({
    entrance: document.documentElement.dataset.entrance ?? "(none)",
    quick: document.documentElement.dataset.entranceQuick ?? "(none)",
    overflow: document.body.style.overflow,
  }));
  await page.screenshot({ path: `${SHOTS}/08-returning.png` });
  check(
    "returning visitor skips the entrance",
    state.entrance === "(none)" && state.quick === "1",
    JSON.stringify(state),
  );
  check("returning visitor can scroll immediately", state.overflow !== "hidden");
  await context.close();
}

/* ---------- 5. deep link ---------- */
{
  const { context, page } = await newPage(browser);
  await page.goto(`${ORIGIN}/work`, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 500));
  const state = await page.evaluate(() => ({
    entrance: document.documentElement.dataset.entrance ?? "(none)",
    overflow: document.body.style.overflow,
    hasHeading: !!document.querySelector("h1"),
  }));
  check(
    "deep link renders content with no entrance",
    state.entrance === "(none)" && state.overflow !== "hidden" && state.hasHeading,
    JSON.stringify(state),
  );
  await context.close();
}

/* ---------- 6. reduced motion ---------- */
{
  const { context, page } = await newPage(browser, { reducedMotion: true });
  await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
  const phases = await recordPhases(page, 2000);
  const order = phases.map((p) => p.phase);
  const doneAt = phases.find((p) => p.phase === "done")?.at ?? -1;
  await page.screenshot({ path: `${SHOTS}/09-reduced-motion.png` });
  console.log("  phases:", phases.map((p) => `${p.phase}@${p.at}ms`).join(" → "));
  check(
    "reduced motion skips burst, fly and hold",
    !order.includes("arrival") && !order.includes("wrong") && !order.includes("snap"),
    order.join(" → "),
  );
  check("reduced motion resolves fast", doneAt > 0 && doneAt < 1200, `done at ${doneAt}ms`);
  await context.close();
}

/* ---------- 7. no WebGL ---------- */
{
  const { context, page } = await newPage(browser, { webgl: false });
  await page.goto(`${ORIGIN}/`, { waitUntil: "domcontentloaded" });
  const phasesPromise = recordPhases(page, 2600);
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: `${SHOTS}/10-nowebgl-wipe.png` });

  // Count the wordmarks on screen mid-wipe. The fixed fallback mark and the
  // reading page's first section are the same name, so both at once is a bug.
  const midWipe = await page.evaluate(() => {
    const fixed = document.querySelector("[data-lab-fallback]");
    return {
      fixedOpacity: fixed ? getComputedStyle(fixed).opacity : "(missing)",
      sections: document.querySelectorAll("section").length,
    };
  });
  check(
    "only one wordmark on screen during the wipe",
    Number(midWipe.fixedOpacity) > 0.9 && midWipe.sections === 0,
    JSON.stringify(midWipe),
  );

  const phases = await phasesPromise;
  const order = phases.map((p) => p.phase);
  console.log("  phases:", phases.map((p) => `${p.phase}@${p.at}ms`).join(" → "));
  await page.screenshot({ path: `${SHOTS}/11-nowebgl-done.png` });

  check(
    "no-WebGL path wipes the wordmark instead of bursting",
    order.includes("snap") && !order.includes("arrival") && !order.includes("wrong"),
    order.join(" → "),
  );
  const fallback = await page.evaluate(() => {
    const el = document.querySelector("[data-lab-fallback]");
    const first = document.querySelector("section [role='img']");
    return {
      fixedOpacity: el ? getComputedStyle(el).opacity : "(missing)",
      firstSectionMark: first?.getAttribute("aria-label") ?? null,
      sections: document.querySelectorAll("section").length,
    };
  });
  check(
    "no-WebGL story renders as stacked sections",
    fallback.sections >= 5 && fallback.firstSectionMark !== null,
    JSON.stringify(fallback),
  );
  check(
    "fixed mark hands over to the story instead of doubling it",
    Number(fallback.fixedOpacity) < 0.1,
    `fixed opacity ${fallback.fixedOpacity}`,
  );
  await context.close();
}

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
console.log(`screenshots: ${SHOTS}`);
if (failed.length) process.exit(1);
