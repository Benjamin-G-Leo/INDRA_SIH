'use client'

import { Bot, Database, Layers3, Radio } from 'lucide-react'
import Panel from './Panel'

export default function SystemHealth() {
  const services: { name: string; icon: typeof Radio }[] = [
    { name: 'Data ingestion', icon: Radio },
    { name: 'Kafka stream', icon: Layers3 },
    { name: 'PostgreSQL', icon: Database },
    { name: 'AI processing', icon: Bot },
  ]

  return (
    <Panel
      title="Data pipeline & system health"
      eyebrow="INFRASTRUCTURE MONITORING"
      className="health-panel"
      action={<span className="last-ingest">Last successful ingestion: 14:31:52 IST</span>}
    >
      <div className="health-grid">
        {services.map(({ name, icon: Icon }) => (
          <div className="health-item" key={name}>
            <Icon size={16} />
            <span>
              {name}
              <b>
                <i /> ONLINE
              </b>
            </span>
            <strong>99.9%</strong>
          </div>
        ))}
        <div className="health-stat">
          <span>RECORDS RECEIVED</span>
          <b>12,480</b>
          <small>in last 5 min</small>
        </div>
        <div className="health-stat">
          <span>PROCESSING LATENCY</span>
          <b>240 ms</b>
          <small className="up">−18% vs avg</small>
        </div>
      </div>
      <div className="health-extra">
        <div className="health-extra-item">
          <span className="eyebrow">GRAFANA</span>
          <b>Compatible</b>
          <small>Metrics export enabled</small>
        </div>
        <div className="health-extra-item">
          <span className="eyebrow">UPTIME</span>
          <b>99.97%</b>
          <small>30-day rolling</small>
        </div>
        <div className="health-extra-item">
          <span className="eyebrow">THROUGHPUT</span>
          <b>2,486/s</b>
          <small>Peak: 3,200/s</small>
        </div>
      </div>
    </Panel>
  )
}
