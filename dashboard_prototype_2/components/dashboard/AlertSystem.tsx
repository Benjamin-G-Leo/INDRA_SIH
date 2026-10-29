'use client'

import { Bot } from 'lucide-react'
import { useState } from 'react'
import type { Alert, Incident } from '@/lib/types'
import { formatTimestamp, type FreshnessState } from '@/lib/utils'
import Panel from './Panel'

export default function AlertSystem({
  alerts,
  incidents,
  onAlertClick,
  freshness,
}: {
  alerts: Alert[]
  incidents: Incident[]
  onAlertClick: (incidentId: number) => void
  freshness: FreshnessState
}) {
  const freshnessLabel = freshness === 'updating' ? 'UPDATING' : freshness === 'fresh' ? 'FRESH' : 'STALE';
  const [tab, setTab] = useState<'red' | 'orange' | 'yellow'>('red');

  const severityMap = {
    red: 'critical',
    orange: 'high',
    yellow: 'moderate',
  };

  const redCount = alerts.filter(alert => alert.sev === 'critical').length;
  const orangeCount = alerts.filter(alert => alert.sev === 'high').length;
  const yellowCount = alerts.filter(alert => alert.sev === 'moderate').length;

  const filteredAlerts = alerts.filter(alert => alert.sev === severityMap[tab]);

  return (
    <Panel
      title="Alert System (as per IMD)"
      eyebrow="ALERT STREAM"
      className="alerts-panel"
      action={
        <>
          <span className={`freshness-badge freshness-${freshness}`}>{freshnessLabel}</span>
        </>
      }
    >
      <div className="alert-tabs">
        <button
          data-severity="critical"
          className={`alert-tab ${tab === 'red' ? 'alert-tab--active' : ''}`}
          onClick={() => setTab('red')}
          aria-pressed={tab === 'red'}
        >
          Red <span className="tab-count">[{redCount}]</span>
        </button>
        <button
          data-severity="high"
          className={`alert-tab ${tab === 'orange' ? 'alert-tab--active' : ''}`}
          onClick={() => setTab('orange')}
          aria-pressed={tab === 'orange'}
        >
          Orange <span className="tab-count">[{orangeCount}]</span>
        </button>
        <button
          data-severity="moderate"
          className={`alert-tab ${tab === 'yellow' ? 'alert-tab--active' : ''}`}
          onClick={() => setTab('yellow')}
          aria-pressed={tab === 'yellow'}
        >
          Yellow <span className="tab-count">[{yellowCount}]</span>
        </button>
      </div>
      <div className="alerts">
        {filteredAlerts.map((alert) => {
          const incident = incidents.find(inc => inc.id === alert.incidentId)
          return (
            <div
              className={`alert ${alert.sev}`}
              key={`${alert.incidentId}-${alert.time}-${alert.event}`}
              onClick={() => onAlertClick(alert.incidentId)}
              style={{ cursor: 'pointer' }}
            >
              <div className="alert-line">
                <span className={`severity-tag ${alert.sev}`}>{alert.sev}</span>
                <time>{formatTimestamp(alert.time)}</time>
              </div>
              <h3>
                {alert.event} <small>· {alert.place}</small>
              </h3>
              <p>{alert.text}</p>
              <div className="alert-foot">
                <span>
                  <Bot size={12} /> AI confidence <b>{alert.confidence}</b>
                </span>
              </div>
              <small className="source-note">Evidence: {alert.source}</small>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
