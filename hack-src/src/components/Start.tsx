import { situations } from '../data/guide'
import { go, hrefFor } from '../lib/nav'
import Art from './Art'

export default function Start() {
  return (
    <section id="start" aria-labelledby="start-title" className="pt-6 pb-20 sm:pt-10">
      <Art name="hall" className="-mx-5 aspect-[21/9] sm:mx-0" />
      <p className="label relative -mt-6 sm:-mt-10">// Field manual · hackathons</p>
      <h1
        id="start-title"
        className="relative mt-4 font-display text-5xl font-black leading-[0.95] tracking-tight text-type sm:text-7xl"
      >
        Hackathon
        <br />
        field manual
      </h1>
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
              className="focus-ring grid gap-1 px-5 py-4 sm:grid-cols-[14rem_1fr_auto] sm:items-baseline sm:gap-6"
            >
              <span className="text-[15px] font-medium text-type">{s.title}</span>
              <span className="text-sm leading-relaxed text-type-dim">{s.hint}</span>
              <span aria-hidden className="hidden font-mono text-xs text-type-faint sm:block">→</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
