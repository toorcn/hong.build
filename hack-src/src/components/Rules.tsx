import { frameworks, rules } from '../data/guide'
import Section, { SubHeading } from './Section'

export default function Rules() {
  return (
    <Section
      id="rules"
      title="The short version"
      intro="Most teams lose before they start building. They skip the thinking, build too much, then try to explain a messy product in five minutes. If you remember nothing else, remember these."
    >
      <SubHeading>Three rules</SubHeading>
      <ol className="rows">
        {rules.map((r, i) => (
          <li key={r.title} className="row grid gap-1 px-5 py-5 sm:grid-cols-[3rem_1fr] sm:gap-4">
            <span className="font-mono text-[11px] text-accent">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <p className="font-display text-xl font-bold tracking-tight text-type">{r.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-type-dim">{r.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-14">
        <SubHeading>Four frameworks</SubHeading>
        <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {frameworks.map((f) => (
            <article key={f.title} className="bg-void p-6">
              <h4 className="font-display text-lg font-bold tracking-tight text-type">{f.title}</h4>
              <p className="mt-2 text-[15px] leading-relaxed text-type">{f.summary}</p>
              <p className="mt-3 text-sm leading-relaxed text-type-dim">{f.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <p className="mt-8 font-mono text-[11px] leading-relaxed text-type-faint">
        {"// if advice doesn't help you score better, demo better, or pitch clearer, ignore it during the hackathon."}
      </p>
    </Section>
  )
}
