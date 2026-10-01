'use client'

import { useState } from 'react'
import Topbar from '@/components/dashboard/Topbar'
import FilterToolbar, { useFilters } from '@/components/dashboard/FilterToolbar'
import KPISection from '@/components/dashboard/KPISection'
import LiveIntelligence from '@/components/dashboard/LiveIntelligence'
import AlertSystem from '@/components/dashboard/AlertSystem'
import { alerts, incidents as allIncidents } from '@/lib/data'

export default function HomePage() {
  const { filters, setFilter, reset, filteredIncidents } = useFilters()
  const [selectedId, setSelectedId] = useState<number | null>(2)
  const [ack, setAck] = useState<number[]>([])

  const handleAlertClick = (incidentId: number) => {
    setSelectedId(incidentId)
  }

  const handleAck = (index: number) => {
    setAck(prev => (prev.includes(index) ? prev : [...prev, index]))
  }

  return (
    <main className="dashboard">
      <Topbar />
      <FilterToolbar filters={filters} setFilter={setFilter} reset={reset} />
      <KPISection />
      <LiveIntelligence
        incidents={filteredIncidents}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <AlertSystem
        alerts={alerts}
        incidents={allIncidents}
        onAlertClick={handleAlertClick}
        acknowledged={ack}
        onAck={handleAck}
      />
      <footer>
        <span>INDRA prototype · PostgreSQL data layer · v3.0.0</span>
        <span>
          India&apos;s National Disaster &amp; Risk Analytics <b>◆</b>
        </span>
      </footer>
    </main>
  )
}
