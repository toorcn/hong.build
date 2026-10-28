import { motion } from 'framer-motion'
import { useLenis } from 'lenis/react'
import { ExternalLink, Play, Radio, Search, Sparkles } from 'lucide-react'

const videoId = 'DcUYfwEzDQA'
const youtubeUrl = `https://youtu.be/${videoId}`

const guide = [
  {
    label: 'Start here',
    title: 'First-time hackathon basics',
    description: 'Team roles, mindset, and what beginners should know before entering the room.',
    category: 'getting-started',
  },
  {
    label: 'Core strategy',
    title: 'Rubric-first thinking',
    description: 'How to read the judging criteria, play the game, and avoid building for yourself.',
    category: 'hackathon-flow',
  },
  {
    label: 'Idea quality',
    title: 'Think Twice method',
    description: 'How to avoid obvious ideas and use AI without becoming identical to every team.',
    category: 'ideation',
  },
  {
    label: 'Build phase',
    title: 'Scope the demo',
    description: 'What to build, what to fake, and why login screens usually waste your pitch time.',
    category: 'building',
  },
  {
    label: 'Final stretch',
    title: 'Pitching and Q&A',
    description: 'How to make judges curious, structure five minutes, and prepare backup demos.',
    category: 'pitching',
  },
]

export default function WorkshopVideoSection() {
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
    <section id="video" className="relative py-20 sm:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(74,144,217,0.09),transparent_35%),radial-gradient(circle_at_82%_68%,rgba(245,158,11,0.06),transparent_32%)]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.55 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.26em] text-sky-300/70">
              <Radio size={14} />
              Full workshop recording
            </p>
            <h2 className="text-4xl font-semibold tracking-tight text-navy-50 sm:text-5xl" style={{ fontFamily: 'var(--font-serif)' }}>
              Watch the session, then use the site as your field guide.
            </h2>
          </div>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-sky-300/15 bg-sky-300/8 px-4 py-3 text-sm font-semibold text-sky-300 transition-colors duration-200 hover:bg-sky-300/12"
          >
            Open on YouTube
            <ExternalLink size={14} />
          </a>
        </motion.div>

        <div className="grid items-start gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="self-start lg:sticky lg:top-32">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="surface-command overflow-hidden rounded-[1.6rem] p-2 shadow-[0_30px_120px_rgba(0,0,0,0.26)]"
            >
              <div className="relative aspect-video overflow-hidden rounded-[1.25rem] bg-navy-950">
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
                  title="Hackathon strategy and pitching masterclass with Hong Bing"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </div>

          <motion.aside
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="rounded-[1.6rem] border border-navy-300/10 bg-navy-800/45 p-6"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm-500/10 text-warm-400">
                <Play size={17} />
              </div>
              <div>
                <h3 className="font-semibold text-navy-50">How to use this recording</h3>
                <p className="text-xs text-navy-100/40">Watch once, reference often.</p>
              </div>
            </div>

            <p className="mb-6 text-sm leading-relaxed text-navy-100/55">
              The video is the full context. The sections below are the fast version when you are already inside a hackathon and need the next move.
            </p>

            <div className="space-y-2.5">
              {guide.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => jumpToCategory(item.category)}
                  className="group w-full cursor-pointer rounded-xl border border-navy-300/8 bg-navy-900/35 p-3 text-left transition-all duration-200 hover:border-sky-300/25 hover:bg-sky-300/[0.06]"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-warm-400/70">{item.label}</span>
                    <Search size={12} className="text-navy-200/25 transition-colors group-hover:text-sky-300" />
                  </div>
                  <p className="text-sm font-semibold text-navy-50">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-navy-100/45">{item.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-xl bg-sky-300/8 p-4">
              <div className="mb-2 flex items-center gap-2 text-sky-300/80">
                <Sparkles size={13} />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">Best workflow</p>
              </div>
              <p className="text-sm leading-relaxed text-navy-100/58">
                Watch the full video before your hackathon. During the event, use the Q&A and Playbook instead of rewatching everything.
              </p>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  )
}
