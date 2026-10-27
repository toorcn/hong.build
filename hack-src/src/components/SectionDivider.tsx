export default function SectionDivider({ variant = 'default' }: { variant?: 'default' | 'accent' }) {
  return (
    <div className="relative max-w-5xl mx-auto px-6 py-2">
      <div
        className={`h-px w-full ${
          variant === 'accent'
            ? 'bg-gradient-to-r from-transparent via-sky-400/20 to-transparent'
            : 'bg-gradient-to-r from-transparent via-white/5 to-transparent'
        }`}
      />
    </div>
  )
}
