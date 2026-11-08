import { describe, expect, it, vi } from "vitest";
import worker from "../index";
import { makeEnv } from "./helpers/events";

function env() {
  const assets = {
    fetch: vi.fn(async (req: Request) =>
      new Response(`asset:${new URL(req.url).pathname}`, { headers: { "content-type": "text/html" } }),
    ),
  };
  return { ...makeEnv(), ASSETS: assets };
}
const call = (url: string, init?: RequestInit, e = env()) =>
  (worker.fetch as (r: Request, e: unknown) => Promise<Response>)(new Request(url, init), e);

describe("events routing", () => {
  it("serves the app shell for any page on events.hong.build", async () => {
    for (const path of ["/", "/some/deep/link"]) {
      const res = await call(`https://events.hong.build${path}`);
      expect(await res.text()).toBe("asset:/events/");
      expect(res.headers.get("cache-control")).toBe("public, max-age=0, must-revalidate");
    }
  });

  it("passes the app's own files through", async () => {
    const res = await call("https://events.hong.build/events/favicon.svg");
    expect(await res.text()).toBe("asset:/events/favicon.svg");
  });

  it("redirects hong.build/events to the subdomain", async () => {
    for (const path of ["/events", "/events/"]) {
      const res = await call(`https://hong.build${path}`);
      expect(res.status).toBe(308);
      expect(res.headers.get("location")).toBe("https://events.hong.build/");
    }
  });

  it("answers the API on either host", async () => {
    const res = await call("https://hong.build/api/events");
    expect(res.status).toBe(200);
    expect(Array.isArray(((await res.json()) as { events: unknown }).events)).toBe(true);
  });

  it("only allows POST to ingest and GET elsewhere on the subdomain", async () => {
    const getIngest = await call("https://events.hong.build/api/events/ingest");
    expect(getIngest.status).toBe(405);
    expect(getIngest.headers.get("allow")).toBe("POST");
    const postApi = await call("https://events.hong.build/api/events", { method: "POST" });
    expect(postApi.status).toBe(405);
  });

  it("leaves the main site alone", async () => {
    const res = await call("https://hong.build/hackathons");
    expect(await res.text()).toBe("asset:/hackathons");
  });
});
