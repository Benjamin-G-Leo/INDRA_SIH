'use client'

import type { ReactNode } from 'react'

export default function Panel({
  title,
  eyebrow,
  children,
  className = '',
  action,
}: {
  title?: string
  eyebrow?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <section className={`panel content-panel ${className}`}>
      {(title || eyebrow) && (
        <div className="panel-head">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && <h2>{title}</h2>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
