import type { Metadata } from "next";
import { ContentPanel } from "@/components/content-panel";
import { LiveRow } from "@/components/panel-motion";
import { PRINCIPLES } from "@/content/site";

export const metadata: Metadata = {
  title: "Process",
  description: "How I build — and what RM25,000 of AI taught me about using it.",
};

export default function ProcessPage() {
  return (
    <ContentPanel title="How I build">
      <p className="max-w-xl text-base leading-relaxed text-type-dim">
        I'm less impressed by a good first answer every year. This is the loop
        I actually trust, and the stance on AI it produced.
      </p>

      <dl className="panel-rows mt-14">
        {PRINCIPLES.map((p, i) => (
          <LiveRow key={p.k} delay={i * 90} className="px-5 py-6 sm:px-7">
            <dt className="flex items-baseline gap-4">
              <span className="font-mono text-[10px] tracking-[0.18em] text-type-faint">
                {String(i).padStart(2, "0")}
              </span>
              <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-accent">
                {p.k}
              </span>
            </dt>
            <dd className="mt-3 max-w-xl text-base leading-relaxed text-type-dim">{p.v}</dd>
          </LiveRow>
        ))}
      </dl>

      <p className="mt-12 max-w-xl text-base leading-relaxed text-type-dim">
        Still figuring out the best way to work with all of this. That's the
        honest version — the loop is the point, not the destination.
      </p>
    </ContentPanel>
  );
}
