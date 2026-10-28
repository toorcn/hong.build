/** Mirrors the hong.build chrome: identity top-left, a way back to the journey top-right. */
export default function Header() {
  return (
    <header className="border-b border-line bg-void/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <a href="/" className="focus-ring group" aria-label="Hong Bing — home">
          <span className="block font-display text-lg font-black leading-none tracking-tight text-type">
            HONG BING
          </span>
          <span className="label mt-1 hidden transition-colors group-hover:text-accent sm:block">
            Field manual / hackathons
          </span>
        </a>
        <nav className="flex items-center gap-3 sm:gap-4">
          <a href="/guestbook/sign" className="focus-ring border border-accent/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-accent transition-colors hover:border-accent sm:text-[11px] sm:tracking-[0.14em]">Leave a note ↗</a>
          <a
            href="/notes"
            className="focus-ring hidden px-1 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-type-faint transition-colors hover:text-accent sm:block"
          >
            Run log
          </a>
          <a
            href="/"
            className="focus-ring border border-line px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-type-dim transition-colors hover:border-accent hover:text-type"
          >
            ← Journey
          </a>
        </nav>
      </div>
    </header>
  )
}
