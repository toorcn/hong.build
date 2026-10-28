import { useEffect, useState } from 'react'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'

const sections = [
  { id: 'hero', label: 'Hero' },
  { id: 'video', label: 'Video' },
  { id: 'qa', label: 'Q&A' },
  { id: 'playbook', label: 'Playbook' },
  { id: 'stack', label: 'Stack' },
  { id: 'resources', label: 'Resources' },
  { id: 'community', label: 'Community' },
]

type SectionMarker = (typeof sections)[number] & { progress: number }

const initialMarkers = sections.map((section, index) => ({
  ...section,
  progress: index / (sections.length - 1),
}))

function getSectionProgress(id: string) {
  const element = document.getElementById(id)
  if (!element) return 0

  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  const pageTop = element.getBoundingClientRect().top + window.scrollY
  return Math.min(1, Math.max(0, pageTop / maxScroll))
}

export default function ScrollProgressRail() {
  const { scrollY, scrollYProgress } = useScroll()
  const [activeSection, setActiveSection] = useState('hero')
  const [markers, setMarkers] = useState<SectionMarker[]>(initialMarkers)

  useEffect(() => {
    const updateMarkers = () => {
      setMarkers(
        sections.map((section) => ({
          ...section,
          progress: getSectionProgress(section.id),
        }))
      )
    }

    updateMarkers()
    window.addEventListener('resize', updateMarkers)
    window.addEventListener('load', updateMarkers)

    const resizeObserver = new ResizeObserver(updateMarkers)
    resizeObserver.observe(document.body)

    return () => {
      window.removeEventListener('resize', updateMarkers)
      window.removeEventListener('load', updateMarkers)
      resizeObserver.disconnect()
    }
  }, [])

  useMotionValueEvent(scrollY, 'change', () => {
    const viewportAnchor = window.scrollY + window.innerHeight * 0.42
    let current = sections[0].id

    for (const section of sections) {
      const element = document.getElementById(section.id)
      if (!element) continue

      const pageTop = element.getBoundingClientRect().top + window.scrollY
      if (pageTop <= viewportAnchor) current = section.id
    }

    setActiveSection(current)
  })

  return (
    <aside className="pointer-events-none fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
      <div className="relative h-[28rem] w-56">
        <div className="absolute left-0 top-0 h-full w-px overflow-hidden rounded-full bg-navy-300/10">
          <motion.div
            className="absolute left-0 top-0 h-full w-full origin-top rounded-full bg-sky-300"
            style={{ scaleY: scrollYProgress }}
          />
        </div>
        <div className="absolute left-0 top-0 h-full w-full">
          {markers.map((section, index) => (
            <div
              key={section.id}
              className={`absolute left-4 flex -translate-y-1/2 items-center gap-2 text-[10px] uppercase tracking-[0.22em] transition-colors duration-150 ${
                activeSection === section.id ? 'text-sky-300/80' : 'text-navy-200/25'
              }`}
              style={{ top: `${section.progress * 100}%` }}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-150 ${
                  activeSection === section.id ? 'bg-sky-300' : 'bg-navy-300/20'
                }`}
              />
              <span className="font-mono text-navy-300/35">0{index + 1}</span>
              <span>{section.label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
