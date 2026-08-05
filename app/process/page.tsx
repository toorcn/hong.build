import type { Metadata } from "next";
import { ContentPanel } from "@/components/content-panel";

export const metadata: Metadata = {
  title: "Process",
  description: "How I build — and what RM25,000 of AI taught me about using it.",
};

const PRINCIPLES = [
  {
    k: "think.build.test.break.correct.repeat",
    v: "Speed is not the same as progress. I'd rather run ten cheap loops than one expensive guess.",
  },
  {
    k: "intent beats volume",
    v: "Some of my best work came from the smallest prompts. Some of my worst came from throwing everything at the wall. Unclear prompts are usually unclear thinking.",
  },
  {
    k: "ai is infrastructure, not magic",
    v: "After RM25,000 of AI, the first good answer impresses me least. What matters is what happens after: can I give it context, tell when it's making something up, and turn the output into something that actually works?",
  },
  {
    k: "the tool is never the point",
    v: "Whether it's a meeting moderator or a convention, the build only matters if the room works. I optimize for the person, then the system.",
  },
] as const;

export default function ProcessPage() {
  return (
    <ContentPanel title="How I build">
      <p className="max-w-xl text-base leading-relaxed text-type-dim">
        I'm less impressed by a good first answer every year. This is the loop
        I actually trust, and the stance on AI it produced.
      </p>

      <dl className="panel-rows mt-14">
        {PRINCIPLES.map((p, i) => (
          <div key={p.k} className="panel-row px-5 py-6 sm:px-7">
            <dt className="flex items-baseline gap-4">
              <span className="font-mono text-[10px] tracking-[0.18em] text-type-faint">
                {String(i).padStart(2, "0")}
              </span>
              <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-accent">
                {p.k}
              </span>
            </dt>
            <dd className="mt-3 max-w-xl text-base leading-relaxed text-type-dim">{p.v}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-12 max-w-xl text-base leading-relaxed text-type-dim">
        Still figuring out the best way to work with all of this. That's the
        honest version — the loop is the point, not the destination.
      </p>
    </ContentPanel>
  );
}
