import { EVENT_LOGOS } from "@/content/event-logos";

/** Knock out white mattes while retaining each image's existing transparency. */
export function EventLogoFilters() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute" focusable="false">
      <defs>
        <filter id="event-logo-knockout" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -3 -3 -3 0 8"
          />
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
      </defs>
    </svg>
  );
}

export function EventLogo({ event }: { event: string }) {
  const logo = EVENT_LOGOS[event];
  const filter = logo?.treatment === "knockout-light"
    ? "url(#event-logo-knockout) brightness(0) invert(1)"
    : logo?.treatment === "knockout"
      ? "url(#event-logo-knockout)"
      : logo?.treatment === "light"
        ? "brightness(0) invert(1)"
        : undefined;
  const initials = event
    .split(/[\s:!×—]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden="true"
      title={logo ? `${logo.label} logo` : event}
      className={`row-span-2 flex size-11 shrink-0 items-center justify-center self-start sm:row-span-1 ${
        logo ? "" : "rounded-sm border border-line font-mono text-xs tracking-wider text-type-dim"
      }`}
    >
      {logo ? (
        <img
          src={logo.src}
          alt=""
          width={44}
          height={44}
          loading="lazy"
          decoding="async"
          className={`size-full object-contain ${event === "Hong Leong Bank Hackathon" ? "rounded-sm bg-white p-1" : ""}`}
          style={{ filter }}
        />
      ) : (
        initials
      )}
    </span>
  );
}
