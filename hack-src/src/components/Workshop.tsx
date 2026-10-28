import { useState } from 'react'
import { workshop } from '../data/guide'
import { go, hrefFor } from '../lib/nav'
import Section, { SubHeading } from './Section'

const { videoId, chapters } = workshop

export default function Workshop() {
  return (
    <Section
      id="workshop"
      title="The full workshop"
      intro="Watch it once before your hackathon. During the event, use the sections below instead of rewatching."
    >
      <Video />
      <a
        href={`https://youtu.be/${videoId}`}
        target="_blank"
        rel="noreferrer"
        className="focus-ring mt-3 inline-block font-mono text-[11px] uppercase tracking-[0.16em] text-type-faint transition-colors hover:text-accent"
      >
        Open on YouTube ↗
      </a>

      <div className="mt-12">
        <SubHeading>What it covers</SubHeading>
        <ol className="rows">
          {chapters.map((c, i) => (
            <li key={c.title} className="row">
              <a
                href={hrefFor(c.target)}
                onClick={(e) => go(c.target, e)}
                className="focus-ring grid gap-1 px-5 py-4 sm:grid-cols-[3rem_1fr_auto] sm:items-baseline sm:gap-4"
              >
                <span className="font-mono text-[11px] text-type-faint">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <span className="block text-[15px] font-medium text-type">{c.title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-type-dim">{c.body}</span>
                </span>
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-type-faint sm:block">
                  read →
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}

/** Poster first; the YouTube iframe only loads when asked for. */
function Video() {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="relative aspect-video overflow-hidden border border-line bg-panel">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title="Hackathon workshop recording"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="focus-ring group absolute inset-0 h-full w-full"
          aria-label="Play the workshop recording"
        >
          <img
            src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-60 grayscale transition duration-300 group-hover:opacity-80 group-hover:grayscale-0"
          />
          <span className="absolute bottom-0 left-0 flex items-center gap-3 border-t border-r border-line bg-void px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-type transition-colors group-hover:text-accent">
            <span aria-hidden className="text-accent">▶</span> Play recording
          </span>
        </button>
      )}
    </div>
  )
}
