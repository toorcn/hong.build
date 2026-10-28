import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { applyTheme, getPreferredTheme, saveTheme, type Theme } from '../theme'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => getPreferredTheme())
  const isDark = theme === 'dark'

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark'
    setTheme(nextTheme)
    saveTheme(nextTheme)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle cursor-pointer"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__thumb">
          {isDark ? <Moon size={14} strokeWidth={2.4} /> : <Sun size={14} strokeWidth={2.4} />}
        </span>
      </span>
    </button>
  )
}

