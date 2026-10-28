import type { ReactNode } from 'react'
import { sections, type SectionId } from '../data/guide'
import { sectionSprites } from '../data/sprites'
import Sprite from './Sprite'

export default function Section({
  id,
  title,
  intro,
  children,
}: {
  id: SectionId
  title: string
  intro?: ReactNode
  children: ReactNode
}) {
  const n = sections.findIndex((s) => s.id === id) + 1
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-t border-line pt-10 pb-20">
      <p className="label flex items-center gap-3">
        <Sprite name={sectionSprites[id]} size={28} className="sprite-bob" />
        <span>
          {String(n).padStart(2, '0')} / {sections[n - 1].label}
        </span>
      </p>
      <h2 id={`${id}-title`} className="mt-3 font-display text-3xl font-black tracking-tight text-type sm:text-4xl">
        {title}
      </h2>
      {intro && <p className="mt-4 max-w-xl text-base leading-relaxed text-type-dim">{intro}</p>}
      <div className="mt-10">{children}</div>
    </section>
  )
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="label mb-4 text-type-dim">{children}</h3>
}
