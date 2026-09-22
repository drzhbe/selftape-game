import { CRITERIA, type CriterionKey } from '../criteria'
import type { Scores } from '../types'

/** Hexagon radar, one axis per criterion, scale 0–5. */
export function Radar({ series, size = 260 }: { series: { scores: Scores; color: string; label: string }[]; size?: number }) {
  const c = size / 2
  const r = size / 2 - 38
  const point = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / CRITERIA.length - Math.PI / 2
    return [c + Math.cos(a) * r * (v / 5), c + Math.sin(a) * r * (v / 5)]
  }
  const poly = (vals: number[]) => vals.map((v, i) => point(i, v).join(',')).join(' ')
  return (
    <div className="radar">
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }} role="img" aria-label="Score radar">
        {[1, 2, 3, 4, 5].map((ring) => (
          <polygon key={ring} points={poly(CRITERIA.map(() => ring))} className="radar-ring" />
        ))}
        {CRITERIA.map((_, i) => {
          const [x, y] = point(i, 5)
          return <line key={i} x1={c} y1={c} x2={x} y2={y} className="radar-ring" />
        })}
        {series.map((s) => (
          <polygon
            key={s.label}
            points={poly(CRITERIA.map((cr) => s.scores[cr.key]))}
            fill={s.color}
            fillOpacity={0.22}
            stroke={s.color}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        ))}
        {CRITERIA.map((cr, i) => {
          const [x, y] = point(i, 6.3)
          return (
            <text key={cr.key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="20">
              {cr.emoji}
            </text>
          )
        })}
      </svg>
      {series.length > 1 && (
        <div className="legend">
          {series.map((s) => (
            <span key={s.label}>
              <i style={{ background: s.color }} /> {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Small line of values 1–5 over time. */
export function Sparkline({ values, color = 'var(--green)', width = 90, height = 28 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length < 2) return <svg width={width} height={height} />
  const pad = 3
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2)
  const y = (v: number) => height - pad - ((v - 1) / 4) * (height - pad * 2)
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  return (
    <svg width={width} height={height} aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={3.5} fill={color} />
    </svg>
  )
}

/** One line per criterion across takes; highlight one criterion if given. */
export function TrendChart({ takes, highlight }: { takes: Scores[]; highlight?: CriterionKey }) {
  const w = 600
  const h = 200
  const pl = 30
  const pr = 10
  const pt = 10
  const pb = 26
  if (takes.length < 2) return <p className="muted small">Score at least two takes to see the trend.</p>
  const x = (i: number) => pl + (i / (takes.length - 1)) * (w - pl - pr)
  const y = (v: number) => pt + (1 - (v - 1) / 4) * (h - pt - pb)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" className="trend" role="img" aria-label="Scores over time">
      {[1, 2, 3, 4, 5].map((v) => (
        <g key={v}>
          <line x1={pl} x2={w - pr} y1={y(v)} y2={y(v)} className="grid" />
          <text x={pl - 10} y={y(v)} dominantBaseline="middle" textAnchor="middle" className="axis">
            {v}
          </text>
        </g>
      ))}
      {takes.map((_, i) => (
        <text key={i} x={x(i)} y={h - 4} textAnchor="middle" className="axis">
          {takes.length <= 12 || i % Math.ceil(takes.length / 12) === 0 ? i + 1 : ''}
        </text>
      ))}
      {CRITERIA.map((c) => {
        const faded = highlight && highlight !== c.key
        const d = takes.map((s, i) => `${i ? 'L' : 'M'}${x(i)},${y(s[c.key])}`).join(' ')
        return (
          <path
            key={c.key}
            d={d}
            fill="none"
            stroke={c.color}
            strokeWidth={faded ? 1.5 : 3}
            strokeOpacity={faded ? 0.25 : 1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      })}
    </svg>
  )
}
