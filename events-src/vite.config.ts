/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const worker = "http://localhost:8787"; // `npx wrangler dev --port 8787` from the repo root

export default defineConfig({
  base: "/events/",
  plugins: [react(), tailwindcss()],
  build: { outDir: "../public/events", emptyOutDir: true },
  server: {
    port: 4179,
    strictPort: true,
    proxy: { "/api": worker, "/e/": worker, "/events.ics": worker },
  },
  test: { include: ["tests/unit/**/*.test.ts"], environment: "node" },
});
