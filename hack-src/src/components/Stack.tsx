import { gitSteps } from '../data/guide'
import { aiTools, techStack } from '../data/resources'
import Section, { SubHeading } from './Section'

export default function Stack() {
  return (
    <Section
      id="stack"
      art="stack"
      title="Stack & tools"
      intro="Don't overthink the stack. Pick what works, learn it before the hackathon, and spend the event building, not deciding."
    >
      <SubHeading>Defaults</SubHeading>
      <dl className="rows">
        {Object.values(techStack).map((group) => (
          <div key={group.title} className="row grid gap-2 px-5 py-4 sm:grid-cols-[8rem_1fr] sm:gap-6">
            <dt className="label pt-1">{group.title}</dt>
            <dd className="space-y-2">
              {group.items.map((item) => (
                <p key={item.name} className="text-sm leading-relaxed text-type-dim">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="focus-ring font-medium text-type underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <span className="font-medium text-type">{item.name}</span>
                  )}{' '}
                  — {item.description}
                  {item.links && (
                    <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {item.links.map((l) => (
                        <a
                          key={l.url}
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="focus-ring font-mono text-[11px] uppercase tracking-[0.14em] text-accent-dim transition-colors hover:text-accent"
                        >
                          {l.label} ↗
                        </a>
                      ))}
                    </span>
                  )}
                </p>
              ))}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-14">
        <SubHeading>AI building tools</SubHeading>
        <p className="mb-5 max-w-xl text-sm leading-relaxed text-type-dim">
          Editors and app builders are the easy start. If you're willing to go beyond the usual UI or IDE, the
          agents tagged below work from a terminal or in the cloud and can take on whole tasks.
        </p>
        <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {aiTools.map((tool) => (
            <li key={tool.name} className="bg-void">
              <a
                href={tool.url}
                target="_blank"
                rel="noreferrer"
                className="focus-ring group block h-full p-5 transition-colors hover:bg-void-raised"
              >
                <span className="flex justify-between text-[15px] font-medium text-type">
                  <span className="flex items-baseline gap-3">
                    {tool.name}
                    {tool.tag && <span className="label text-accent-dim">{tool.tag}</span>}
                  </span>
                  <span aria-hidden className="font-mono text-xs text-type-faint group-hover:text-accent">↗</span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-type-dim">{tool.description}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-14">
        <SubHeading>Git, the parts you need</SubHeading>
        <p className="mb-5 max-w-xl text-sm leading-relaxed text-type-dim">
          Most hackathons ask for a GitHub link when you submit. This is the whole workflow.
        </p>
        <ol className="rows">
          {gitSteps.map((s) => (
            <li key={s.cmd} className="row grid gap-1 px-5 py-3.5 sm:grid-cols-[13rem_1fr] sm:gap-6">
              <code className="font-mono text-[13px] text-accent">{s.cmd}</code>
              <span className="text-sm leading-relaxed text-type-dim">{s.body}</span>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  )
}
