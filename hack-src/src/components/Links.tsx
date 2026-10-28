import { communityLinks, resources } from '../data/resources'
import Section, { SubHeading } from './Section'

const community = [communityLinks.aiHackerdorm, communityLinks.linkedin, communityLinks.feedback]

export default function Links() {
  return (
    <Section id="links" title="Links">
      <SubHeading>Keep going</SubHeading>
      <ul className="rows">
        {community.map((c) => (
          <li key={c.title} className="row">
            <ExternalRow href={c.url} title={c.title} body={c.description} />
          </li>
        ))}
      </ul>

      <div className="mt-14">
        <SubHeading>Further reading</SubHeading>
        <ul className="rows">
          {resources.map((r) => (
            <li key={r.url} className="row">
              <ExternalRow href={r.url} title={r.title} body={r.description} />
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

function ExternalRow({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="focus-ring group grid gap-1 px-5 py-4 sm:grid-cols-[14rem_1fr_auto] sm:items-baseline sm:gap-6"
    >
      <span className="text-[15px] font-medium text-type">{title}</span>
      <span className="text-sm leading-relaxed text-type-dim">{body}</span>
      <span aria-hidden className="hidden font-mono text-xs text-type-faint group-hover:text-accent sm:block">↗</span>
    </a>
  )
}
