import { fixture } from "./fixture";
import { centre, expect, test } from "./setup";

/** n extra meetups across December, all kept, so the wallet is long. */
function many(n: number) {
  const events = Array.from({ length: n }, (_, i) => {
    const day = String((i % 28) + 1).padStart(2, "0");
    return { ...fixture.events[3]!, id: `c${String(i).padStart(15, "0")}`, name: `Kept Meetup ${i + 1}`, date: `2026-12-${day}`, start: `2026-12-${day}T11:00:00.000Z` };
  });
  return { events, ids: events.map((e) => e.id) };
}
const lots = many(40);
const tooMany = many(201);


test("a station opens its ticket with sign-up and calendar links", async ({ page }) => {
  await page.goto("./");
  const stop = page.getByRole("button", { name: /AI Tinker Night/ });
  await centre(stop);
  await stop.click();
  const ticket = page.getByTestId("ticket");
  await expect(ticket).toContainText("AI LINE");
  await expect(ticket.getByRole("heading", { name: "AI Tinker Night" })).toBeFocused();
  await expect(ticket.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "https://luma.com/tinker");
  await expect(ticket.getByRole("link", { name: "Calendar" })).toHaveAttribute("href", "/e/a000000000000004.ics");
  await expect(page).toHaveURL(/#e=a000000000000004$/);
});

test("Escape closes the ticket and returns focus to the station", async ({ page, isMobile }) => {
  await page.goto("./");
  const stop = page.getByRole("button", { name: /AI Tinker Night/ });
  await centre(stop);
  await stop.click();
  await page.keyboard.press("Escape");
  if (isMobile) await expect(page.getByTestId("ticket")).toHaveCount(0);
  await expect(stop).toBeFocused();
  await expect(page).not.toHaveURL(/#e=/);
});

test("kept tickets are stamped, counted, remembered and exportable", async ({ page }) => {
  await page.goto("./");
  const stop = page.getByRole("button", { name: /AI Tinker Night/ });
  await centre(stop);
  await stop.click();
  await page.getByRole("button", { name: "Keep" }).click();
  await expect(page.getByTestId("ticket")).toHaveClass(/kept/);
  await expect(page.getByRole("button", { name: "My Journey, 1 kept" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.reload();
  await page.getByRole("button", { name: "My Journey, 1 kept" }).click();
  const wallet = page.getByTestId("wallet");
  await expect(wallet).toContainText("AI Tinker Night");
  await expect(wallet.getByRole("link", { name: "Add 1 to my calendar" })).toHaveAttribute(
    "href",
    "/api/events/plan.ics?ids=a000000000000004",
  );
  await expect(wallet.getByRole("link", { name: "Subscribe to the whole line" })).toHaveAttribute(
    "href",
    "webcal://events.hong.build/events.ics",
  );
});

test("a shared link opens straight to the ticket", async ({ page }) => {
  await page.goto("./#e=a000000000000006");
  await expect(page.getByTestId("ticket")).toContainText("SG Product Circle");
  await expect(page.getByTestId("ticket")).toContainText("19:00 SGT");
});

test("a link to an event that has gone says so", async ({ page }) => {
  await page.goto("./#e=ffffffffffffffff");
  await expect(page.getByRole("status", { name: "Notification" })).toHaveText("That event has left the line");
});

test("night service switches theme and is remembered", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Night service" }).click();
  await expect(page.locator("html")).toHaveClass(/night/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/night/);
});

test("the station chime can be turned on", async ({ page }) => {
  await page.goto("./");
  const chime = page.getByRole("button", { name: "Station chime" });
  await expect(chime).toHaveAttribute("aria-pressed", "false");
  await chime.click();
  await expect(chime).toHaveAttribute("aria-pressed", "true");
});

test("desktop shows the ticket beside the line and can copy a link", async ({ page, context }, info) => {
  test.skip(info.project.name !== "desktop", "desktop layout only");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  // Desktop Chrome on macOS has a native share sheet; force the copy-link path the test can observe.
  await page.addInitScript(() => Object.defineProperty(navigator, "share", { value: undefined, configurable: true }));
  await page.goto("./");
  await expect(page.getByText("Tap a station to see its ticket.")).toBeVisible();
  await page.getByRole("button", { name: /Builders Demo Night/ }).click();
  await expect(page.getByRole("complementary").getByTestId("ticket")).toContainText("Builders Demo Night");
  await page.getByRole("button", { name: "Share this event" }).click();
  await expect(page.getByRole("status", { name: "Notification" })).toHaveText("Link copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("https://events.hong.build/#e=a000000000000003");
});

test("the phone sheet traps focus and hands it back on Escape", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phone sheet only");
  await page.goto("./");
  const stop = page.getByRole("button", { name: /AI Tinker Night/ });
  await centre(stop);
  await stop.click();
  const inDialog = () => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(await inDialog()).toBe(true);
  }
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Shift+Tab");
    expect(await inDialog()).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(stop).toBeFocused();
});

test("a failed copy says so", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "desktop layout only");
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    Object.defineProperty(navigator, "clipboard", { value: { writeText: () => Promise.reject(new Error("denied")) }, configurable: true });
  });
  await page.goto("./");
  await page.getByRole("button", { name: /Builders Demo Night/ }).click();
  await page.getByRole("button", { name: "Share this event" }).click();
  await expect(page.getByRole("status", { name: "Notification" })).toHaveText("Couldn't copy the link");
});

