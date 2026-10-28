import { useState } from 'react'
import { mostFrequentPattern, pitchPolishFramework, playbookData, type PlaybookItem } from '../data/playbook'
import Section, { SubHeading } from './Section'

export default function Playbook() {
  return (
    <Section
      id="playbook"
      title="Pitch playbook"
      intro="The problems I saw again and again mentoring KitaHack 2025 finalists. Each one stands alone, so start with your weakest area."
    >
      <SubHeading>Pitching tomorrow? Do these, in order</SubHeading>
      <ol className="grid gap-px border border-line bg-line sm:grid-cols-2">
        {pitchPolishFramework.map((step, i) => (
          <li key={step} className="flex gap-4 bg-void px-5 py-4">
            <span className="font-mono text-[11px] text-accent">{String(i + 1).padStart(2, '0')}</span>
            <span className="text-sm leading-relaxed text-type">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-8 border-l-2 border-accent bg-void-raised px-5 py-5">
        <p className="label">Most common feedback</p>
        <p className="mt-2 font-display text-lg font-bold tracking-tight text-type">{mostFrequentPattern.insight}</p>
        <ul className="prose-list mt-3 text-sm text-type-dim">
          {mostFrequentPattern.practice.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      <div className="mt-14">
        <SubHeading>{playbookData.length} patterns</SubHeading>
        <ul className="rows">
          {playbookData.map((item, i) => (
            <PatternRow key={item.id} item={item} n={i + 1} />
          ))}
        </ul>
      </div>
    </Section>
  )
}

function PatternRow({ item, n }: { item: PlaybookItem; n: number }) {
  const [open, setOpen] = useState(false)
  const panelId = `${item.id}-detail`

  return (
    <li className="row" data-open={open}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="focus-ring grid w-full grid-cols-[3rem_1fr_auto] items-baseline gap-3 px-5 py-4 text-left"
      >
        <span className="font-mono text-[11px] text-type-faint">{String(n).padStart(2, '0')}</span>
        <span>
          <span className="block text-[15px] font-medium text-type">{item.title}</span>
          <span className="mt-0.5 block text-sm leading-relaxed text-type-dim">{item.issue}</span>
        </span>
        <span aria-hidden className="font-mono text-xs text-type-faint">
          {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div id={panelId} className="grid gap-8 px-5 pb-6 sm:grid-cols-[1fr_16rem] sm:pl-[4.25rem]">
          <ul className="prose-list text-[15px] text-type-dim">
            {item.guidance.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
          <div className="space-y-5">
            {item.formula && (
              <div>
                <p className="label">Rule of thumb</p>
                <p className="mt-2 font-mono text-xs leading-relaxed text-accent">{item.formula}</p>
              </div>
            )}
            {item.checklist && (
              <div>
                <p className="label">Check</p>
                <ul className="mt-2 space-y-1.5">
                  {item.checklist.map((c) => (
                    <li key={c} className="flex gap-2 text-[13px] leading-snug text-type-dim">
                      <span aria-hidden className="font-mono text-type-faint">□</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  )
}
