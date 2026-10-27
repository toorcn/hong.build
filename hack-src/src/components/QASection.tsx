import { useState, useMemo, useEffect, type CSSProperties, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, ChevronUp, Rocket, Users, Clock, Lightbulb, Code, Megaphone, ThumbsUp } from 'lucide-react'
import { qaData, categories, type QAItem } from '../data/qa'

const votedStorageKey = 'hcc:qna-upvotes:v1'
const voterStorageKey = 'hcc:qna-voter:v1'

const iconMap: Record<string, ReactNode> = {
  Rocket: <Rocket size={16} />,
  Users: <Users size={16} />,
  Clock: <Clock size={16} />,
  Lightbulb: <Lightbulb size={16} />,
  Code: <Code size={16} />,
  Megaphone: <Megaphone size={16} />,
}

const categoryAccentMap: Record<string, { background: string; border: string; text: string }> = {
  'getting-started': {
    background: 'oklch(0.76 0.14 150 / 0.16)',
    border: 'oklch(0.62 0.15 150 / 0.22)',
    text: 'oklch(0.47 0.14 150)',
  },
  'team-roles': {
    background: 'oklch(0.72 0.14 310 / 0.14)',
    border: 'oklch(0.58 0.15 310 / 0.22)',
    text: 'oklch(0.49 0.15 310)',
  },
  'hackathon-flow': {
    background: 'oklch(0.8 0.14 76 / 0.2)',
    border: 'oklch(0.65 0.15 76 / 0.24)',
    text: 'oklch(0.49 0.13 72)',
  },
  ideation: {
    background: 'oklch(0.73 0.16 28 / 0.15)',
    border: 'oklch(0.6 0.16 28 / 0.22)',
    text: 'oklch(0.5 0.16 28)',
  },
  building: {
    background: 'oklch(0.75 0.13 205 / 0.16)',
    border: 'oklch(0.58 0.14 205 / 0.22)',
    text: 'oklch(0.46 0.13 205)',
  },
  pitching: {
    background: 'oklch(0.74 0.15 350 / 0.15)',
    border: 'oklch(0.6 0.16 350 / 0.22)',
    text: 'oklch(0.49 0.16 350)',
  },
}

const categoryCodeMap = categories.reduce<Record<string, string>>((codes, category) => {
  codes[category.id] = category.code
  return codes
}, {})

const categoryQuestionCounts: Record<string, number> = {}
const qaDisplayIdMap = qaData.reduce<Record<string, string>>((displayIds, item) => {
  const nextCount = (categoryQuestionCounts[item.category] ?? 0) + 1
  categoryQuestionCounts[item.category] = nextCount
  displayIds[item.id] = `${categoryCodeMap[item.category] ?? 'QA'}${String(nextCount).padStart(2, '0')}`
  return displayIds
}, {})

const getQaDisplayId = (item: QAItem) => qaDisplayIdMap[item.id] ?? item.id.toUpperCase()

const getCategoryAccent = (category: string) => categoryAccentMap[category] ?? categoryAccentMap['getting-started']

