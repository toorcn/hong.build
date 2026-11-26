import { test as base, expect, type Locator } from "@playwright/test";
import type { EventsResponse } from "../../src/types";
import { fixture, NOW } from "./fixture";

export const test = base.extend<{ timetable: EventsResponse }>({
  timetable: [fixture, { option: true }],
  page: async ({ page, timetable }, use) => {
    await page.clock.setFixedTime(NOW);
    await page.route("**/api/events", (route) => route.fulfill({ json: timetable }));
    await use(page);
  },
});
export { expect };

/** Bring an element to the middle of the map so the floating display never covers it. */
export async function centre(locator: Locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: "center" }));
}
