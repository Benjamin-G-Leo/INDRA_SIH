'use client'

import { Bot } from 'lucide-react'
import type { Alert, Incident } from '@/lib/types'
import Panel from './Panel'

export default function AlertSystem({
  alerts,
  incidents,
  onAlertClick,
  acknowledged,
  onAck,
}: {
  alerts: Alert[]
  incidents: Incident[]
  onAlertClick: (incidentId: number) => void
  acknowledged: number[]
  onAck: (index: number) => void
}) {
  return (
    <Panel
      title="Alert System"
      eyebrow="ALERT STREAM"
      className="alerts-panel"
      action={<span className="count-badge">{alerts.length} ACTIVE</span>}
    >
      <div className="alerts">
        {alerts.map((alert, i) => {
          const incident = incidents.find(inc => inc.id === alert.incidentId)
          const isAcked = acknowledged.includes(i)
          return (
            <div
              className={`alert ${alert.sev} ${isAcked ? 'acknowledged' : ''}`}
              key={i}
              onClick={() => onAlertClick(alert.incidentId)}
              style={{ cursor: 'pointer' }}
            >
              <div className="alert-line">
                <span className={`severity-tag ${alert.sev}`}>{alert.sev}</span>
                <time>{alert.time}</time>
                {incident && (
                  <span className="alert-status">{incident.status}</span>
                )}
              </div>
              <h3>
                {alert.event} <small>· {alert.place}</small>
              </h3>
              <p>{alert.text}</p>
              <div className="alert-foot">
                <span>
                  <Bot size={12} /> AI confidence <b>{alert.confidence}</b>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onAck(i)
                  }}
                >
                  {isAcked ? 'Acknowledged' : 'Acknowledge'}
                </button>
              </div>
              <small className="source-note">Evidence: {alert.source}</small>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
