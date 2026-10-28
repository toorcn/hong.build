import { situations } from '../data/guide'
import { go, hrefFor } from '../lib/nav'
import Art from './Art'
import Sprite from './Sprite'
import { sectionSprites, situationSprites } from '../data/sprites'

export default function Start() {
  return (
    <section id="start" aria-labelledby="start-title" className="pt-6 pb-20 sm:pt-10">
      <Art name="hall" className="-mx-5 aspect-[21/9] sm:mx-0" />
      <p className="label relative -mt-6 flex items-center gap-3 sm:-mt-10">
        <Sprite name={sectionSprites.start} size={28} className="sprite-bob" />
        <span>// Field manual · hackathons</span>
      </p>
      <div className="relative mt-4 flex items-end justify-between gap-6">
        <h1
          id="start-title"
          className="font-display text-5xl font-black leading-[0.95] tracking-tight text-type sm:text-7xl"
        >
          Hackathon
          <br />
          field manual
        </h1>
        <Sprite name="figure" size={80} label="A small pixel figure waving" className="hidden shrink-0 sm:block" />
      </div>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-type-dim">
        What I teach first-time teams, written down so you can use it mid-event. Don't read it
        top to bottom. Find where you are, take the next move, close the tab.
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
                {situationSprites[s.title] && <Sprite name={situationSprites[s.title]} size={28} className="sprite-hop" />}
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
