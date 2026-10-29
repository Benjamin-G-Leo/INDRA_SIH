'use client'

import type { Incident } from '@/lib/types'
import { Activity, AlertTriangle, Bot, Radio } from 'lucide-react'
import type { ComponentType } from 'react'

const kpis = (incidents: Incident[]) => [
{ icon: Radio, label: 'Total incident reports', value: incidents.length.toLocaleString(), delta: '+12.8%', tone: 'blue' },
{ icon: Activity, label: 'Active incidents', value: incidents.filter((i) => i.status !== 'Resolved').length.toString(), delta: '+4.2%', tone: 'cyan' },
{ icon: AlertTriangle, label: 'Critical alerts', value: incidents.filter((i) => i.severity === 'critical').length.toString(), delta: '+2', tone: 'red' },
{ icon: Bot, label: 'High-confidence incidents (75%+)', value: incidents.filter((i) => i.confidence >= 75).length.toString(), delta: '+23.1%', tone: 'purple' },
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
return ( <div className="stat panel">
<div className={`stat-icon ${tone}`}> <Icon size={18} /> </div> <div className="stat-copy"> <span>{label}</span> <strong>{value}</strong>
<small className="">
{delta} <em>static demonstration value</em> </small> </div> </div>
)
}

export default function KPISection({ incidents }: { incidents: Incident[] }) {
return ( <div className="stats">
{kpis(incidents).map(kpi => (
<Stat key={kpi.label} {...kpi} />
))} </div>
)
}

