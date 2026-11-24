import { useEffect, useState, type MouseEvent } from 'react'

/**
 * The same sky dial as hong.build's chrome (components/theme-toggle.tsx), and
 * the same storage key, so a visitor's choice follows them between the two.
 * Light is the default; `data-theme="dark"` on <html> is the only state, set
 * before paint by the script in index.html.
 */
const STORAGE_KEY = 'hb.theme'
const THEME_COLOR = { light: '#cddbf6', dark: '#0a0b0d' } as const

type Scheme = 'light' | 'dark'

function readScheme(): Scheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function applyScheme(next: Scheme) {
  const root = document.documentElement
  if (next === 'dark') root.dataset.theme = 'dark'
  else delete root.dataset.theme
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute('content', THEME_COLOR[next]))
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Private mode: the choice just doesn't outlive the tab.
  }
}

export default function ThemeToggle() {
  const [scheme, setSchemeState] = useState<Scheme>(readScheme)
  const dark = scheme === 'dark'

  // Another tab (or the main site) changed it: follow.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      const next: Scheme = event.newValue === 'dark' ? 'dark' : 'light'
      applyScheme(next)
      setSchemeState(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    const next: Scheme = dark ? 'light' : 'dark'
    const commit = () => {
      applyScheme(next)
      setSchemeState(next)
    }

    const root = document.documentElement
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || typeof document.startViewTransition !== 'function') {
      commit()
      return
    }

    // Open from the dial's centre, far enough to reach the furthest corner.
    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    root.style.setProperty('--reveal-x', `${x}px`)
    root.style.setProperty('--reveal-y', `${y}px`)
    root.style.setProperty('--reveal-r', `${r}px`)
    root.dataset.themeReveal = '1'

    const transition = document.startViewTransition(commit)
    void transition.finished.finally(() => {
      delete root.dataset.themeReveal
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? 'Switch to light' : 'Switch to dark'}
      title={dark ? 'Night — switch to day' : 'Day — switch to night'}
      className="focus-ring sky-dial"
    >
      <span className="sky-dial-window" aria-hidden="true">
        <span className="sky-dial-day" />
        <span className="sky-dial-night" />
        <span className="sky-dial-wheel">
          <span className="sky-dial-sun" />
          <span className="sky-dial-moon" />
        </span>
        <span className="sky-dial-cloud" />
        <span className="sky-dial-ground" />
      </span>
    </button>
  )
}
