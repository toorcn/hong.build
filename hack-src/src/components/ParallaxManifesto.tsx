import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const beats = [
  {
    label: '01',
    title: 'Do not code first.',
    body: 'The first few hours are for problem selection, rubric reading, user context, and team alignment.',
  },
  {
    label: '02',
    title: 'Build the demo, not the company.',
    body: 'A hackathon prototype only needs the path that proves the idea in front of judges.',
  },
  {
    label: '03',
    title: 'Pitch the benefit, then the mechanism.',
    body: 'Features show what you built. Benefits explain why anyone should care.',
  },
]

export default function ParallaxManifesto() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const headlineY = useTransform(scrollYProgress, [0, 1], ['12%', '-12%'])
  const ruleY = useTransform(scrollYProgress, [0, 1], ['-8%', '10%'])
  const lineScale = useTransform(scrollYProgress, [0.1, 0.8], [0, 1])

  return (
    <section ref={ref} className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_40%,rgba(74,144,217,0.07),transparent_34%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <motion.div style={{ y: headlineY }} className="lg:sticky lg:top-32">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-sky-300/70">The operating system</p>
          <h2 className="text-4xl font-semibold leading-[0.98] tracking-tight text-navy-50 sm:text-6xl" style={{ fontFamily: 'var(--font-serif)' }}>
            Winning is not magic. It is sequencing.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-navy-100/50">
            Most teams lose before they start building. They skip the thinking stage, build too much, then try to explain a messy product in five minutes.
          </p>
          <motion.figure
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mt-8 overflow-hidden rounded-[1.5rem] border border-sky-300/12 shadow-[0_26px_100px_rgba(0,0,0,0.24)]"
          >
            <img
              src={`${import.meta.env.BASE_URL}images/hcc-strategy-desk.jpg`}
              alt="A hackathon strategy table with sticky notes, prototype sketches, and a timer arranged into a planning flow."
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full object-cover"
            />
          </motion.figure>
        </motion.div>

        <motion.div style={{ y: ruleY }} className="space-y-4">
          <motion.div style={{ scaleY: lineScale }} className="absolute left-6 top-24 hidden h-[calc(100%-12rem)] w-px origin-top bg-sky-300/25 lg:block" />
          {beats.map((beat, index) => (
            <motion.article
              key={beat.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="surface-command rounded-[1.5rem] p-6 sm:p-8"
            >
              <div className="mb-8 flex items-center justify-between">
                <span className="font-mono text-sm text-sky-300/70">{beat.label}</span>
                <span className="h-px w-20 bg-gradient-to-r from-sky-300/35 to-transparent" />
              </div>
              <h3 className="mb-3 text-2xl font-semibold text-navy-50" style={{ fontFamily: 'var(--font-serif)' }}>
                {beat.title}
              </h3>
              <p className="max-w-xl text-sm leading-relaxed text-navy-100/58">{beat.body}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
