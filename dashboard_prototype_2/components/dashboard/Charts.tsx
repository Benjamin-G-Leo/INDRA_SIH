'use client'

import type { ReactNode } from 'react'

export function Bars({ data, color = 'cyan', suffix = '' }: { data: [string, number][]; color?: string; suffix?: string }) {
  const max = Math.max(1, ...data.map(([, v]) => Number(v)))
  return (
    <div className="bars">
      {data.map(([name, val]) => (
        <div className="bar-row" key={name}>
          <div className="bar-label">
            <span>{name}</span>
            <b>{val}{suffix}</b>
          </div>
          <div className="bar-track">
            <i className={color} style={{ width: `${(Number(val) / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Donut({ data }: { data: (string | number)[][] }) {
  const total = data.reduce((s, [, v]) => s + Number(v), 0)
  const colors = ['var(--cyan)', 'var(--blue)', 'var(--red)', 'var(--purple)', 'var(--green)']
  const cx = 100, cy = 100, outerR = 55, innerR = 30

  let cumulative = 0
  const segments = data.map(([name, val], i) => {
    const pct = Number(val) / total
    const sweepAngle = pct * 360
    const startAngle = cumulative * 360 - 90
    const endAngle = startAngle + sweepAngle
    cumulative += pct

    const startRad = startAngle * Math.PI / 180
    const endRad = endAngle * Math.PI / 180
    const largeArc = sweepAngle > 180 ? 1 : 0

    const x1 = cx + outerR * Math.cos(startRad)
    const y1 = cy + outerR * Math.sin(startRad)
    const x2 = cx + outerR * Math.cos(endRad)
    const y2 = cy + outerR * Math.sin(endRad)
    const x3 = cx + innerR * Math.cos(endRad)
    const y3 = cy + innerR * Math.sin(endRad)
    const x4 = cx + innerR * Math.cos(startRad)
    const y4 = cy + innerR * Math.sin(startRad)

    const d = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`

    return <path key={name} d={d} fill={colors[i % colors.length]} />
  })

  return (
    <div className="donut-wrap">
      <div className="donut-chart">
        <svg viewBox="0 0 200 200" role="img" aria-label="Reports by source distribution">
          {segments}
        </svg>
        <div className="donut-total">
          <b className="donut-total-value">{total}</b>
          <small>TOTAL REPORTS</small>
        </div>
      </div>
      <ul className="donut-legend">
        {data.map(([name, val], i) => (
          <li key={name} className="donut-legend-item">
            <span className="donut-legend-dot" style={{ background: colors[i % colors.length] }} />
            <span className="donut-legend-label">{name}</span>
            <b className="donut-legend-value">{val}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SectionHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="section-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  )
}
