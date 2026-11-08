import type { Topic } from "../types";

export const LINES: Record<Topic, { name: string; color: string; code: string }> = {
  ai: { name: "AI Line", color: "#e8453c", code: "AI" },
  founder: { name: "Founder Line", color: "#2f6fde", code: "FO" },
  hack: { name: "Hack Line", color: "#1aa260", code: "HK" },
  design: { name: "Design Line", color: "#9b51e0", code: "DS" },
  hardware: { name: "Hardware Line", color: "#f39c12", code: "HW" },
  community: { name: "Community Line", color: "#8a8f98", code: "CM" },
};
