import { PALETTE, sprites, type SpriteName } from '../data/sprites'

/** Horizontal runs of one colour in a row, so a sprite is a few rects, not 256. */
function runs(frame: readonly string[]) {
  const out: { x: number; y: number; w: number; fill: string }[] = []
  frame.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const c = row[x]
      if (c === '.' || !PALETTE[c]) {
        x++
        continue
      }
      let w = 1
      while (row[x + w] === c) w++
      out.push({ x, y, w, fill: PALETTE[c] })
      x += w
    }
  })
  return out
}

/**
 * A 16×16 pixel sprite, drawn as crisp inline SVG. Decorative by default;
 * pass `label` when it carries meaning. Two-frame sprites animate (CSS only).
 * Add `sprite-hop` to hop when the nearest `.group` is hovered.
 */
export default function Sprite({
  name,
  size = 32,
  className = '',
  label,
}: {
  name: SpriteName
  size?: number
  className?: string
  label?: string
}) {
  const frames = sprites[name]
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={`sprite ${frames.length > 1 ? 'sprite-anim' : ''} ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {frames.map((frame, i) => (
        <g key={i} className={frames.length > 1 ? `sprite-frame sprite-frame-${i}` : undefined}>
          {runs(frame).map((r, j) => (
            <rect key={j} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
          ))}
        </g>
      ))}
    </svg>
  )
}
