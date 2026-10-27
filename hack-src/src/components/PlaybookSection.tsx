import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react'
import { playbookData, mostFrequentPattern, pitchPolishFramework } from '../data/playbook'

export default function PlaybookSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <section id="playbook" className="relative overflow-hidden py-24 sm:py-32 noise-bg">
      <div className="absolute inset-0 z-0">
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-warm-500/4 rounded-full blur-[100px]" />
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
            Mentorship <span className="text-emphasis-warm">Playbook</span>
          </h2>
          <p className="text-navy-100/60 text-lg max-w-2xl mx-auto">
            Distilled from recurring mentorship patterns across KitaHack 2025 finalist sessions.
            Each section is standalone, so jump directly to your weakest area.
          </p>
        </motion.div>

        <div className="mb-12 grid gap-3 lg:grid-cols-2">
          {playbookData.map((item, index) => (
            <PlaybookCard
              key={item.id}
              item={item}
              isExpanded={expandedId === item.id}
              onToggle={() => toggleExpand(item.id)}
              index={index}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card rounded-2xl p-8 sm:p-10 glow-warm"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={20} className="text-warm-400" />
            <h3
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {mostFrequentPattern.title}
            </h3>
          </div>
          <p className="text-navy-100/60 text-sm mb-3">
            {mostFrequentPattern.description}
          </p>
          <p className="text-warm-400 font-semibold text-lg mb-4">
            {mostFrequentPattern.insight}
          </p>
          <div className="space-y-2">
            {mostFrequentPattern.practice.map((p, i) => (
              <p key={i} className="text-sm text-navy-100/70 leading-relaxed">
                {i + 1}. {p}
              </p>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 glass-card rounded-2xl p-8 sm:p-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle size={20} className="text-accent-green" />
            <h3
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Final 24-Hour Pitch Polish Framework
            </h3>
          </div>
          <div className="space-y-3">
            {pitchPolishFramework.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-accent-green/10 text-accent-green text-xs flex items-center justify-center font-mono mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-navy-100/70 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function PlaybookCard({
  item,
  isExpanded,
  onToggle,
  index,
}: {
  item: (typeof playbookData)[0]
  isExpanded: boolean
  onToggle: () => void
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="overflow-hidden rounded-2xl border border-navy-300/10 bg-navy-800/45"
    >
      <button
        onClick={onToggle}
        className="cursor-pointer w-full text-left p-5 sm:p-6 flex items-start gap-4 hover:bg-white/[0.03] transition-colors duration-200"
      >
        <AlertTriangle size={18} className="shrink-0 mt-0.5 text-warm-400/60" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm sm:text-base font-semibold text-navy-50 mb-1">
            {item.title}
          </h4>
          <p className="text-xs text-navy-200/40">{item.issue}</p>
        </div>
        <span className="shrink-0 mt-0.5 text-navy-200/30">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-white/5">
              <div className="pt-4 space-y-2.5">
                {item.guidance.map((g, i) => (
                  <p key={i} className="text-sm text-navy-100/70 leading-relaxed">
                    {g}
                  </p>
                ))}
              </div>

              {item.formula && (
                <div className="mt-4 p-3 rounded-lg bg-warm-500/5 border border-warm-500/10">
                  <p className="text-sm text-warm-400 font-medium">{item.formula}</p>
                </div>
              )}

              {item.checklist && (
                <div className="mt-4 space-y-2">
                  {item.checklist.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border border-sky-400/30 flex items-center justify-center">
                        <CheckCircle size={10} className="text-sky-400/50" />
                      </div>
                      <span className="text-sm text-navy-100/60">{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
