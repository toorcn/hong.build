import { motion, useScroll, useTransform } from 'framer-motion'

export default function ScrollAtmosphere() {
  const { scrollYProgress } = useScroll()
  const skyY = useTransform(scrollYProgress, [0, 1], ['0%', '24%'])
  const warmY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])
  const gridY = useTransform(scrollYProgress, [0, 1], ['0%', '10%'])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <motion.div
        style={{ y: gridY }}
        className="absolute inset-0 opacity-[0.018]"
      >
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'linear-gradient(var(--color-navy-300) 1px, transparent 1px), linear-gradient(90deg, var(--color-navy-300) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
      </motion.div>
      <motion.div
        style={{ y: skyY }}
        className="absolute left-0 top-1/4 h-72 w-72 rounded-full bg-sky-400/8 blur-[120px] sm:h-[28rem] sm:w-[28rem]"
      />
      <motion.div
        style={{ y: warmY }}
        className="absolute right-0 bottom-1/4 h-72 w-72 rounded-full bg-warm-500/6 blur-[120px] sm:h-[28rem] sm:w-[28rem]"
      />
    </div>
  )
}
