import { centre, test } from "../e2e/setup";

const out = (name: string) => `public/guide/${name}.jpg`;

test("guide screenshots", async ({ page }) => {
  await page.goto("./");
  await page.waitForTimeout(1200); // let the split-flap settle

  // The train and the platform display.
  await page.screenshot({ path: out("train"), type: "jpeg", quality: 80, clip: { x: 0, y: 50, width: 390, height: 290 } });

  // A ticket, kept.
  const stop = page.getByRole("button", { name: /Code Meets Animation/ });
  await centre(stop);
  await stop.click();
  await page.getByRole("button", { name: "Keep" }).click();
  await page.waitForTimeout(600);
  await page.locator(".tx-sheet").screenshot({ path: out("ticket"), type: "jpeg", quality: 80 });
  await page.keyboard.press("Escape");

  // A second kept event, then My Journey.
  const other = page.getByRole("button", { name: /AI Tinker Night/ });
  await centre(other);
  await other.click();
  await page.getByRole("button", { name: "Keep" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /My Journey/ }).click();
  await page.waitForTimeout(600);
  await page.locator(".tx-sheet").screenshot({ path: out("wallet"), type: "jpeg", quality: 80 });
});
