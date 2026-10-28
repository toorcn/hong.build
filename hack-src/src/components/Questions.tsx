import { useEffect, useMemo, useRef, useState } from 'react'
import { categories, qaData, type QAItem } from '../data/qa'
import { CATEGORY_EVENT } from '../lib/nav'
import Section from './Section'

const votedStorageKey = 'hcc:qna-upvotes:v1'
const voterStorageKey = 'hcc:qna-voter:v1'

const categoryIds = new Set<string>(categories.map((c) => c.id))
const categoryLabel = Object.fromEntries(categories.map((c) => [c.id, c.label]))

/** Stable per-category ids (GS01, TR03…) so a question can be referred to out loud. */
const displayId = (() => {
  const seen: Record<string, number> = {}
  const code = Object.fromEntries(categories.map((c) => [c.id, c.code]))
  return Object.fromEntries(
    qaData.map((q) => {
      seen[q.category] = (seen[q.category] ?? 0) + 1
      return [q.id, `${code[q.category]}${String(seen[q.category]).padStart(2, '0')}`]
    }),
  )
})()

function categoryFromHash() {
  const match = location.hash.match(/^#questions\/([\w-]+)$/)
  return match && categoryIds.has(match[1]) ? match[1] : null
}

function matches(q: QAItem, query: string) {
  const haystack = [q.question, ...q.answer, ...q.tags].join(' ').toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word))
}

export default function Questions() {
  const [category, setCategory] = useState<string>(() => categoryFromHash() ?? 'all')
  const [query, setQuery] = useState('')
  const [openIds, setOpenIds] = useState<string[]>(() => {
    const id = location.hash.match(/^#q-([\w-]+)$/)?.[1]
    return id ? [id] : []
  })
  const votes = useVotes()
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onCategory = (e: Event) => {
      setCategory((e as CustomEvent<string>).detail)
      setQuery('')
    }
    window.addEventListener(CATEGORY_EVENT, onCategory)
    return () => window.removeEventListener(CATEGORY_EVENT, onCategory)
  }, [])

  // "/" jumps to search from anywhere, like most docs sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key !== '/' || target.matches('input, textarea, [contenteditable]')) return
      e.preventDefault()
      searchRef.current?.focus()
      searchRef.current?.scrollIntoView({ block: 'center' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // A shared #q-… link should land on its question, opened.
  useEffect(() => {
    if (openIds.length === 1 && location.hash === `#q-${openIds[0]}`) {
      document.getElementById(`q-${openIds[0]}`)?.scrollIntoView({ block: 'start' })
    }
    // Only on first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Searching looks across every category; the filter applies when browsing.
  const visible = useMemo(
    () =>
      query.trim()
        ? qaData.filter((q) => matches(q, query))
        : qaData.filter((q) => category === 'all' || q.category === category),
    [category, query],
  )

  const toggle = (id: string) =>
    setOpenIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const filters = [{ id: 'all', label: 'All', count: qaData.length }].concat(
    categories.map((c) => ({ id: c.id, label: c.label, count: qaData.filter((q) => q.category === c.id).length })),
  )

  return (
    <Section
      id="questions"
      title="Questions people asked"
      intro="Real questions from workshop participants, answered. Search, or browse by stage. Open only what you need."
    >
      <div className="flex items-center gap-3 border border-line bg-void-raised px-4 focus-within:border-accent">
        <span aria-hidden className="font-mono text-xs text-type-faint">/</span>
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${qaData.length} questions — try “team”, “idea”, “demo”`}
          aria-label="Search questions"
          className="w-full bg-transparent py-3.5 text-[15px] text-type placeholder:text-type-faint focus:outline-none"
        />
      </div>

      <div role="tablist" aria-label="Filter by stage" className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => {
          const selected = !query.trim() && category === f.id
          return (
            <button
              key={f.id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => {
                setCategory(f.id)
                setQuery('')
                history.replaceState(null, '', f.id === 'all' ? '#questions' : `#questions/${f.id}`)
              }}
              className={`focus-ring shrink-0 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                selected
                  ? 'border-accent text-accent'
                  : 'border-line text-type-faint hover:border-type-faint hover:text-type-dim'
              }`}
            >
              {f.label} <span className="ml-1 opacity-60">{f.count}</span>
            </button>
          )
        })}
      </div>

      <p className="mt-6 mb-3 font-mono text-[11px] text-type-faint" aria-live="polite">
        {query.trim()
          ? `// ${visible.length} ${visible.length === 1 ? 'match' : 'matches'} for “${query.trim()}”`
          : `// ${visible.length} questions · ${category === 'all' ? 'all stages' : categoryLabel[category].toLowerCase()}`}
      </p>

      {visible.length === 0 ? (
        <p className="border-y border-line px-5 py-8 text-sm text-type-dim">
          Nothing matches. Try a shorter word, or{' '}
          <button type="button" onClick={() => setQuery('')} className="focus-ring text-accent underline underline-offset-4">
            clear the search
          </button>
          .
        </p>
      ) : (
        <ul className="rows">
          {visible.map((q) => (
            <QuestionRow
              key={q.id}
              q={q}
              open={openIds.includes(q.id)}
              onToggle={() => toggle(q.id)}
              showCategory={query.trim() !== '' || category === 'all'}
              votes={votes}
            />
          ))}
        </ul>
      )}
    </Section>
  )
}

