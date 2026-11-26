import { describe, expect, it } from "vitest";
import { resolvePlace } from "../events/places";
import { resolveTopic } from "../events/topics";

describe("resolvePlace", () => {
  it.each([
    ["Petaling Jaya", "kv", null],
    ["Bangsar South, Kuala Lumpur", "kv", null],
    ["Common Ground, TTDI", "kv", null],
    ["Singapore", "sg", "SG"],
    ["Online (Zoom)", "online", "ONLINE"],
    ["Penang", "other", "PENANG"],
    ["Tokyo, Japan", "other", "TOKYO"],
  ])("places %j", (text, region, tag) => {
    expect(resolvePlace(text)).toEqual({ region, placeTag: tag, known: true });
  });

  it("keeps unknown places on the main line but says so", () => {
    expect(resolvePlace("Somewhere Mysterious")).toEqual({ region: "kv", placeTag: null, known: false });
  });

  it("lets an explicit region win", () => {
    expect(resolvePlace("Marina Bay", "sg")).toEqual({ region: "sg", placeTag: "SG", known: true });
    expect(resolvePlace("Bali, Indonesia", "other")).toEqual({ region: "other", placeTag: "BALI", known: true });
    expect(resolvePlace("Ubud", "other")).toEqual({ region: "other", placeTag: "UBUD", known: true });
    expect(resolvePlace("Penang", "kv")).toEqual({ region: "kv", placeTag: null, known: true });
  });
});

describe("resolveTopic", () => {
  it.each([
    ["Code Meets Animation - SwiftLah! Community x LottieFiles", "design"],
    ["AI Tinker Night", "ai"],
    ["Weekend Hack Sprint", "hack"],
    ["Build an AI agent: 24h hackathon", "hack"],
    ["Hardware Jam", "hardware"],
    ["Founders Coffee", "founder"],
    ["Startup Pitch Brunch", "founder"],
    ["Building with Rust", "community"],
    ["Guild meetup", "community"],
  ])("guesses %j", (name, topic) => {
    expect(resolveTopic(name)).toBe(topic);
  });

  it("lets an explicit topic win", () => {
    expect(resolveTopic("AI talk", "hardware")).toBe("hardware");
  });
});
