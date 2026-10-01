'use client'

import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { filterOptions, incidents } from '@/lib/data'
import type { Incident, Severity } from '@/lib/types'

export interface FilterState {
  state: string
  district: string
  eventType: string
  severity: string
  dataSource: string
}

const defaultFilters: FilterState = {
  state: 'All India',
  district: 'All districts',
  eventType: 'All events',
  severity: 'All severities',
  dataSource: 'All sources',
}

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  const setFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const reset = () => setFilters(defaultFilters)

  const filteredIncidents: Incident[] = incidents.filter(inc => {
    if (filters.state !== 'All India' && inc.state !== filters.state) return false
    if (filters.eventType !== 'All events' && inc.event !== filters.eventType) return false
    if (filters.severity !== 'All severities' && inc.severity !== (filters.severity as Severity)) return false
    if (filters.dataSource !== 'All sources' && inc.source !== filters.dataSource) return false
    return true
  })

  return { filters, setFilter, reset, filteredIncidents }
}

export default function FilterToolbar({
  filters,
  setFilter,
  reset,
}: {
  filters: FilterState
  setFilter: (key: keyof FilterState, value: string) => void
  reset: () => void
}) {
  const fields: { key: keyof FilterState; label: string; options: string[] }[] = [
    { key: 'state', label: 'State', options: filterOptions.state },
    { key: 'district', label: 'District', options: filterOptions.district },
    { key: 'eventType', label: 'Event type', options: filterOptions.eventType },
    { key: 'severity', label: 'Severity', options: filterOptions.severity },
    { key: 'dataSource', label: 'Data source', options: filterOptions.dataSource },
  ]

  return (
    <div className="toolbar">
      <div className="toolbar-title">
        <SlidersHorizontal size={15} /> DASHBOARD VARIABLES
      </div>
      {fields.map(field => (
        <label key={field.key}>
          {field.label}
          <select
            value={filters[field.key]}
            onChange={e => setFilter(field.key, e.target.value)}
          >
            {field.options.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button className="reset" onClick={reset}>
        <RotateCcw size={13} /> Reset filters
      </button>
    </div>
  )
}