test("the chime preference survives a reload", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Station chime" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Station chime" })).toHaveAttribute("aria-pressed", "true");
});

test("cancelling the share sheet is silent and copies nothing", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "desktop layout only");
  await page.addInitScript(() => {
    (window as unknown as { __copied: string[] }).__copied = [];
    Object.defineProperty(navigator, "share", {
      value: () => Promise.reject(new DOMException("cancelled", "AbortError")),
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: (t: string) => ((window as unknown as { __copied: string[] }).__copied.push(t), Promise.resolve()) },
      configurable: true,
    });
  });
  await page.goto("./");
  await page.getByRole("button", { name: /Builders Demo Night/ }).click();
  await page.getByRole("button", { name: "Share this event" }).click();
  await page.waitForTimeout(1000);
  await expect(page.getByRole("status", { name: "Notification" })).toHaveText("");
  expect(await page.evaluate(() => (window as unknown as { __copied: string[] }).__copied)).toEqual([]);
});

test("a share that fails for another reason falls back to copying the link", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "desktop layout only");
  await page.addInitScript(() => {
    (window as unknown as { __copied: string[] }).__copied = [];
    Object.defineProperty(navigator, "share", {
      value: () => Promise.reject(new DOMException("blocked", "NotAllowedError")),
      configurable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: (t: string) => ((window as unknown as { __copied: string[] }).__copied.push(t), Promise.resolve()) },
      configurable: true,
    });
  });
  await page.goto("./");
  await page.getByRole("button", { name: /Builders Demo Night/ }).click();
  await page.getByRole("button", { name: "Share this event" }).click();
  await expect(page.getByRole("status", { name: "Notification" })).toHaveText("Link copied");
  expect(await page.evaluate(() => (window as unknown as { __copied: string[] }).__copied)).toEqual([
    "https://events.hong.build/#e=a000000000000003",
  ]);
});

test.describe("a long wallet", () => {
  test.use({ timetable: { ...fixture, events: [...fixture.events, ...lots.events] } });
  test("scrolls inside the phone sheet so the last ticket can be reached", async ({ page }, info) => {
    test.skip(info.project.name !== "phone", "phone sheet only");
    await page.addInitScript((ids) => localStorage.setItem("builderline.kept", JSON.stringify(ids)), lots.ids);
    await page.goto("./");
    await page.getByRole("button", { name: "My Journey, 40 kept" }).click();
    const wallet = page.getByTestId("wallet");
    const last = wallet.getByRole("button", { name: /Kept Meetup 40/ });
    await last.scrollIntoViewIfNeeded();
    const sheet = page.locator(".tx-sheet");
    const box = (await sheet.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    await last.click();
    await expect(page.getByTestId("ticket")).toContainText("Kept Meetup 40");
  });
});

test.describe("an oversized wallet", () => {
  test.use({ timetable: { ...fixture, events: [...fixture.events, ...tooMany.events] } });
  test("offers the subscription instead of a calendar file the server would refuse", async ({ page }) => {
    await page.addInitScript((ids) => localStorage.setItem("builderline.kept", JSON.stringify(ids)), tooMany.ids);
    await page.goto("./");
    await page.getByRole("button", { name: "My Journey, 201 kept" }).click();
    const wallet = page.getByTestId("wallet");
    await expect(wallet.getByRole("link", { name: /^Add \d+ to my calendar/ })).toHaveCount(0);
    await expect(wallet).toContainText("Too many to export in one file");
    await expect(wallet.getByRole("link", { name: "Subscribe to the whole line" })).toBeVisible();
  });
});

test("the info button opens a guide that explains keeping and subscribing", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Guide: how Builder Line works" }).click();
  const guide = page.getByTestId("guide");
  await expect(guide.getByRole("heading", { name: "How to ride the Builder Line" })).toBeFocused();
  await expect(guide).toContainText("Keep events, then add them all at once");
  await expect(guide).toContainText("https://events.hong.build/events.ics");
  await expect(guide.getByRole("img", { name: /event ticket/ })).toHaveAttribute("src", /\/events\/guide\/ticket\.jpg$/);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("guide")).toHaveCount(0);
});
