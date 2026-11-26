import { describe, expect, it } from "vitest";
import { eventId, normalizeUrl } from "../events/id";

describe("normalizeUrl", () => {
  it("strips tracking, fragments, case and trailing slashes", () => {
    expect(normalizeUrl("https://Luma.com/cwe18vhn/?utm_source=x&ref=y#top")).toBe(
      "https://luma.com/cwe18vhn?ref=y",
    );
    expect(normalizeUrl(" https://luma.com/cwe18vhn?utm_medium=a&UTM_campaign=b ")).toBe(
      "https://luma.com/cwe18vhn",
    );
  });

  it("only accepts https", () => {
    expect(normalizeUrl("http://luma.com/x")).toBeNull();
    expect(normalizeUrl("not a url")).toBeNull();
  });
});

describe("eventId", () => {
  it("is 16 hex characters and stable across URL variants", async () => {
    const a = await eventId(normalizeUrl("https://luma.com/cwe18vhn")!);
    const b = await eventId(normalizeUrl("https://LUMA.com/cwe18vhn/?utm_source=wa")!);
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(b).toBe(a);
  });

  it("differs for different events", async () => {
    expect(await eventId("https://luma.com/a")).not.toBe(await eventId("https://luma.com/b"));
  });
});
