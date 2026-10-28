import type { ReactNode } from 'react'
import { sections, type SectionId } from '../data/guide'
import Art from './Art'

export default function Section({
  id,
  title,
  intro,
  art,
  children,
}: {
  id: SectionId
  title: string
  intro?: ReactNode
  /** Name of a banner in public/art. */
  art?: string
  children: ReactNode
}) {
  const n = sections.findIndex((s) => s.id === id) + 1
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-t border-line pt-10 pb-20">
      <p className="label">
        {String(n).padStart(2, '0')} / {sections[n - 1].label}
      </p>
      <h2 id={`${id}-title`} className="mt-3 font-display text-3xl font-black tracking-tight text-type sm:text-4xl">
        {title}
      </h2>
      {intro && <p className="mt-4 max-w-xl text-base leading-relaxed text-type-dim">{intro}</p>}
      {art && <Art name={art} className="-mx-5 mt-8 aspect-[3/1] sm:mx-0" />}
      <div className={art ? 'mt-4' : 'mt-10'}>{children}</div>
    </section>
  )
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="label mb-4 text-type-dim">{children}</h3>
}
