import { fixture } from "./fixture";
import { expect, test } from "./setup";

test("today is the first station, with live statuses", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("button", { name: "Sat 7 Nov, today: 3 events" })).toBeVisible();
  await expect(page.getByText("You are here")).toBeVisible();
  await expect(page.getByTestId("pids")).toContainText("NOW · SAT 7 NOV");
  await expect(page.getByRole("button", { name: /Weekend Hack Sprint/ })).toContainText("LIVE NOW");
  await expect(page.getByRole("button", { name: /Builders Demo Night/ })).toContainText("BOARDING · 38 MIN");
  await expect(page.getByRole("button", { name: /Morning Design Crit/ })).toContainText("DEPARTED");
});

test("branches appear only on days with overseas or online events", async ({ page }) => {
  await page.goto("./");
  const spurs = page.locator(".spur");
  await expect(spurs).toHaveCount(2);
  await expect(spurs.nth(0)).toContainText("OVERSEAS LINK");
  await expect(spurs.nth(0)).toContainText("SG Product Circle");
  await expect(spurs.nth(1)).toContainText("ONLINE LINK");
  await expect(spurs.nth(1)).toContainText("CLOSES IN 13D");
});

test.describe("with nothing scheduled", () => {
  test.use({ timetable: { ...fixture, events: [] } });
  test("says so and offers the subscription", async ({ page }) => {
    await page.goto("./");
    await expect(page.getByTestId("pids")).toContainText("NO SERVICE SCHEDULED");
    await expect(page.getByText("No departures yet.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Subscribe", exact: true })).toHaveAttribute("href", "webcal://events.hong.build/events.ics");
  });
});

test.describe("when OpenClaw has gone quiet", () => {
  test.use({ timetable: { ...fixture, last_ingest_at: "2026-11-04T00:00:00.000Z" } });
  test("the display admits the timetable is old", async ({ page }) => {
    await page.goto("./");
    await expect(page.getByTestId("pids")).toContainText("TIMETABLE UPDATED 3D AGO");
    await expect(page.getByRole("status", { name: "Service notice" })).toContainText("TIMETABLE UPDATED 3D AGO");
  });
});

test("falls back to the saved timetable when the API is down", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByTestId("pids")).toContainText("NOW · SAT 7 NOV");
  await page.route("**/api/events", (route) => route.abort());
  await page.reload();
  await expect(page.getByTestId("pids")).toContainText("SERVICE DISRUPTION · SHOWING SAVED TIMETABLE");
  await expect(page.getByRole("button", { name: /AI Tinker Night/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  await expect(page.getByRole("status", { name: "Service notice" })).toContainText("SERVICE DISRUPTION");

  await page.route("**/api/events", (route) => route.fulfill({ json: fixture }));
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByTestId("pids")).toContainText("NOW · SAT 7 NOV");
  await expect(page.getByTestId("pids")).not.toContainText("SERVICE DISRUPTION");
  await expect(page.getByRole("status", { name: "Service notice" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Retry" })).toHaveCount(0);
});

test("shows a friendly error with no saved copy", async ({ page }) => {
  await page.route("**/api/events", (route) => route.abort());
  await page.goto("./");
  await expect(page.getByText("We can’t reach the timetable right now.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("recovers from the error screen when the API comes back", async ({ page }) => {
  await page.route("**/api/events", (route) => route.abort());
  await page.goto("./");
  await expect(page.getByText("We can’t reach the timetable right now.")).toBeVisible();
  await page.route("**/api/events", (route) => route.fulfill({ json: fixture }));
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("button", { name: "Sat 7 Nov, today: 3 events" })).toBeVisible();
});

test("the end of the line credits the timetable and its maker", async ({ page }) => {
  await page.goto("./");
  const credits = page.getByRole("region", { name: "Credits" });
  await expect(credits).toContainText("END OF LINE");
  await expect(credits).toContainText("OpenClaw");
  for (const link of await credits.getByRole("link", { name: "Hong Bing" }).all()) {
    await expect(link).toHaveAttribute("href", "https://www.linkedin.com/in/hong-bing");
  }
  await expect(credits.getByRole("link", { name: "Hong Bing" })).toHaveCount(3);
  await expect(credits.getByRole("link", { name: "hong.build", exact: true })).toHaveAttribute("href", "https://hong.build");
  await expect(credits.getByRole("link", { name: "hi@hong.build" })).toHaveAttribute("href", /^mailto:hi@hong\.build/);
});

test("the display counts down to the next departure", async ({ page }) => {
  await page.goto("./");
  // 18:52 now; Builders Demo Night leaves at 19:30.
  await expect(page.getByTestId("pids")).toContainText("NEXT IN 00:38:00");
});
