'use client'

import { Bot, X } from 'lucide-react'
import type { Incident } from '@/lib/types'
import { lifecycle } from '@/lib/data'

export default function SelectedIncidentReport({
  incident,
  onClose,
}: {
  incident: Incident | null
  onClose: () => void
}) {
  if (!incident) {
    return (
      <div className="incident-report-empty">
        <div className="empty-state">
          <Bot size={32} />
          <p>Select an incident marker on the map to view its detailed report.</p>
        </div>
      </div>
    )
  }

  const currentIndex = lifecycle.indexOf(incident.status)

  return (
    <div className="incident-report">
      <div className="report-header">
        <div>
          <span className={`severity-tag ${incident.severity}`}>
            {incident.severity.toUpperCase()}
          </span>
          <h3>{incident.event}</h3>
          <p className="report-location">
            {incident.place} · {incident.state}, {incident.district}
          </p>
        </div>
        <button className="close-detail" onClick={onClose} aria-label="Close report">
          <X size={16} />
        </button>
      </div>

      <div className="report-value">
        <span className="eyebrow">CURRENT READING</span>
        <b>{incident.value}</b>
        <small>Source: {incident.source} · {incident.time}</small>
      </div>

      <div className="report-section">
        <span className="eyebrow">INCIDENT LIFECYCLE</span>
        <div className="lifecycle">
          {lifecycle.map((step, index) => (
            <button
              key={step}
              className={incident.status === step ? 'current' : currentIndex > index ? 'complete' : ''}
              disabled
            >
              <i>{index + 1}</i>
              <span>{step}</span>
            </button>
          ))}
        </div>
        <p className="lifecycle-note">
          Current state: <b>{incident.status}</b>
        </p>
      </div>

      <div className="report-section">
        <span className="eyebrow">AI INTELLIGENCE</span>
        <div className="ai-metrics">
          <div className="ai-metric">
            <b className="cyan">{incident.confidence}%</b>
            <small>AI CONFIDENCE</small>
          </div>
          <div className="ai-metric">
            <b>{incident.reports}</b>
            <small>REPORTS ANALYZED</small>
          </div>
          <div className="ai-metric">
            <b className="green">{incident.consensus}</b>
            <small>SOURCE CONSENSUS</small>
          </div>
          <div className="ai-metric">
            <b>{incident.independentSources}</b>
            <small>INDEPENDENT SOURCES</small>
          </div>
        </div>
        <div className="evidence-list">
          {incident.evidence.map(ev => (
            <span key={ev.name}>
              <i className={ev.status} /> {ev.name}
              {ev.status === 'pending' && ' · pending'}
            </span>
          ))}
        </div>
      </div>

      <div className="report-section">
        <span className="eyebrow">AREA AFFECTED</span>
        <div className="area-grid">
          <div className="area-item">
            <b>{incident.areaAffected.area}</b>
            <small>Geographic area</small>
          </div>
          <div className="area-item">
            <b>{incident.areaAffected.population}</b>
            <small>Population affected</small>
          </div>
          <div className="area-item">
            <b>{incident.areaAffected.hospitals}</b>
            <small>Hospitals affected</small>
          </div>
          <div className="area-item">
            <b>{incident.areaAffected.schools}</b>
            <small>Schools affected</small>
          </div>
          <div className="area-item">
            <b>{incident.areaAffected.roads}</b>
            <small>Major roads</small>
          </div>
          <div className="area-item">
            <b>{incident.areaAffected.infrastructure}</b>
            <small>Critical infrastructure</small>
          </div>
          <div className="area-item">
            <b>{incident.areaAffected.districts}</b>
            <small>Affected districts</small>
          </div>
        </div>
      </div>
    </div>
  )
}
