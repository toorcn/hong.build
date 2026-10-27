import { motion } from 'framer-motion'
import { Cpu, Database, Globe, Zap, Brain } from 'lucide-react'
import { techStack, aiTools } from '../data/resources'

const sectionIcons: Record<string, React.ReactNode> = {
  Frontend: <Cpu size={18} />,
  Backend: <Zap size={18} />,
  Database: <Database size={18} />,
  Deployment: <Globe size={18} />,
  'AI / APIs': <Brain size={18} />,
}

export default function TechStackSection() {
  return (
    <section id="stack" className="relative overflow-hidden py-24 sm:py-32 noise-bg">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-navy-400/4 rounded-full blur-[100px]" />
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
            Recommended <span className="text-emphasis-sky">Tech Stack</span>
          </h2>
          <p className="text-navy-100/60 text-lg max-w-2xl mx-auto">
            Don't overthink the stack. Pick what works, learn it before the hackathon,
            and focus on building, not deciding.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {Object.entries(techStack)
            .filter(([key]) => key !== 'ai')
            .map(([key, section], sectionIndex) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: sectionIndex * 0.08 }}
                className="glass-card rounded-xl p-6"
              >
                <div className="flex items-center gap-2.5 mb-4 text-sky-300">
                  {sectionIcons[section.title]}
                  <h3 className="text-base font-semibold">{section.title}</h3>
                </div>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div key={item.name}>
                      <p className="text-sm font-medium text-navy-50">{item.name}</p>
                      <p className="text-xs text-navy-100/50 mt-0.5">{item.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass-card rounded-xl p-6 sm:p-8"
        >
          <div className="flex items-center gap-2.5 mb-4 text-warm-400">
            <Brain size={18} />
            <h3 className="text-base font-semibold">AI-Powered Building Tools</h3>
          </div>
          <p className="text-sm text-navy-100/50 mb-6">
            Build entire apps without writing code, or use AI editors to code 10x faster.
            These tools level the playing field for non-technical participants.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {aiTools.map((tool, i) => (
              <motion.a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="cursor-pointer glass-card glass-card-hover rounded-lg p-4 flex items-start gap-3 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-lg bg-warm-500/10 flex items-center justify-center shrink-0">
                  <Zap size={14} className="text-warm-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-50">{tool.name}</p>
                  <p className="text-xs text-navy-100/50 mt-0.5">{tool.description}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 glass-card rounded-xl p-6 sm:p-8"
        >
          <div className="flex items-center gap-2.5 mb-4 text-sky-300">
            <Database size={18} />
            <h3 className="text-base font-semibold">Git & GitHub Essentials</h3>
          </div>
          <p className="text-sm text-navy-100/50 mb-4">
            Git is how you save and collaborate on code. Most hackathons require you to submit
            your GitHub repository link. Here's the essential workflow:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { step: 'git init', desc: 'Start a new repository in your project folder.' },
              { step: 'git add + git commit', desc: 'Stage your changes and save them with a message. Commit every time a feature is functional.' },
              { step: 'git push', desc: 'Upload your commits to GitHub so teammates can access them.' },
              { step: 'git clone', desc: 'Teammates download the repository to their local machine.' },
              { step: 'Branches', desc: 'Create separate branches for each feature. Work independently without conflicts.' },
              { step: 'Pull Requests', desc: 'Merge your branch back to main. Review changes and resolve conflicts together.' },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg bg-navy-800/40">
                <p className="text-sm font-mono text-sky-300 font-semibold">{item.step}</p>
                <p className="text-xs text-navy-100/50 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-warm-500/5 border border-warm-500/10">
            <p className="text-sm text-warm-400">
              Save your game at a good checkpoint, not mid-crisis. Commit when a feature is functional, not when it's half-broken.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
