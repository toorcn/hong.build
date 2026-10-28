import { motion } from 'framer-motion'

const frameworks = [
  {
    number: '01',
    title: 'Think Twice',
    summary: 'First idea is common sense. Second idea is where creativity starts.',
    detail: 'Do not ask AI for ideas first. Use your own perspective, then use AI to refine, validate, and build.',
  },
  {
    number: '02',
    title: 'Rubric Level 4 to 5',
    summary: 'Winning is usually the gap between good and exactly what they asked for.',
    detail: 'Read both the top score and the score below it. That line tells you what judges are really rewarding.',
  },
  {
    number: '03',
    title: 'Benefit Before Feature',
    summary: 'Judges remember the outcome, not the implementation detail.',
    detail: 'Do not lead with “we built an AI chatbot.” Lead with what changes for the user because it exists.',
  },
  {
    number: '04',
    title: 'Demo Resilience Stack',
    summary: 'Live happy path, cached output, recorded proof, screenshots. In that order.',
    detail: 'A broken demo is survivable when you planned the fallback. It is fatal when you assumed the room would cooperate.',
  },
]

export default function FrameworkSpotlight() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(245,158,11,0.06),transparent_35%)]" />
      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.55 }}
          className="mb-10 max-w-3xl"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-warm-400/70">Signature frameworks</p>
          <h2 className="text-3xl font-semibold tracking-tight text-navy-50 sm:text-5xl" style={{ fontFamily: 'var(--font-serif)' }}>
            The mental models I would want every first-time team to keep open.
          </h2>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-4">
          {frameworks.map((framework, index) => (
            <motion.article
              key={framework.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className={`rounded-[1.4rem] border p-6 ${
                index === 0
                  ? 'border-sky-300/25 bg-sky-300/[0.07] lg:col-span-2'
                  : 'border-navy-300/10 bg-navy-800/45'
              }`}
            >
              <p className="mb-8 font-mono text-xs text-navy-200/35">{framework.number}</p>
              <h3 className="mb-3 text-2xl font-semibold text-navy-50" style={{ fontFamily: 'var(--font-serif)' }}>
                {framework.title}
              </h3>
              <p className="mb-4 text-sm font-medium leading-relaxed text-sky-200/85">{framework.summary}</p>
              <p className="text-sm leading-relaxed text-navy-100/52">{framework.detail}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
