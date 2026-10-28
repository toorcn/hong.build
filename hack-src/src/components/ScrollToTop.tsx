import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { useLenis } from 'lenis/react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  const lenis = useLenis()

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            if (lenis) {
              lenis.scrollTo(0, { duration: 1.1 })
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }}
          className="cursor-pointer fixed bottom-6 right-6 z-40 w-10 h-10 rounded-xl glass-card flex items-center justify-center text-navy-200/40 hover:text-sky-300 hover:bg-white/5 transition-all duration-200"
          aria-label="Scroll to top"
        >
          <ArrowUp size={16} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
