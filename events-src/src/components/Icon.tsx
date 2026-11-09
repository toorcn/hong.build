import type { SVGProps } from "react";

/** Small stroke icon set (24x24 grid, 1.75 stroke), so the UI never relies on emoji. */
const PATHS = {
  sun: "M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z",
  moon: "M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z",
  bell: "M6 9a6 6 0 1112 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10 20a2 2 0 004 0",
  "bell-off": "M6.3 6.3A6 6 0 0018 9c0 3 .7 4.7 1.4 5.8M6 9c0 6-2.5 7.5-2.5 7.5h11M10 20a2 2 0 004 0M3 3l18 18",
  ticket: "M3 8a2 2 0 012-2h14a2 2 0 012 2v1.5a2.5 2.5 0 000 5V16a2 2 0 01-2 2H5a2 2 0 01-2-2v-1.5a2.5 2.5 0 000-5V8zM14 6v12",
  bookmark: "M6 4h12v17l-6-4-6 4V4z",
  "calendar-plus": "M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zM4 10h16M8 3v4M16 3v4M12 13v5M9.5 15.5h5",
  calendar: "M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zM4 10h16M8 3v4M16 3v4",
  clock: "M12 4a8 8 0 100 16 8 8 0 000-16zM12 8v4l2.5 2.5",
  pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11zM12 7.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z",
  user: "M12 4a4 4 0 100 8 4 4 0 000-8zM4.5 20a7.5 7.5 0 0115 0",
  tag: "M3 12.2V4a1 1 0 011-1h8.2a1 1 0 01.7.3l8 8a1 1 0 010 1.4l-7.2 7.2a1 1 0 01-1.4 0l-8-8a1 1 0 01-.3-.7zM8 8h.01",
  share: "M12 15V3M8 7l4-4 4 4M5 12v7a1 1 0 001 1h12a1 1 0 001-1v-7",
  "arrow-up-right": "M7 17L17 7M8 7h9v9",
  "arrow-up": "M12 19V5M6 11l6-6 6 6",
  x: "M6 6l12 12M18 6L6 18",
  check: "M5 12.5l4.5 4.5L19 7.5",
  info: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v5.5M12 7.5h.01",
  hand: "M8 13V5.5a1.5 1.5 0 013 0V11m0-1.5V4a1.5 1.5 0 013 0v6m0-1a1.5 1.5 0 013 0v2m0-.5a1.5 1.5 0 013 0V15a6 6 0 01-6 6h-1.5a6 6 0 01-4.6-2.2L5 15.5a1.6 1.6 0 012.4-2L8 14",
  link: "M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1",
  sparkles: "M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9L11 3zM18.5 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1z",
  rocket: "M14 4.5C16.5 2.3 21 3 21 3s.7 4.5-1.5 7L13 16.5 7.5 11 14 4.5zM7.5 11H4l2.5-3.5H11M13 16.5V20l3.5-2.5V13M6 15.5c-1.6.6-2.5 2.6-3 5.5 2.9-.5 4.9-1.4 5.5-3",
  terminal: "M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM7.5 9.5L10 12l-2.5 2.5M12.5 15H16",
  pen: "M4 20l1.5-6L15 4.5a2.1 2.1 0 013 0l1.5 1.5a2.1 2.1 0 010 3L10 18.5 4 20zM13.5 6l4.5 4.5M4 20l4.5-4.5",
  cpu: "M7 6h10a1 1 0 011 1v10a1 1 0 01-1 1H7a1 1 0 01-1-1V7a1 1 0 011-1zM10 10h4v4h-4zM9.5 3v3M14.5 3v3M9.5 18v3M14.5 18v3M3 9.5h3M3 14.5h3M18 9.5h3M18 14.5h3",
  users: "M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20a6.5 6.5 0 0113 0M15.5 4.3a3.5 3.5 0 010 6.4M17.5 14a6.5 6.5 0 014 6",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16, ...rest }: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={name === "bookmark" && rest.className?.includes("filled") ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
