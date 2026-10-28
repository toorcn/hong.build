/** Small explanatory figures, drawn in HTML so labels stay readable at phone width. */

// Column spans are literal class names so Tailwind can see them.
const phases = [
  { label: 'Think', note: 'problem, rubric, users, team', share: '15%', span: 'sm:col-span-2', accent: true },
  { label: 'Build the happy path', note: 'only what the demo shows', share: '55%', span: 'sm:col-span-6', accent: false },
  { label: 'Freeze + rehearse', note: 'no new features', share: '15%', span: 'sm:col-span-2', accent: false },
  { label: 'Pitch', note: '5 min', share: '15%', span: 'sm:col-span-2', accent: true },
]

/**
 * Where the hours of a hackathon should go. Proportions are the advice, not a schedule.
 * A strip on wider screens; stacked rows with a share bar on phones, where the strip would truncate.
 */
export function EventTimeline() {
  return (
    <figure className="mt-10">
      <div className="hidden justify-between font-mono text-[10px] text-type-faint sm:flex">
        <span>start</span>
        <span>submission</span>
      </div>
      <ol className="mt-2 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-12">
        {phases.map((p) => (
          <li
            key={p.label}
            className={`min-w-0 px-3 py-3 ${p.span} ${p.accent ? 'bg-accent text-void' : 'bg-void-raised text-type'}`}
          >
            <p className="flex items-baseline justify-between gap-3 text-[13px] font-semibold leading-tight sm:block sm:truncate">
              {p.label}
              <span className={`font-mono text-[10px] font-normal sm:hidden ${p.accent ? 'text-void/70' : 'text-type-faint'}`}>
                ~{p.share}
              </span>
            </p>
            <p className={`mt-1 truncate font-mono text-[10px] ${p.accent ? 'text-void/70' : 'text-type-faint'}`}>{p.note}</p>
          </li>
        ))}
      </ol>
      <figcaption className="mt-3 font-mono text-[11px] text-type-faint">
        {'// where the hours go. most teams skip the first block and pay for it in the last.'}
      </figcaption>
    </figure>
  )
}

/** Level 4 vs level 5 of a rubric row: the gap is what judges are paying for. */
export function RubricGap() {
  return (
    <div aria-label="Rubric levels 1 to 5, with the gap between 4 and 5 highlighted" className="mt-5">
      <div className="grid grid-cols-5 gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="flex flex-col items-center gap-1.5">
            <div
              className={`w-full ${n >= 4 ? 'bg-accent' : 'bg-line'}`}
              style={{ height: `${n * 8}px`, opacity: n === 4 ? 0.45 : 1 }}
            />
            <span className={`font-mono text-[10px] ${n >= 4 ? 'text-accent' : 'text-type-faint'}`}>L{n}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 font-mono text-[10px] text-type-faint">read L4 and L5 side by side → build the difference</p>
    </div>
  )
}

const fallbacks = ['Live happy path', 'Cached output', 'Recorded video', 'Screenshots in deck']

/** The demo fallback ladder: each layer is what you drop to when the one above fails. */
export function DemoStack() {
  return (
    <ol aria-label="Demo fallbacks, in order" className="mt-5 space-y-1">
      {fallbacks.map((f, i) => (
        <li
          key={f}
          style={{ marginLeft: `${i * 8}%` }}
          className={`flex items-baseline justify-between border px-3 py-1.5 ${
            i === 0 ? 'border-accent text-type' : 'border-line text-type-dim'
          }`}
        >
          <span className="text-[13px]">{f}</span>
          <span className="font-mono text-[10px] text-type-faint">{i === 0 ? 'try' : `fallback ${i}`}</span>
        </li>
      ))}
    </ol>
  )
}

/** A five-minute slot, minute by minute. */
export function PitchClock() {
  return (
    <figure className="mt-10">
      <div className="grid grid-cols-10 gap-px border border-line bg-line">
        <div className="col-span-6 bg-void-raised px-3 py-3">
          <p className="text-[13px] font-semibold text-type">Slides</p>
          <p className="mt-1 font-mono text-[10px] text-type-faint">3:00 · max 10 slides</p>
        </div>
        <div className="col-span-3 bg-accent px-3 py-3 text-void">
          <p className="text-[13px] font-semibold">Demo</p>
          <p className="mt-1 font-mono text-[10px] text-void/70">1:00–1:30 real</p>
        </div>
        <div className="col-span-1 bg-void px-1 py-3 text-center">
          <p className="font-mono text-[10px] leading-tight text-type-faint">buf</p>
        </div>
      </div>
      <div className="mt-1.5 grid grid-cols-5 font-mono text-[10px] text-type-faint">
        {['0:00', '1:00', '2:00', '3:00', '4:00'].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <figcaption className="mt-3 font-mono text-[11px] text-type-faint">
        {'// a five-minute slot. the demo is shorter than you think, so it shows 2–3 screens, not the product.'}
      </figcaption>
    </figure>
  )
}