export default function QASection() {
  const [activeCategory, setActiveCategory] = useState<string>('getting-started')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [votedIds, setVotedIds] = useState<string[]>(readStoredVotedIds)
  const [pendingVoteIds, setPendingVoteIds] = useState<string[]>([])
  const [votesEnabled, setVotesEnabled] = useState(true)

  const filtered = useMemo(() => {
    let items = qaData
    if (activeCategory !== 'all') {
      items = items.filter((q) => q.category === activeCategory)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      items = items.filter(
        (q) =>
          q.question.toLowerCase().includes(query) ||
          q.answer.some((a) => a.toLowerCase().includes(query)) ||
          q.tags.some((t) => t.toLowerCase().includes(query))
      )
    }
    return items
  }, [activeCategory, searchQuery])

  const votedSet = useMemo(() => new Set(votedIds), [votedIds])
  const pendingVoteSet = useMemo(() => new Set(pendingVoteIds), [pendingVoteIds])

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const saveVotedIds = (nextIds: string[]) => {
    setVotedIds(nextIds)
    try {
      localStorage.setItem(votedStorageKey, JSON.stringify(nextIds))
    } catch {
      // Storage can be unavailable in strict privacy modes. The server still protects the vote.
    }
  }

  const handleUpvote = async (questionId: string) => {
    if (!votesEnabled || votedSet.has(questionId) || pendingVoteSet.has(questionId)) {
      return
    }

    const previousCount = voteCounts[questionId] ?? 0
    const previousVotedIds = votedIds
    const nextVotedIds = [...previousVotedIds, questionId]

    saveVotedIds(nextVotedIds)
    setPendingVoteIds((current) => [...current, questionId])
    setVoteCounts((current) => ({
      ...current,
      [questionId]: previousCount + 1,
    }))

    try {
      const response = await fetch('/api/qa-votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          voterId: getOrCreateVoterId(),
        }),
      })
      const payload = await response.json() as { count?: number; enabled?: boolean }

      if (!response.ok) {
        throw new Error('Vote failed')
      }

      setVotesEnabled(payload.enabled !== false)
      setVoteCounts((current) => ({
        ...current,
        [questionId]: typeof payload.count === 'number' ? payload.count : current[questionId] ?? previousCount + 1,
      }))
    } catch {
      saveVotedIds(previousVotedIds)
      setVoteCounts((current) => ({
        ...current,
        [questionId]: previousCount,
      }))
      setVotesEnabled(false)
    } finally {
      setPendingVoteIds((current) => current.filter((id) => id !== questionId))
    }
  }

  useEffect(() => {
    const onSetCategory = (event: Event) => {
      const category = (event as CustomEvent<string>).detail
      if (category) {
        setActiveCategory(category)
        setSearchQuery('')
        setExpandedId(null)
      }
    }

    window.addEventListener('hcc:setCategory', onSetCategory)
    return () => window.removeEventListener('hcc:setCategory', onSetCategory)
  }, [])

  useEffect(() => {
    let isMounted = true

    fetch('/api/qa-votes')
      .then(async (response) => {
        const payload = await response.json() as { counts?: Record<string, number>; enabled?: boolean }
        if (!response.ok) {
          throw new Error('Could not load vote counts')
        }
        if (isMounted) {
          setVoteCounts(payload.counts ?? {})
          setVotesEnabled(payload.enabled !== false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setVotesEnabled(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section id="qa" className="relative overflow-hidden py-24 sm:py-32 noise-bg">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-sky-400/4 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Participant <span className="text-emphasis-sky">Q&A</span>
          </h2>
          <p className="text-navy-100/60 text-lg max-w-2xl mx-auto">
            Real questions from participants, answered from the workshop.
            Everything you were wondering about hackathons.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative mb-8 mx-auto max-w-3xl"
        >
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-200/40" />
          <input
            type="text"
            placeholder="Search questions, topics, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-xl glass-card text-navy-50 placeholder:text-navy-200/30 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/50 transition-all"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 flex flex-wrap justify-center gap-2"
        >
          <button
            onClick={() => { setActiveCategory('all'); setSearchQuery('') }}
            className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeCategory === 'all'
                ? 'bg-sky-400/15 text-sky-300 border border-sky-400/20'
                : 'glass-card glass-card-hover text-navy-100/50'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSearchQuery('') }}
              className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeCategory === cat.id
                  ? 'bg-sky-400/15 text-sky-300 border border-sky-400/20'
                  : 'glass-card glass-card-hover text-navy-100/50'
              }`}
            >
              {iconMap[cat.icon]}
              {cat.label}
            </button>
          ))}
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl border border-navy-300/10 bg-navy-800/40 p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-warm-400/70">Now viewing</p>
              <p className="text-2xl font-semibold text-navy-50" style={{ fontFamily: 'var(--font-serif)' }}>
                {activeCategory === 'all' ? 'All questions' : categories.find((cat) => cat.id === activeCategory)?.label}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-navy-100/45">
                Scan the question first. Open only what is relevant. The goal is not to consume everything, it is to know your next move.
              </p>
              <div className="mt-6 rounded-xl bg-sky-300/8 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300/70">Hong's rule</p>
                <p className="mt-2 text-sm leading-relaxed text-navy-100/65">
                  If advice does not help you score better, demo better, or pitch clearer, ignore it during the hackathon.
                </p>
              </div>
            </div>
          </aside>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((item, index) => (
                <QACard
                  key={item.id}
                  item={item}
                  displayId={getQaDisplayId(item)}
                  isExpanded={expandedId === item.id}
                  onToggle={() => toggleExpand(item.id)}
                  onUpvote={() => handleUpvote(item.id)}
                  voteCount={voteCounts[item.id] ?? 0}
                  hasVoted={votedSet.has(item.id)}
                  isVoting={pendingVoteSet.has(item.id)}
                  votesEnabled={votesEnabled}
                  index={index}
                />
              ))}
            </AnimatePresence>

            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-navy-200/40"
              >
                No questions match your search. Try different keywords.
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function QACard({
  item,
  displayId,
  isExpanded,
  onToggle,
  onUpvote,
  voteCount,
  hasVoted,
  isVoting,
  votesEnabled,
  index,
}: {
  item: QAItem
  displayId: string
  isExpanded: boolean
  onToggle: () => void
  onUpvote: () => void
  voteCount: number
  hasVoted: boolean
  isVoting: boolean
  votesEnabled: boolean
  index: number
}) {
  const voteButtonLabel = hasVoted
    ? `Upvoted ${displayId}`
    : `Upvote ${displayId}`
  const accent = getCategoryAccent(item.category)
  const badgeStyle: CSSProperties = {
    backgroundColor: accent.background,
    borderColor: accent.border,
    color: accent.text,
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 p-4 transition-colors duration-200 hover:bg-white/[0.03] sm:flex sm:items-start sm:gap-3 sm:p-6">
        <div className="order-1 flex shrink-0 flex-col items-center gap-2 sm:contents">
          <span
            className="shrink-0 rounded border px-2 py-1 font-mono text-xs sm:hidden"
            style={badgeStyle}
          >
            {displayId}
          </span>
          <button
            type="button"
            onClick={onUpvote}
            disabled={!votesEnabled || hasVoted || isVoting}
            aria-label={voteButtonLabel}
            aria-pressed={hasVoted}
            title={votesEnabled ? voteButtonLabel : 'Voting is not connected yet'}
            className={`grid min-h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-lg border text-xs font-semibold transition-all duration-200 sm:order-1 sm:mt-0.5 sm:w-14 ${
              hasVoted
                ? 'border-sky-300/30 bg-sky-400/15 text-sky-200'
                : 'border-white/10 bg-white/[0.03] text-navy-100/55 hover:border-sky-300/30 hover:bg-sky-400/10 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-white/10 disabled:hover:bg-white/[0.03] disabled:hover:text-navy-100/55'
            }`}
          >
            <ThumbsUp size={15} strokeWidth={2.2} />
            <span className="font-mono leading-none">{voteCount}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="order-2 flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left sm:gap-4"
          aria-expanded={isExpanded}
        >
          <span
            className="mt-0.5 hidden shrink-0 rounded border px-2 py-1 font-mono text-xs sm:inline-flex"
            style={badgeStyle}
          >
            {displayId}
          </span>
          <span className="min-w-0 flex-1 text-sm sm:text-base font-medium text-navy-50 leading-relaxed">
            {item.question}
          </span>
          <span className="shrink-0 mt-0.5 text-navy-200/30">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0 ml-0 sm:ml-10 border-t border-white/5 mt-0">
              <div className="pt-4 space-y-2.5">
                {item.answer.map((line, i) => (
                  <p key={i} className="text-sm text-navy-100/70 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-md bg-navy-500/20 text-navy-200/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function readStoredVotedIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(votedStorageKey) ?? '[]')
    return Array.isArray(stored)
      ? stored.filter((id): id is string => typeof id === 'string')
      : []
  } catch {
    return []
  }
}

function getOrCreateVoterId() {
  try {
    const existing = localStorage.getItem(voterStorageKey)
    if (existing) {
      return existing
    }

    const nextId = crypto.randomUUID()
    localStorage.setItem(voterStorageKey, nextId)
    return nextId
  } catch {
    return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}
