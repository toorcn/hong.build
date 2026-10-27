import { motion } from 'framer-motion'
import { useLenis } from 'lenis/react'
import { ArrowRight, Code2, Lightbulb, Mic2, Search, Trophy, UserRound } from 'lucide-react'

const situations = [
  {
    title: "I'm a beginner",
    label: 'Start here',
    description: 'What to learn first, how to join without confidence, and why starting matters more than being ready.',
    category: 'getting-started',
    icon: UserRound,
  },
  {
    title: 'I need an idea',
    label: 'Think twice',
    description: 'Use the Think Twice method to avoid the same AI-generated idea everyone else will pitch.',
    category: 'ideation',
    icon: Lightbulb,
  },
  {
    title: "I'm building",
    label: 'Cut scope',
    description: 'Build the exact happy path you will demo. Skip login screens, dashboards, and anything invisible.',
    category: 'building',
    icon: Code2,
  },
  {
    title: "I'm pitching",
    label: 'Win attention',
    description: 'Structure the 5-minute pitch, engineer Q&A, and make judges remember your team.',
    category: 'pitching',
    icon: Mic2,
  },
  {
    title: 'I need the rubric',
    label: 'Play the game',
    description: 'Read level 4 and level 5. Build for what they are scoring, not what you personally want.',
    category: 'hackathon-flow',
    icon: Search,
  },
  {
    title: 'I want to win',
    label: 'Winning edge',
    description: 'Focus, proof, memorability, backup demo, and the networking mindset after results are out.',
    category: 'pitching',
    icon: Trophy,
  },
]

export default function SituationPicker() {
  const lenis = useLenis()

  const jumpToCategory = (category: string) => {
    window.dispatchEvent(new CustomEvent('hcc:setCategory', { detail: category }))
    if (lenis) {
      lenis.scrollTo('#qa', { offset: -80, duration: 1.1 })
    } else {
      document.getElementById('qa')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.55 }}
          className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-sky-300/70">Choose your situation</p>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-navy-50 sm:text-4xl" style={{ fontFamily: 'var(--font-serif)' }}>
              Don’t read everything. Find the move that matters right now.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-navy-100/50">
            This is designed like a field guide. Start from your current bottleneck, then jump into the exact advice.
          </p>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {situations.map((situation, index) => {
            const Icon = situation.icon
            return (
              <motion.button
                key={situation.title}
                type="button"
                onClick={() => jumpToCategory(situation.category)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="group cursor-pointer rounded-2xl border border-navy-300/10 bg-navy-800/45 p-5 text-left transition-all duration-200 hover:border-sky-300/30 hover:bg-navy-700/55 hover:shadow-[0_24px_80px_rgba(74,144,217,0.08)]"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-300/10 text-sky-300">
                    <Icon size={18} />
                  </div>
                  <ArrowRight size={16} className="text-navy-200/25 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-sky-300" />
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-warm-400/70">{situation.label}</p>
                <h3 className="mb-2 text-lg font-semibold text-navy-50">{situation.title}</h3>
                <p className="text-sm leading-relaxed text-navy-100/52">{situation.description}</p>
              </motion.button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
