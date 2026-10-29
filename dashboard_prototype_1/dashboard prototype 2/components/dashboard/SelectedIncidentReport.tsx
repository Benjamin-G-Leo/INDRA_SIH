'use client'


import { useState, useEffect } from 'react'
import type { Incident } from '@/lib/types'
import type { FilterState } from './FilterToolbar'

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'var(--critical)',
  high: 'var(--high)',
  moderate: 'var(--moderate)',
  low: 'var(--low)',
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  moderate: 2,
  low: 3,
}

type SeverityLevel = 'critical' | 'high' | 'moderate' | 'low'

export default function SelectedIncidentReport({
  incident,
  filteredIncidents,
  filters,
  navKey,
  onClose,
  onSelect,
}: {
  incident: Incident | null
  filteredIncidents: Incident[]
  filters: FilterState
  navKey: number
  onClose: () => void
  onSelect: (id: number) => void
}) {
  

  const [selectedState, setSelectedState] = useState<string | null>(
    filters.state !== 'all' ? filters.state : null
  )
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(
    filters.district !== 'all' ? filters.district : null
  )

  // Filter-change resilience: reset navigation if selected state/district no longer has matches
  useEffect(() => {
    if (selectedState) {
      const stateMatches = filteredIncidents.some(inc => inc.state === selectedState)
      if (!stateMatches) {
        setSelectedState(null)
        setSelectedDistrict(null)
        return
      }
    }
    if (selectedDistrict) {
      const districtMatches = filteredIncidents.some(
        inc => inc.state === selectedState && inc.district === selectedDistrict
      )
      if (!districtMatches) setSelectedDistrict(null)
    }
  }, [filteredIncidents, selectedState, selectedDistrict])

  // Fix 1: Sync navigation with the top filter toolbar
  useEffect(() => {
    if (filters.state !== 'all') {
      setSelectedState(filters.state)
      setSelectedDistrict(
        filters.district !== 'all' ? filters.district : null
      )
    } else {
      setSelectedState(null)
      setSelectedDistrict(null)
    }
  }, [filters.state, filters.district])

  // Fix 3: Sync navigation with a map-marker selection (also handles repeated clicks via navKey)
  useEffect(() => {
    if (incident) {
      setSelectedState(incident.state)
      setSelectedDistrict(incident.district)
    }
  }, [incident?.id, navKey])

  // Level 1: Group filtered incidents by state
  const stateGroups = filteredIncidents.reduce((acc, inc) => {
    const key = inc.state || 'Unknown'
    if (!acc[key]) acc[key] = { state: key, count: 0, maxSeverity: 'low' as SeverityLevel }
    acc[key].count++
    if (SEVERITY_RANK[inc.severity] < SEVERITY_RANK[acc[key].maxSeverity]) {
      acc[key].maxSeverity = inc.severity as SeverityLevel
    }
    return acc
  }, {} as Record<string, { state: string; count: number; maxSeverity: SeverityLevel }>)

  const states = Object.values(stateGroups).sort((a, b) => {
    if (SEVERITY_RANK[a.maxSeverity] !== SEVERITY_RANK[b.maxSeverity]) {
      return SEVERITY_RANK[a.maxSeverity] - SEVERITY_RANK[b.maxSeverity]
    }
    if (b.count !== a.count) return b.count - a.count
    return a.state.localeCompare(b.state)
  })

  // Level 2: Group by district within selected state
  const stateFilteredIncidents = selectedState
    ? filteredIncidents.filter(inc => inc.state === selectedState)
    : filteredIncidents

  const districtGroups = stateFilteredIncidents.reduce((acc, inc) => {
    const key = inc.district || 'Unknown'
    if (!acc[key]) acc[key] = { district: key, count: 0, maxSeverity: 'low' as SeverityLevel }
    acc[key].count++
    if (SEVERITY_RANK[inc.severity] < SEVERITY_RANK[acc[key].maxSeverity]) {
      acc[key].maxSeverity = inc.severity as SeverityLevel
    }
    return acc
  }, {} as Record<string, { district: string; count: number; maxSeverity: SeverityLevel }>)

  const districts = Object.values(districtGroups).sort((a, b) => {
    if (SEVERITY_RANK[a.maxSeverity] !== SEVERITY_RANK[b.maxSeverity]) {
      return SEVERITY_RANK[a.maxSeverity] - SEVERITY_RANK[b.maxSeverity]
    }
    if (b.count !== a.count) return b.count - a.count
    return a.district.localeCompare(b.district)
  })

  // Level 3: Filter by state + district
  const areaIncidents = filteredIncidents.filter(inc => {
    if (selectedState && inc.state !== selectedState) return false
    if (selectedDistrict && inc.district !== selectedDistrict) return false
    return true
  }).sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])

  return (
    <div className="incident-report">
      {/* Level 1: State list */}
      {!selectedState && (
        <div className="district-overview">
          <span className="eyebrow">STATES</span>
          {states.length > 0 ? (
            states.map(s => (
              <div
                key={s.state}
                className="district-item"
                onClick={() => setSelectedState(s.state)}
              >
                <span>{s.state}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <b>{s.count}</b>
                  <span
                    style={{ color: SEVERITY_COLORS[s.maxSeverity], fontSize: '13px', fontWeight: 600 }}
                  >
                    {s.maxSeverity}
                  </span>
                </span>
              </div>
            ))
          ) : (
            <div className="report-empty">
              <h3 className="report-empty-title">No incident reports available</h3>
              <p className="report-empty-text">
                No incident reports are currently available under the selected filters.
                Try selecting another location or adjusting your filters.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Level 2: District list */}
      {selectedState && !selectedDistrict && (
        <div className="district-overview">
          <div className="nav-row">
            <button
              className="back-button"
              onClick={() => setSelectedState(null)}
              aria-label="Back to states"
            >
              ← Back to states
            </button>
            <span className="eyebrow">{selectedState}</span>
          </div>
          {districts.length > 0 ? (
            districts.map(d => (
              <div
                key={d.district}
                className="district-item"
                onClick={() => setSelectedDistrict(d.district)}
              >
                <span>{d.district}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <b>{d.count}</b>
                  <span
                    style={{ color: SEVERITY_COLORS[d.maxSeverity], fontSize: '13px', fontWeight: 600 }}
                  >
                    {d.maxSeverity}
                  </span>
                </span>
              </div>
            ))
          ) : (
            <div className="report-empty">
              <h3 className="report-empty-title">No incident reports available</h3>
              <p className="report-empty-text">
                No incident reports are currently available for {selectedState} under the selected filters.
                Try selecting another state or adjusting your filters.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Level 3: Report cards */}
      {selectedDistrict && (
        <div className="report-list">
          <div className="nav-row">
            <button
              className="back-button"
              onClick={() => setSelectedDistrict(null)}
              aria-label="Back to districts"
            >
              ← Back to districts
            </button>
            <span className="eyebrow">{selectedDistrict}</span>
          </div>
          {areaIncidents.length > 0 ? (
            areaIncidents.map(inc => (
              <div
                key={inc.id}
                className={`report-card ${incident?.id === inc.id ? 'selected' : ''}`}
                onClick={() => onSelect(inc.id)}
              >
                <div className="report-card-header">
                  <span className={`severity-tag ${inc.severity}`}>
                    {inc.severity.toUpperCase()}
                  </span>
                  <h3>{inc.event}</h3>
                  <p className="report-location">
                    {inc.place} · {inc.state}, {inc.district}
                  </p>
                </div>
                <div className="report-value">
                  <span className="eyebrow">CURRENT READING</span>
                  <b>{inc.value}</b>
                  <small>Source: {inc.source} · {inc.time}</small>
                </div>
                <div className="report-section compact">
                  <span className="eyebrow">AI INTELLIGENCE</span>
                  <div className="ai-metrics small">
                    <div className="ai-metric">
                      <b className="cyan">{inc.confidence}%</b>
                      <small>AI CONFIDENCE</small>
                    </div>
                    <div className="ai-metric">
                      <b>{inc.reports}</b>
                      <small>REPORTS ANALYZED</small>
                    </div>
                    <div className="ai-metric">
                      <b className="green">{inc.consensus}</b>
                      <small>SOURCE CONSENSUS</small>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="report-empty">
              <h3 className="report-empty-title">No incident reports available</h3>
              <p className="report-empty-text">
                No incident reports are currently available for {selectedDistrict} under the selected filters.
                Try selecting another location or adjusting your filters.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
