"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, SITE } from "@/content/site";
import { SoundToggle } from "@/components/sound-toggle";
import { Hud } from "@/components/hud";

/**
 * Persistent interface chrome: identity, primary nav, sound control.
 * Deliberately sparse — the HUD (azimuth / signal / alignment) lives in
 * the Hud component layered over the scene.
 */
export function Chrome() {
  const pathname = usePathname();
  const onHome = pathname === "/";

  return (
    <header className="lab-chrome pointer-events-none fixed inset-x-0 top-0 z-20">
      <div className="flex items-start justify-between px-5 py-4 sm:px-8 sm:py-6">
        <Link
          href="/"
          className="focus-ring pointer-events-auto group"
          aria-label={`${SITE.name} — home`}
        >
          <span className="block font-display text-lg font-black leading-none tracking-tight text-type">
            {SITE.shortName}
          </span>
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-type-faint transition-colors group-hover:text-accent">
            {SITE.title}
          </span>
        </Link>

        <div className="pointer-events-auto flex items-center gap-5">
          <nav aria-label="Primary" className="hidden items-center gap-5 sm:flex">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`focus-ring font-mono text-[11px] uppercase tracking-[0.18em] transition-colors ${
                    active ? "text-accent" : "text-type-dim hover:text-type"
                  }`}
                >
                  <span className="mr-1 text-type-faint">{item.code}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <SoundToggle />
        </div>
      </div>

      {/* Mobile nav — same destinations, always reachable. */}
      {!onHome && (
        <nav
          aria-label="Primary mobile"
          className="pointer-events-auto fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-void/85 px-2 py-3 backdrop-blur sm:hidden"
        >
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`focus-ring font-mono text-[10px] uppercase tracking-[0.16em] ${
                  active ? "text-accent" : "text-type-dim"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      <Hud />
    </header>
  );
}
