import { gitSteps } from '../data/guide'
import { aiTools, techStack } from '../data/resources'
import Section, { SubHeading } from './Section'

export default function Stack() {
  return (
    <Section
      id="stack"
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
                  <span className="font-medium text-type">{item.name}</span> — {item.description}
                </p>
              ))}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-14">
        <SubHeading>AI building tools</SubHeading>
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
                  {tool.name}
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
