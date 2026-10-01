'use client'

import type { Incident } from '@/lib/types'
import IntelligenceMap from './IntelligenceMap'
import SelectedIncidentReport from './SelectedIncidentReport'
import Panel from './Panel'

export default function LiveIntelligence({
  incidents,
  selectedId,
  onSelect,
}: {
  incidents: Incident[]
  selectedId: number | null
  onSelect: (id: number) => void
}) {
  const selected = incidents.find(i => i.id === selectedId) ?? null

  return (
    <div className="live-intelligence">
      <Panel
        title="Live incident intelligence map"
        eyebrow="GEOMAP · INDIA / REAL-TIME"
        className="map-panel"
      >
        <IntelligenceMap
          incidents={incidents}
          selectedId={selectedId}
          onSelect={onSelect}
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
          onClose={() => onSelect(0)}
        />
      </Panel>
    </div>
  )
}
