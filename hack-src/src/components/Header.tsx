/** Mirrors the hong.build chrome: identity top-left, a way back to the journey top-right. */
export default function Header() {
  return (
    <header className="border-b border-line bg-void/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <a href="/" className="focus-ring group shrink-0" aria-label="Hong Bing — home">
          <span className="block whitespace-nowrap font-display text-base font-black leading-none tracking-tight text-type sm:text-lg">
            HONG BING
          </span>
          <span className="label mt-1 hidden transition-colors group-hover:text-accent sm:block">
            Field manual / hackathons
          </span>
        </a>
        <nav aria-label="Site links" className="flex shrink-0 items-center gap-4 sm:gap-6">
          <a href="/guestbook/sign" className="focus-ring whitespace-nowrap py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-accent transition-colors hover:text-type sm:text-[11px] sm:tracking-[0.14em]">Guestbook ↗</a>
          <a
            href="/notes"
            className="focus-ring hidden px-1 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-type-faint transition-colors hover:text-accent sm:block"
          >
            Run log
          </a>
          <a
            href="/"
            className="focus-ring whitespace-nowrap py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-type-dim transition-colors hover:text-accent sm:text-[11px] sm:tracking-[0.14em]"
          >
            <span className="sm:hidden">← Home</span><span className="hidden sm:inline">← Journey</span>
          </a>
        </nav>
      </div>
    </header>
  )
}
