import Header from './components/Header'
import { SectionBar, Sidebar } from './components/Contents'
import Start from './components/Start'
import Rules from './components/Rules'
import Workshop from './components/Workshop'
import Questions from './components/Questions'
import Playbook from './components/Playbook'
import Stack from './components/Stack'
import Links from './components/Links'
import Sprite from './components/Sprite'

export default function App() {
  return (
    <>
      <a
        href="#start"
        className="focus-ring sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-void"
      >
        Skip to content
      </a>
      <div className="sticky top-0 z-30">
        <Header />
        <SectionBar />
      </div>
      <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16">
        <aside className="hidden pt-16 lg:block">
          <Sidebar />
        </aside>
        <main className="min-w-0 max-w-3xl">
          <Start />
          <Rules />
          <Workshop />
          <Questions />
          <Playbook />
          <Stack />
          <Links />
        </main>
      </div>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="flex items-center gap-3 font-mono text-[11px] text-type-faint">
            <Sprite name="figure" size={24} />
            <span>{'// written for first-time teams. use what helps, skip the rest.'}</span>
          </p>
          <p className="flex gap-5 font-mono text-[11px] uppercase tracking-[0.16em]">
            <a href="/" className="focus-ring text-type-dim hover:text-accent">hong.build</a>
            <a href="/contact" className="focus-ring text-type-dim hover:text-accent">Contact</a>
            <a href="#start" className="focus-ring text-type-dim hover:text-accent">Top ↑</a>
          </p>
        </div>
      </footer>
    </>
  )
}
