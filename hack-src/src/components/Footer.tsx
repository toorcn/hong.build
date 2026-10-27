import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="relative py-16 sm:py-20 noise-bg border-t border-white/5">
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <figure>
        <blockquote
          className="text-lg sm:text-xl text-navy-100/40 italic mb-6 max-w-2xl mx-auto leading-relaxed"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          "Do not wait until you have confidence to start pursuing what you want.
          The confidence comes when you are doing it and it's going well."
        </blockquote>
        <figcaption className="mb-8 text-sm text-navy-200/35">Jen Herchenroeder</figcaption>
        </figure>

        <div className="flex items-center justify-center gap-1.5 text-sm text-navy-200/30 mb-6">
          <span>Built for first-time hackathon builders</span>
          <Heart size={12} className="text-warm-500/60" />
          <span>by Hong Bing</span>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-navy-200/20">
          <a
            href="https://linkedin.com/in/hong-bing"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer hover:text-sky-300/50 transition-colors"
          >
            LinkedIn
          </a>
          <span>|</span>
          <a
            href="https://chat.whatsapp.com/C0wtRulIyxiCJgrrRHMC2I"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer hover:text-accent-green/50 transition-colors"
          >
            AI Hackerdorm
          </a>
          <span>|</span>
          <a
            href="https://forms.gle/RnbQCBBzzDY4isDi7"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer hover:text-warm-400/60 transition-colors"
          >
            Feedback
          </a>
        </div>
      </div>
    </footer>
  )
}
