import { defineConfig, devices } from "@playwright/test";

/** Captures the screenshots used in the in-app guide: `npm run guide:shots`. */
export default defineConfig({
  testDir: "tests/guide",
  use: { baseURL: "http://localhost:4179/events/", ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
  webServer: { command: "npx vite --port 4179 --strictPort", url: "http://localhost:4179/events/", reuseExistingServer: true },
});
