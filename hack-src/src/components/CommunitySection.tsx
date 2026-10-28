import { motion } from 'framer-motion'
import { MessageSquare, ExternalLink, Users, Link2 } from 'lucide-react'
import { communityLinks } from '../data/resources'

export default function CommunitySection() {
  return (
    <section id="community" className="relative py-24 sm:py-32 noise-bg">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-green/3 rounded-full blur-[120px]" />
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
            Join the <span className="text-emphasis-sky">Community</span>
          </h2>
          <p className="text-navy-100/60 text-lg max-w-2xl mx-auto">
            You don't have to do this alone. Connect with builders, find teammates,
            and grow together.
          </p>
        </motion.div>

        <motion.figure
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.55 }}
          className="mb-6 overflow-hidden rounded-[1.6rem] border border-navy-300/10 shadow-[0_32px_110px_rgba(0,0,0,0.24)]"
        >
          <img
            src={`${import.meta.env.BASE_URL}images/hcc-community-pitch.jpg`}
            alt="Hackathon participants gathered in a makerspace, rehearsing a demo and exchanging feedback after a workshop."
            loading="lazy"
            decoding="async"
            className="aspect-[16/10] w-full object-cover"
          />
        </motion.figure>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.a
            href={communityLinks.aiHackerdorm.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="cursor-pointer glass-card glass-card-hover rounded-2xl p-8 transition-all duration-200 group glow-sky"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-green/10 flex items-center justify-center">
                <Users size={20} className="text-accent-green" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy-50 group-hover:text-sky-300 transition-colors">
                  {communityLinks.aiHackerdorm.title}
                </h3>
                <p className="text-xs text-navy-100/40 mt-0.5">
                  {communityLinks.aiHackerdorm.stats}
                </p>
              </div>
            </div>
            <p className="text-sm text-navy-100/60 leading-relaxed mb-6">
              {communityLinks.aiHackerdorm.description}
            </p>
            <div className="flex items-center gap-2 text-accent-green text-sm font-medium">
              <MessageSquare size={14} />
              <span>Join on WhatsApp</span>
              <ExternalLink size={12} className="ml-1" />
            </div>
          </motion.a>

          <motion.a
            href={communityLinks.linkedin.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="cursor-pointer glass-card glass-card-hover rounded-2xl p-8 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-400/10 flex items-center justify-center">
                <Link2 size={20} className="text-sky-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy-50 group-hover:text-sky-300 transition-colors">
                  {communityLinks.linkedin.title}
                </h3>
              </div>
            </div>
            <p className="text-sm text-navy-100/60 leading-relaxed mb-6">
              {communityLinks.linkedin.description}
            </p>
            <div className="flex items-center gap-2 text-sky-300 text-sm font-medium">
              <span>Follow on LinkedIn</span>
              <ExternalLink size={12} className="ml-1" />
            </div>
          </motion.a>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 text-center"
        >
          <a
            href={communityLinks.feedback.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-warm-500 text-navy-900 font-semibold text-sm hover:bg-warm-400 transition-colors duration-200 glow-warm"
          >
            <MessageSquare size={16} />
            {communityLinks.feedback.title}
            <ExternalLink size={14} />
          </a>
          <p className="text-xs text-navy-200/30 mt-3">
            {communityLinks.feedback.description}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
