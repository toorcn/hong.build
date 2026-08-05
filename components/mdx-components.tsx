import type { MDXComponents } from "mdx/types";

export const mdxComponents: MDXComponents = {
  h2: (props) => (
    <h2
      className="mt-12 font-display text-2xl font-black tracking-tight text-type first:mt-0"
      {...props}
    />
  ),
  h3: (props) => (
    <h3 className="mt-8 font-display text-xl font-bold tracking-tight text-type" {...props} />
  ),
  p: (props) => <p className="mt-5 text-base leading-relaxed text-type-dim" {...props} />,
  ul: (props) => <ul className="mt-5 space-y-2.5" {...props} />,
  li: (props) => (
    <li className="flex gap-3 text-base leading-relaxed text-type-dim" {...props}>
      <span aria-hidden="true" className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-accent" />
      <span>{props.children}</span>
    </li>
  ),
  strong: (props) => <strong className="font-semibold text-type" {...props} />,
  a: (props) => (
    <a
      className="text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="mt-8 border-l-2 border-accent pl-5 font-display text-xl font-bold leading-snug text-type"
      {...props}
    />
  ),
};
