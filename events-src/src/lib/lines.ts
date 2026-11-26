import type { IconName } from "../components/Icon";
import type { Topic } from "../types";

export const LINES: Record<Topic, { name: string; color: string; icon: IconName }> = {
  ai: { name: "AI Line", color: "#e8453c", icon: "sparkles" },
  founder: { name: "Founder Line", color: "#2f6fde", icon: "rocket" },
  hack: { name: "Hack Line", color: "#1aa260", icon: "terminal" },
  design: { name: "Design Line", color: "#9b51e0", icon: "pen" },
  hardware: { name: "Hardware Line", color: "#f39c12", icon: "cpu" },
  community: { name: "Community Line", color: "#8a8f98", icon: "users" },
};
