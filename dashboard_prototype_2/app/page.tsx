'use client'

import { useCallback, useEffect, useState } from 'react'
import Topbar from '@/components/dashboard/Topbar'
import FilterToolbar from '@/components/dashboard/FilterToolbar'
import { useSharedFilters } from '@/components/dashboard/FilterContext'
import KPISection from '@/components/dashboard/KPISection'
import LiveIntelligence from '@/components/dashboard/LiveIntelligence'
import AlertSystem from '@/components/dashboard/AlertSystem'
import { computeFreshness, type FreshnessState } from '@/lib/utils'

export default function HomePage() {
  const { filters, setFilter, reset, filteredIncidents, filteredAlerts, loading, error, refresh } = useSharedFilters()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [lastSync, setLastSync] = useState<Date | undefined>(undefined)

  // After hydration, establish a real lastSync timestamp
  useEffect(() => {
    setLastSync(new Date())
  }, [])
  const [syncing, setSyncing] = useState<boolean>(false)

  const freshness: FreshnessState = computeFreshness(lastSync, syncing)

  // 1-second IST clock
  useEffect(() => {
    setCurrentTime(new Date())
    const clock = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(clock)
  }, [])

  // Re-read the pipeline dataset (shared by auto-sync + manual refresh).
  const performSync = useCallback(async () => {
    setSyncing(true)
    await refresh()
    setLastSync(new Date())
    setSyncing(false)
  }, [refresh])

  // 10-second dashboard sync (re-reads the dataset file)
  useEffect(() => {
    const sync = setInterval(performSync, 10_000)
    return () => clearInterval(sync)
  }, [performSync])

  // Manual refresh via the Topbar refresh button
  const onRefresh = useCallback(() => performSync(), [performSync])

  const handleAlertClick = (incidentId: number) => {
    setSelectedId(incidentId)
  }

  // Loading state: show a minimal loading indicator; no silent fallback to legacy data.
  if (loading) {
    return (
      <main className="dashboard" id="main-content">
        <Topbar currentTime={currentTime} lastSync={lastSync} freshness={freshness} syncing={syncing} onRefresh={onRefresh} />
        <div className="loading">Loading incident data…</div>
      </main>
    )
  }

  // Error state: show error message; no silent fallback to legacy data.
  if (error) {
    return (
      <main className="dashboard" id="main-content">
        <Topbar currentTime={currentTime} lastSync={lastSync} freshness={freshness} syncing={syncing} onRefresh={onRefresh} />
        <div className="error">Failed to load incident data: {error.message}</div>
      </main>
    )
  }

  return (
    <main className="dashboard" id="main-content">
      <Topbar
        currentTime={currentTime}
        lastSync={lastSync}
        freshness={freshness}
        syncing={syncing}
        onRefresh={onRefresh}
      />
      <FilterToolbar filters={filters} setFilter={setFilter} reset={reset} />
      <LiveIntelligence
        incidents={filteredIncidents}
        filters={filters}
        selectedId={selectedId}
        freshness={freshness}
        onSelect={setSelectedId}
      />
      <KPISection incidents={filteredIncidents} />
      <AlertSystem
        alerts={filteredAlerts}
        incidents={filteredIncidents}
        freshness={freshness}
        onAlertClick={handleAlertClick}
      />
      <footer>
        <span>
          India&apos;s National Disaster &amp; Risk Analytics <b>◆</b>
        </span>
      </footer>
    </main>
  )
}
