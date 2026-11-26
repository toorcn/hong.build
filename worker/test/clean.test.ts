import { describe, expect, it } from "vitest";
import { cleanLocation, cleanName } from "../events/normalize";

describe("cleanName", () => {
  it.each([
    ["AI x EI = BI - Sparq Training / Eventsize", "AI x EI = BI - Sparq Training"],
    ["Agentic AI Workshop Penang — Turn AI Into Your Hardest-Working Employee / Events", "Agentic AI Workshop Penang — Turn AI Into Your Hardest-Working Employee"],
    ["Malaysia Entrepreneurs Network (Kuala Lumpur) Monthly Meetup, Thu, Dec 10, 2026, 7:00 PM", "Malaysia Entrepreneurs Network (Kuala Lumpur) Monthly Meetup"],
    ["AI Confidence!, Tue, Nov 10, 2026, 7:00 PM / Meetup", "AI Confidence!"],
    ["GAICC AI Governance Conference Malaysia 2027 / Governing the AI Future Tickets,", "GAICC AI Governance Conference Malaysia 2027 / Governing the AI Future"],
    ["Founder’s Connect & Grow:  Exploring AI, Ads & Business Growth for 2027 / Events", "Founder’s Connect & Grow: Exploring AI, Ads & Business Growth for 2027"],
    ["Sea x OpenAI Regional Codex Hackathon - Malaysia", "Sea x OpenAI Regional Codex Hackathon - Malaysia"],
    ["Code Meets Animation - SwiftLah! Community x LottieFiles", "Code Meets Animation - SwiftLah! Community x LottieFiles"],
  ])("cleans %j", (input, expected) => {
    expect(cleanName(input)).toBe(expected);
  });
});

describe("cleanLocation", () => {
  it.each([
    ["Bandar Sunway, Petaling Jaya, Petaling Jaya, Malaysia", "Bandar Sunway, Petaling Jaya"],
    ["Taman Tun Dr Ismail, Kuala Lumpur, Kuala Lumpur, Malaysia", "Taman Tun Dr Ismail, Kuala Lumpur"],
    ["Malaysia", "Malaysia"],
    ["Singapore", "Singapore"],
  ])("cleans %j", (input, expected) => {
    expect(cleanLocation(input)).toBe(expected);
  });
});
