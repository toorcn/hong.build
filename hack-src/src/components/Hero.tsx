import { motion } from 'framer-motion'
import { ChevronDown, Sparkles } from 'lucide-react'
import { useLenis } from 'lenis/react'

export default function Hero() {
  const lenis = useLenis()

  const jumpToRubric = () => {
    window.dispatchEvent(new CustomEvent('hcc:setCategory', { detail: 'hackathon-flow' }))
    if (lenis) {
      lenis.scrollTo('#qa', { offset: -80, duration: 1.12 })
    } else {
      document.getElementById('qa')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const jumpToQuestions = () => {
    if (lenis) {
      lenis.scrollTo('#qa', { offset: -80, duration: 1.12 })
    } else {
      document.getElementById('qa')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/hcc-hero-workshop.jpg`}
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: '62% center' }}
        />
        <div className="absolute inset-0 bg-navy-950/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-900/78 to-navy-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_45%,rgba(74,144,217,0.16),transparent_38%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(var(--color-navy-300) 1px, transparent 1px), linear-gradient(transparent 1px, var(--color-navy-300) 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-900 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-32 pb-24 text-center sm:pt-40 sm:pb-32 lg:text-left">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-sky-300/15 bg-sky-300/8 px-4 py-2 text-sm text-sky-300"
          >
            <Sparkles size={14} />
            <span>Hong Bing's field guide for first-time builders</span>
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-7 max-w-4xl text-5xl font-bold leading-[0.93] tracking-tight text-navy-50 sm:text-6xl md:text-7xl lg:text-8xl"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          <span className="block">Your Hackathon</span>
          <span className="block text-sky-300">Crash Course</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-10 max-w-3xl text-lg leading-relaxed text-navy-100/72 sm:text-xl lg:mx-0"
        >
          A practical field guide from Hong Bing, 16x hackathon winner and
          co-founder of AI Hackerdorm, for beginners, builders, pitchers,
          and teams trying to make their first hackathon count.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start"
        >
          <button
            onClick={jumpToRubric}
            className="glow-sky cursor-pointer rounded-xl bg-sky-400 px-8 py-3.5 text-sm font-semibold tracking-wide text-navy-900 transition-colors duration-200 hover:bg-sky-300"
          >
            Start With The Rubric
          </button>
          <button
            onClick={jumpToQuestions}
            className="glass-card glass-card-hover cursor-pointer rounded-xl px-8 py-3.5 text-sm font-semibold tracking-wide text-navy-50 transition-all duration-200"
          >
            Find My Question
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm lg:justify-start"
        >
          {[
            { label: '16x Hackathon Winner', color: 'text-sky-300/60' },
            { label: 'Co-founder of AI Hackerdorm', color: 'text-warm-400/60' },
            { label: 'Startups, Community, Growth', color: 'text-accent-green/60' },
          ].map((item, i) => (
            <motion.span
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + i * 0.1, duration: 0.4 }}
              className={`flex items-center gap-2 ${item.color}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {item.label}
            </motion.span>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <button
          onClick={jumpToQuestions}
          className="cursor-pointer text-navy-300/40 hover:text-sky-300 transition-colors animate-bounce"
          aria-label="Scroll down"
        >
          <ChevronDown size={24} />
        </button>
      </motion.div>
    </section>
  )
}
