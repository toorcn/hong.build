import Link from "next/link";
import { SITE } from "@/content/site";
import { HomeEntry } from "@/components/home-entry";
import { StartTourButton } from "@/components/start-tour";
import { VantageSwitcher } from "@/components/vantage-switcher";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Spacer: the scene occupies the center. Copy sits low, out of the way. */}
      <div className="flex-1" />

      <div className="px-5 pb-40 sm:px-8 sm:pb-16">
        <p className="max-w-md font-mono text-[11px] leading-relaxed tracking-[0.08em] text-type-dim">
          {"// nothing is here until you look right"}
        </p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-type-dim">
          A cloud of fragments. Five angles where it means something.
          <span className="text-type"> {SITE.thesis}</span>
        </p>

        <HomeEntry />

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <StartTourButton />
          <Link
            href="/work"
            className="focus-ring border border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-type-dim transition-colors hover:border-accent hover:text-type"
          >
            View work
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-type-faint">
            or drag the cloud to explore freely
          </span>
        </div>
      </div>

      <VantageSwitcher />
    </div>
  );
}
