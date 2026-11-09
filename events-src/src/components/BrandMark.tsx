/** Builder Line mark: a main line with stations and one teal branch, like the map itself. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <rect width="28" height="28" rx="8" fill="var(--fg)" />
      <path d="M10 5.5v17M10 13.5c0 2.8 1.8 4 4.5 4H19" fill="none" stroke="var(--bg)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="10" cy="8" r="2.4" fill="var(--fg)" stroke="var(--bg)" strokeWidth="1.8" />
      <circle cx="10" cy="20" r="2.4" fill="var(--fg)" stroke="var(--bg)" strokeWidth="1.8" />
      <circle cx="20" cy="17.5" r="2.4" fill="var(--fg)" stroke="#00a3a3" strokeWidth="1.8" />
      <rect x="7.6" y="11" width="4.8" height="5.4" rx="2.2" fill="#e8453c" />
    </svg>
  );
}
