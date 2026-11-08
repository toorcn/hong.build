import { fixture } from "./fixture";
import { centre, expect, test } from "./setup";

/** A dozen extra December meetups so the line is long enough to scroll on any viewport. */
const extra = Array.from({ length: 12 }, (_, i) => {
  const day = String(i + 1).padStart(2, "0");
  return { ...fixture.events[3]!, id: `b${String(i).padStart(15, "0")}`, name: `Extra Meetup ${i + 1}`, date: `2026-12-${day}`, start: `2026-12-${day}T11:00:00.000Z` };
});

test("arrow keys move the train a day at a time", async ({ page }) => {
  await page.goto("./");
  const train = page.getByRole("slider", { name: "Train: choose a day" });
  await expect(train).toHaveAttribute("aria-orientation", "vertical");
  await train.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByTestId("pids")).toContainText("STATION · MON 9 NOV");
  await expect(train).toHaveAttribute("aria-valuetext", "Mon 9 Nov");
  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("pids")).toContainText("NOW · SAT 7 NOV");
});

test("dragging the train snaps it to the nearest day", async ({ page }) => {
  await page.goto("./");
  const train = page.getByRole("slider", { name: "Train: choose a day" });
  const target = page.getByRole("button", { name: /^Wed 11 Nov/ });
  const from = (await train.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByTestId("pids")).toContainText("STATION · WED 11 NOV");
  await expect(train).toHaveAttribute("aria-valuetext", "Wed 11 Nov");
});

test("tapping a day sends the train there and runs its branch", async ({ page }) => {
  await page.goto("./");
  const day = page.getByRole("button", { name: /^Tue 17 Nov/ });
  await centre(day);
  await day.click();
  await expect(page.getByTestId("pids")).toContainText("STATION · TUE 17 NOV");
  await expect(page.locator(".spur").first()).toHaveClass(/\bgo\b/);
});

test.describe("on a long timetable", () => {
  test.use({ timetable: { ...fixture, events: [...fixture.events, ...extra] } });
  test("Back to now appears after scrolling away and returns to today", async ({ page }) => {
    await page.goto("./");
    await page.locator(".tx-map").evaluate((el) => el.scrollTo({ top: 600 }));
    const back = page.getByRole("button", { name: "↑ Back to now" });
    await expect(back).toBeVisible();
    await back.click();
    await expect(page.getByTestId("pids")).toContainText("NOW · SAT 7 NOV");
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("branches don't animate", async ({ page }) => {
    await page.goto("./");
    const day = page.getByRole("button", { name: /^Tue 17 Nov/ });
    await centre(day);
    await day.click();
    await expect(page.getByTestId("pids")).toContainText("STATION · TUE 17 NOV");
    await expect(page.locator(".spur.go")).toHaveCount(0);
  });
});
