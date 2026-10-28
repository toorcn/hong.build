import { useEffect, useState } from 'react'
import { sections, type SectionId } from '../data/guide'
import { categories, qaData } from '../data/qa'
import { go } from '../lib/nav'

const counts = qaData.reduce<Record<string, number>>((acc, q) => {
  acc[q.category] = (acc[q.category] ?? 0) + 1
  return acc
}, {})

/** Tracks which section is under the top third of the viewport. */
function useActiveSection() {
  const [active, setActive] = useState<SectionId>('start')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id as SectionId)
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    for (const { id } of sections) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  return active
}

export function Sidebar() {
  const active = useActiveSection()

  return (
    <nav aria-label="Contents" className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-10">
      <p className="label mb-4">Contents</p>
      <ol className="space-y-px border-l border-line">
        {sections.map((s, i) => {
          const isActive = active === s.id
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => go({ section: s.id }, e)}
                aria-current={isActive ? 'true' : undefined}
                className={`focus-ring -ml-px flex items-baseline gap-3 border-l py-1.5 pl-4 text-sm transition-colors ${
                  isActive ? 'border-accent text-type' : 'border-transparent text-type-dim hover:text-type'
                }`}
              >
                <span className="font-mono text-[10px] text-type-faint">{String(i + 1).padStart(2, '0')}</span>
                {s.label}
              </a>
              {s.id === 'questions' && (
                <ul className="mb-2 mt-1 space-y-px">
                  {categories.map((c) => (
                    <li key={c.id}>
                      <a
                        href={`#questions/${c.id}`}
                        onClick={(e) => go({ category: c.id }, e)}
                        className="focus-ring flex justify-between gap-3 py-1 pl-11 pr-2 text-[13px] text-type-faint transition-colors hover:text-type"
                      >
                        {c.label}
                        <span className="font-mono text-[10px]">{counts[c.id]}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Mobile: one scrollable strip of sections under the header. */
export function SectionBar() {
  const active = useActiveSection()

  // Scroll only the strip; scrollIntoView here would cancel the page's own smooth scroll.
  useEffect(() => {
    const link = document.getElementById(`bar-${active}`)
    const strip = link?.closest('ol')
    if (link && strip) {
      strip.scrollTo({ left: link.offsetLeft - strip.clientWidth / 2 + link.clientWidth / 2, behavior: 'smooth' })
    }
  }, [active])

  return (
    <nav aria-label="Sections" className="border-b border-line bg-void/95 backdrop-blur-md lg:hidden">
      <ol className="no-scrollbar flex gap-1 overflow-x-auto px-3 py-2">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              id={`bar-${s.id}`}
              href={`#${s.id}`}
              onClick={(e) => go({ section: s.id }, e)}
              className={`focus-ring block whitespace-nowrap px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                active === s.id ? 'text-accent' : 'text-type-faint'
              }`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
