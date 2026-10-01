'use client'

import type { ReactNode } from 'react'

export function Bars({ data, color = 'cyan' }: { data: [string, number][]; color?: string }) {
  return (
    <div className="bars">
      {data.map(([name, val]) => (
        <div className="bar-row" key={name}>
          <div className="bar-label">
            <span>{name}</span>
            <b>{val}{typeof val === 'number' && val < 100 ? '%' : ''}</b>
          </div>
          <div className="bar-track">
            <i className={color} style={{ width: `${Math.min(Number(val), 100)}%` }} />
          </div>
        </div>
      ))}
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
