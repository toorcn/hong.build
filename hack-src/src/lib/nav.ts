import type { Target } from '../data/guide'

export const CATEGORY_EVENT = 'guide:category'

/** Href for a target, so links still work without JS and can be opened in a new tab. */
export function hrefFor(target: Target) {
  return 'section' in target ? `#${target.section}` : `#questions/${target.category}`
}

/** Category targets filter the Q&A before scrolling to it. */
export function go(target: Target, event?: { preventDefault(): void }) {
  event?.preventDefault()
  const id = 'section' in target ? target.section : 'questions'
  if ('category' in target) {
    window.dispatchEvent(new CustomEvent(CATEGORY_EVENT, { detail: target.category }))
  }
  history.replaceState(null, '', hrefFor(target))
  document.getElementById(id)?.scrollIntoView({ block: 'start' })
}
