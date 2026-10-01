'use client'

import { Activity, AlertTriangle, Bot, MapPin, Radio } from 'lucide-react'
import type { ComponentType } from 'react'

const kpis = [
  { icon: Radio, label: 'Total incident reports', value: '128,450', delta: '+12.8%', tone: 'blue' },
  { icon: Activity, label: 'Active incidents', value: '37', delta: '+4.2%', tone: 'cyan' },
  { icon: AlertTriangle, label: 'Critical alerts', value: '8', delta: '+2', tone: 'red' },
  { icon: MapPin, label: 'Affected locations', value: '142', delta: '+18.6%', tone: 'amber' },
  { icon: Bot, label: 'AI-detected incidents', value: '64', delta: '+23.1%', tone: 'purple' },
]

function Stat({
  icon: Icon,
  label,
  value,
  delta,
  tone = 'blue',
}: {
  icon: ComponentType<{ size?: number }>
  label: string
  value: string
  delta: string
  tone: string
}) {
  return (
    <div className="stat panel">
      <div className={`stat-icon ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        <small className={delta.startsWith('+') ? 'up' : ''}>
          {delta} <em>vs previous period</em>
        </small>
      </div>
    </div>
  )
}

export default function KPISection() {
  return (
    <div className="stats">
      {kpis.map(kpi => (
        <Stat key={kpi.label} {...kpi} />
      ))}
    </div>
  )
}