function QuestionRow({
  q,
  open,
  onToggle,
  showCategory,
  votes,
}: {
  q: QAItem
  open: boolean
  onToggle: () => void
  showCategory: boolean
  votes: ReturnType<typeof useVotes>
}) {
  const panelId = `q-${q.id}-answer`
  const voted = votes.voted.includes(q.id)

  return (
    <li id={`q-${q.id}`} className="row" data-open={open}>
      <div className="flex items-start">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="focus-ring grid min-w-0 flex-1 grid-cols-[3.25rem_1fr] gap-3 py-4 pl-5 pr-3 text-left"
        >
          <span className="pt-[3px] font-mono text-[10px] tracking-[0.1em] text-type-faint">{displayId[q.id]}</span>
          <span>
            <span className="block text-[15px] font-medium leading-snug text-type">{q.question}</span>
            {showCategory && <span className="label mt-1.5 block">{categoryLabel[q.category]}</span>}
          </span>
        </button>
        {votes.enabled && (
          <button
            type="button"
            onClick={() => votes.vote(q.id)}
            disabled={voted}
            aria-label={voted ? `You found this useful (${votes.counts[q.id] ?? 0})` : 'Mark as useful'}
            title={voted ? 'You marked this useful' : 'Useful? Upvote it'}
            className={`focus-ring mt-3 mr-3 flex shrink-0 items-center gap-1.5 border px-2 py-1 font-mono text-[11px] transition-colors ${
              voted
                ? 'border-accent/40 text-accent'
                : 'border-line text-type-faint hover:border-type-faint hover:text-type'
            }`}
          >
            <span aria-hidden>▲</span>
            {votes.counts[q.id] ?? 0}
          </button>
        )}
      </div>

      {open && (
        <div id={panelId} className="pb-6 pl-5 pr-5 sm:pl-[4.75rem]">
          <ul className="prose-list max-w-2xl text-[15px] text-type-dim">
            {q.answer.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <p className="mt-4 font-mono text-[10px] text-type-faint">
            {q.tags.map((t) => `#${t}`).join('  ')}
            <a href={`#q-${q.id}`} className="focus-ring ml-4 hover:text-accent">
              link
            </a>
          </p>
        </div>
      )}
    </li>
  )
}

/** Shared upvotes via /api/qa-votes (Worker + D1). Hidden entirely if the API is unreachable. */
function useVotes() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [enabled, setEnabled] = useState(false)
  const [voted, setVoted] = useState<string[]>(readVoted)

  useEffect(() => {
    let alive = true
    fetch('/api/qa-votes')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((p: { counts?: Record<string, number>; enabled?: boolean }) => {
        if (!alive) return
        setCounts(p.counts ?? {})
        setEnabled(p.enabled !== false)
      })
      .catch(() => alive && setEnabled(false))
    return () => {
      alive = false
    }
  }, [])

  const vote = async (id: string) => {
    if (voted.includes(id)) return
    const before = counts[id] ?? 0
    const nextVoted = [...voted, id]
    setVoted(nextVoted)
    saveVoted(nextVoted)
    setCounts((c) => ({ ...c, [id]: before + 1 }))
    try {
      const r = await fetch('/api/qa-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: id, voterId: voterId() }),
      })
      if (!r.ok) throw new Error()
      const p = (await r.json()) as { count?: number }
      if (typeof p.count === 'number') setCounts((c) => ({ ...c, [id]: p.count! }))
    } catch {
      setVoted(voted)
      saveVoted(voted)
      setCounts((c) => ({ ...c, [id]: before }))
    }
  }

  return { counts, enabled, voted, vote }
}

function readVoted(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(votedStorageKey) ?? '[]')
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function saveVoted(ids: string[]) {
  try {
    localStorage.setItem(votedStorageKey, JSON.stringify(ids))
  } catch {
    // Votes still count server-side; only the local "already voted" memory is lost.
  }
}

function voterId() {
  try {
    const existing = localStorage.getItem(voterStorageKey)
    if (existing) return existing
    const next = crypto.randomUUID()
    localStorage.setItem(voterStorageKey, next)
    return next
  } catch {
    return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}
