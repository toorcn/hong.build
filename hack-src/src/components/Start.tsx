import { situations } from '../data/guide'
import { qaData } from '../data/qa'
import { playbookData } from '../data/playbook'
import { go, hrefFor } from '../lib/nav'
import { sectionSprites, situationSprites } from '../data/sprites'
import Sprite from './Sprite'

const stats = [
  { n: '1', k: 'workshop recording' },
  { n: String(qaData.length), k: 'participant questions' },
  { n: String(playbookData.length), k: 'pitch patterns' },
  { n: '16×', k: 'hackathon wins' },
]

export default function Start() {
  return (
    <section id="start" aria-labelledby="start-title" className="pt-10 pb-20 sm:pt-16">
      <p className="label flex items-center gap-3">
        <Sprite name={sectionSprites.start} size={28} className="sprite-bob" />
        <span>{'// Field manual · hackathons'}</span>
      </p>
      <div className="mt-4 flex items-end justify-between gap-6">
        <h1
          id="start-title"
          className="font-display text-5xl font-black leading-[0.95] tracking-tight text-type sm:text-7xl"
        >
          Hackathon
          <br />
          field manual
        </h1>
        <Sprite name="figure" size={96} label="A small pixel figure waving" className="hidden shrink-0 sm:block" />
      </div>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-type-dim">
        What I teach first-time teams, written down so you can use it mid-event. Don't read it
        top to bottom. Find where you are, take the next move, close the tab.
      </p>

      <dl className="mt-10 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="bg-void px-5 py-4">
            <dt className="label">{s.k}</dt>
            <dd className="mt-1 font-display text-3xl font-black leading-none text-type">{s.n}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 font-mono text-[11px] text-type-faint">
        {'// the wins came after five events with nothing. '}
        <a href="/notes" className="focus-ring text-type-dim underline decoration-line underline-offset-4 hover:text-accent">
          see the run log
        </a>
      </p>

      <h2 className="label mt-16 mb-4 text-type-dim">Where are you right now?</h2>
      <ul className="rows">
        {situations.map((s) => (
          <li key={s.title} className="row">
            <a
              href={hrefFor(s.target)}
              onClick={(e) => go(s.target, e)}
              className="focus-ring group grid gap-1 px-5 py-4 sm:grid-cols-[14rem_1fr_auto] sm:items-center sm:gap-6"
            >
              <span className="flex items-center gap-3 text-[15px] font-medium text-type">
                {situationSprites[s.title] && (
                  <Sprite name={situationSprites[s.title]} size={28} className="sprite-hop" />
                )}
                {s.title}
              </span>
              <span className="text-sm leading-relaxed text-type-dim">{s.hint}</span>
              <span aria-hidden className="hidden font-mono text-xs text-type-faint sm:block">→</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
