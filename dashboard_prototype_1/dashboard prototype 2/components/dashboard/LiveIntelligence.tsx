'use client'

import { useState, useCallback } from 'react'
import type { Incident } from '@/lib/types'
import { type FreshnessState } from '@/lib/utils'
import IntelligenceMap from './IntelligenceMap'
import type { FilterState } from './FilterToolbar'
import SelectedIncidentReport from './SelectedIncidentReport'
import Panel from './Panel'

export default function LiveIntelligence({
  incidents,
  filters,
  selectedId,
  onSelect,
  freshness,
}: {
  incidents: Incident[]
  filters: FilterState
  selectedId: number | null
  onSelect: (id: number) => void
  freshness: FreshnessState
}) {
  const [navKey, setNavKey] = useState(0)

  const handleSelect = useCallback((id: number) => {
    if (id !== 0) {
      const inc = incidents.find(i => i.id === id)
      if (inc) {
        setNavKey(k => k + 1)
      }
    }
    onSelect(id)
  }, [incidents, onSelect])

  const selected = incidents.find(i => i.id === selectedId) ?? null

  const freshnessLabel = freshness === 'updating' ? 'UPDATING' : freshness === 'fresh' ? 'FRESH' : 'STALE';

  return (
    <div className="live-intelligence">
      <Panel
        title="Live incident intelligence map"
        eyebrow="GEOMAP · INDIA / REAL-TIME"
        className="map-panel"
        action={<span className={`freshness-badge freshness-${freshness}`}>{freshnessLabel}</span>}
      >
        <IntelligenceMap
          incidents={incidents}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </Panel>
      <Panel
        title="Selected incident report"
        eyebrow="INCIDENT DETAIL"
        className="report-panel"
        action={
          selected ? (
            <span className={`severity-tag ${selected.severity}`}>
              {selected.severity.toUpperCase()}
            </span>
          ) : undefined
        }
      >
        <SelectedIncidentReport
          incident={selected}
          filteredIncidents={incidents}
          filters={filters}
          navKey={navKey}
          onClose={() => onSelect(0)}
          onSelect={handleSelect}
        />
      </Panel>
    </div>
  )
}
