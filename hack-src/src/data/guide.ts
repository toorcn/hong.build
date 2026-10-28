import type { categories } from './qa'

type CategoryId = (typeof categories)[number]['id']

/** Where a situation or chapter points: a section, or the Q&A filtered to one category. */
export type Target = { section: SectionId } | { category: CategoryId }

export const sections = [
  { id: 'start', label: 'Start here' },
  { id: 'rules', label: 'Rules' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'questions', label: 'Questions' },
  { id: 'playbook', label: 'Pitch playbook' },
  { id: 'stack', label: 'Stack & tools' },
  { id: 'links', label: 'Links' },
] as const

export type SectionId = (typeof sections)[number]['id']

export const situations: { title: string; hint: string; target: Target }[] = [
  {
    title: "I've never done one",
    hint: 'What to learn first, and why starting beats being ready.',
    target: { category: 'getting-started' },
  },
  {
    title: 'I need an idea',
    hint: 'Think Twice: avoid the idea every other team will pitch.',
    target: { category: 'ideation' },
  },
  {
    title: "I'm building",
    hint: 'Build the exact path you will demo. Skip login and dashboards.',
    target: { category: 'building' },
  },
  {
    title: "I'm pitching tomorrow",
    hint: 'The 24-hour polish list, timing, hooks and Q&A.',
    target: { section: 'playbook' },
  },
  {
    title: 'I want to win',
    hint: 'Rubric level 4 vs 5, focus, proof, and backup demos.',
    target: { section: 'rules' },
  },
]

export const rules = [
  {
    title: 'Do not code first.',
    body: 'The first few hours are for problem selection, rubric reading, user context, and team alignment.',
  },
  {
    title: 'Build the demo, not the company.',
    body: 'A hackathon prototype only needs the path that proves the idea in front of judges.',
  },
  {
    title: 'Pitch the benefit, then the mechanism.',
    body: 'Features show what you built. Benefits explain why anyone should care.',
  },
]

export const frameworks = [
  {
    title: 'Think Twice',
    summary: 'First idea is common sense. Second idea is where creativity starts.',
    detail: 'Do not ask AI for ideas first. Use your own perspective, then use AI to refine, validate, and build.',
  },
  {
    title: 'Rubric level 4 to 5',
    summary: 'Winning is usually the gap between good and exactly what they asked for.',
    detail: 'Read both the top score and the score below it. That line tells you what judges are really rewarding.',
  },
  {
    title: 'Benefit before feature',
    summary: 'Judges remember the outcome, not the implementation detail.',
    detail: 'Do not lead with “we built an AI chatbot.” Lead with what changes for the user because it exists.',
  },
  {
    title: 'Demo resilience stack',
    summary: 'Live happy path, cached output, recorded proof, screenshots. In that order.',
    detail: 'A broken demo is survivable when you planned the fallback. It is fatal when you assumed the room would cooperate.',
  },
]

export const workshop = {
  videoId: 'DcUYfwEzDQA',
  chapters: [
    { title: 'First-time hackathon basics', body: 'Team roles, mindset, and what beginners should know before entering the room.', target: { category: 'getting-started' } },
    { title: 'Rubric-first thinking', body: 'How to read the judging criteria and avoid building for yourself.', target: { section: 'rules' } },
    { title: 'Think Twice method', body: 'How to avoid obvious ideas and use AI without becoming identical to every team.', target: { category: 'ideation' } },
    { title: 'Scope the demo', body: 'What to build, what to fake, and why login screens waste your pitch time.', target: { category: 'building' } },
    { title: 'Pitching and Q&A', body: 'How to make judges curious, structure five minutes, and prepare backup demos.', target: { section: 'playbook' } },
  ] satisfies { title: string; body: string; target: Target }[],
}

export const gitSteps = [
  { cmd: 'git init', body: 'Start a new repository in your project folder.' },
  { cmd: 'git add . && git commit', body: 'Save your changes with a message. Commit every time a feature works.' },
  { cmd: 'git push', body: 'Upload your commits to GitHub so teammates can access them.' },
  { cmd: 'git clone', body: 'Teammates download the repository to their machine.' },
  { cmd: 'git switch -c feature', body: 'One branch per feature, so people work without conflicts.' },
  { cmd: 'pull request', body: 'Merge your branch back to main. Review changes and resolve conflicts together.' },
]
