/**
 * Point-cloud artwork (generated, see public/art). Purely decorative, so it is
 * hidden from screen readers and fades into the page at the bottom edge.
 */
export default function Art({ name, className = '' }: { name: string; className?: string }) {
  const base = `${import.meta.env.BASE_URL}art/${name}`
  return (
    <div aria-hidden className={`overflow-hidden ${className}`}>
      <img
        src={`${base}.webp`}
        srcSet={`${base}-960.webp 960w, ${base}.webp 1920w`}
        sizes="(min-width: 1024px) 768px, 100vw"
        alt=""
        loading={name === 'hall' ? 'eager' : 'lazy'}
        decoding="async"
        className="h-full w-full object-cover [mask-image:linear-gradient(to_bottom,#000_70%,transparent)]"
      />
    </div>
  )
}
