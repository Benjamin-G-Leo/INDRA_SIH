'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { type FilterState } from './FilterToolbar'
import type { CanonicalIncident, SourceRecord, PublicReport } from '@/lib/types'
import { adaptIncidentToDashboard, adaptAlertToDashboard, loadRemoteDataset } from '@/lib/data-source'
import type { Incident, Alert } from '@/lib/types'

type FilterContextValue = {
  filters: FilterState
  setFilter: (key: keyof FilterState, value: string) => void
  reset: () => void
  filteredIncidents: Incident[]
  filteredAlerts: Alert[]
  filteredReports: PublicReport[]
  loading: boolean
  error: Error | null
  /** Dataset timestamp written by the pipeline (ISO), once loaded. */
  generatedAt: string | null
  /** Newest public-report timestamp in the whole dataset (ISO). The analysis charts end here, not at the wall clock. */
  latestReportAt: string | null
  /** Re-reads the dataset file without showing the loading screen. Resolves when done. */
  refresh: () => Promise<void>
}

const FilterContext = createContext<FilterContextValue | null>(null)

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilter, reset] = useFilterState()
  const [data, setData] = useState<{ incidents: Incident[]; alerts: Alert[]; sourceRecords: SourceRecord[] } | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const hasData = useRef(false)

  const load = useCallback(async () => {
    try {
      const dataset = await loadRemoteDataset()
      const idMap = buildIdMap(dataset.incidents)
      setData({
        incidents: dataset.incidents.map(inc => adaptIncidentToDashboard(inc, idMap)),
        alerts: dataset.alerts.map(alert => adaptAlertToDashboard(alert, idMap)),
        sourceRecords: dataset.sourceRecords,
      })
      setGeneratedAt(dataset.generatedAt)
      hasData.current = true
      setError(null)
    } catch (err) {
      // A failed background refresh keeps the data already on screen; only a failed first load is an error state.
      if (!hasData.current) setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const filteredIncidents = data
    ? data.incidents.filter(inc => matchesFilters(inc, filters))
    : []

  const filteredAlerts = data
    ? data.alerts.filter(alert => {
        const inc = data.incidents.find(i => i.id === alert.incidentId)
        return inc ? matchesFilters(inc, filters) : false
      })
    : []

  const filteredReports = data
    ? data.sourceRecords
        .filter((r): r is PublicReport =>
          r.kind === 'public' && typeof r.postedAt === 'string'
        )
        .filter(r => {
          if (filters.state !== 'all' && r.state.toUpperCase() !== filters.state.toUpperCase()) return false
          if (filters.district !== 'all' && r.locality?.toUpperCase() !== filters.district.toUpperCase()) return false
          return true
        })
    : []

  const latestReportAt = data
    ? data.sourceRecords.reduce<string | null>((m, r) => (r.kind === 'public' && (m === null || r.postedAt > m) ? r.postedAt : m), null)
    : null

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilter,
        reset,
        filteredIncidents,
        filteredAlerts,
        filteredReports,
        loading,
        error,
        generatedAt,
        latestReportAt,
        refresh: load,
      }}
    >
      {children}
    </FilterContext.Provider>
  )
}

function useFilterState() {
  const [filters, setFilters] = useState<FilterState>({
    state: 'all',
    district: 'all',
    eventType: 'all',
    severity: 'all',
  })

  const setFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => {
      if (key === 'state') {
        return { ...prev, state: value, district: 'all' }
      }
      return { ...prev, [key]: value }
    })
  }

  const reset = () => {
    setFilters({
      state: 'all',
      district: 'all',
      eventType: 'all',
      severity: 'all',
    })
  }

  return [filters, setFilter, reset] as const
}

function buildIdMap(incidents: CanonicalIncident[]): Map<string, number> {
  const map = new Map<string, number>()
  let nextId = 1
  const sorted = [...incidents].sort((a, b) => a.incidentId.localeCompare(b.incidentId))
  for (const inc of sorted) {
    map.set(inc.incidentId, nextId++)
  }
  return map
}

function matchesFilters(inc: Incident, filters: FilterState): boolean {
  const stateMatch =
    filters.state === 'all' ||
    inc.state.trim().toUpperCase() === filters.state.trim().toUpperCase()
  const districtMatch =
    filters.district === 'all' ||
    inc.district.trim().toUpperCase() === filters.district.trim().toUpperCase()
  const eventMatch =
    filters.eventType === 'all' || inc.event === filters.eventType
  const severityMatch =
    filters.severity === 'all' || inc.severity === filters.severity
  return stateMatch && districtMatch && eventMatch && severityMatch
}

export function useSharedFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) {
    throw new Error('useSharedFilters must be used within FilterProvider')
  }
  return ctx
}