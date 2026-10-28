import { motion } from 'framer-motion'
import { ExternalLink, BookOpen, GitBranch, Trophy, Mic } from 'lucide-react'
import { resources } from '../data/resources'

const categoryConfig = {
  learn: { icon: <BookOpen size={18} />, label: 'Learn', color: 'text-sky-300' },
  git: { icon: <GitBranch size={18} />, label: 'Git & GitHub', color: 'text-accent-green' },
  hackathons: { icon: <Trophy size={18} />, label: 'Find Hackathons', color: 'text-warm-400' },
  pitch: { icon: <Mic size={18} />, label: 'Pitch Reference', color: 'text-navy-200' },
}

export default function ResourcesSection() {
  const grouped = Object.entries(categoryConfig).map(([cat, config]) => ({
    ...config,
    items: resources.filter((r) => r.category === cat),
  }))

  return (
    <section id="resources" className="relative overflow-hidden py-24 sm:py-32 noise-bg">
      <div className="absolute inset-0 z-0">
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-sky-400/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">
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
            Resource <span className="text-emphasis-sky">Links</span>
          </h2>
          <p className="text-navy-100/60 text-lg max-w-2xl mx-auto">
            Curated tools and references to get you started, keep you building,
            and help you find your next hackathon.
          </p>
        </motion.div>

        <div className="space-y-8">
          {grouped.map((group, groupIndex) => (
            <motion.div
              key={group.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: groupIndex * 0.08 }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <span className={group.color}>{group.icon}</span>
                <h3 className="text-lg font-semibold text-navy-50">{group.label}</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.items.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer glass-card glass-card-hover rounded-xl p-5 flex items-start gap-4 transition-all duration-200 group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-50 group-hover:text-sky-300 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-navy-100/50 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <ExternalLink
                      size={14}
                      className="shrink-0 mt-1 text-navy-200/20 group-hover:text-sky-300/50 transition-colors"
                    />
                  </a>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-8 glass-card rounded-xl p-5"
        >
          <p className="text-sm text-navy-100/60 leading-relaxed">
            <span className="text-warm-400 font-medium">Pro tip:</span> Most hackathon
            opportunities are only shared on Instagram stories. Follow your university's
            tech clubs and check their stories often to stay updated.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
