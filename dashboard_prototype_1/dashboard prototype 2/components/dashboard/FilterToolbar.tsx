'use client'

import { RotateCcw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { filterOptions } from '@/lib/data'
import adminReference from '@/data/administrative/india-district-reference.json'
import type { Incident, Severity } from '@/lib/types'
import SearchableSelect from './SearchableSelect'

const STATE_NAME_MAP: Record<string, string> = {
  'Andaman and Nicobar Islands': 'ANDAMAN & NICOBAR',
  'Dadra and Nagar Haveli and Daman and Diu': 'DADRA & NAGAR HAVELI',
  'Tamil Nadu': 'TAMILNADU',
}

type AdminState = { name: string; districts: string[] }
const adminStates: AdminState[] = (adminReference as { states: AdminState[] }).states

function findJsonState(stateValue: string): AdminState | null {
  if (stateValue === 'all') return null
  const target = STATE_NAME_MAP[stateValue] ?? stateValue.toUpperCase()
  return adminStates.find(s => s.name === target) ?? null
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b[a-z]/g, ch => ch.toUpperCase())
}

function getDistrictOptions(stateValue: string): string[] {
  if (stateValue === 'all') {
    const set = new Set<string>()
    for (const s of adminStates) {
      for (const d of s.districts) set.add(d)
    }
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }
  const entry = findJsonState(stateValue)
  if (!entry) return ['all']
  return ['all', ...entry.districts.slice().sort((a, b) => a.localeCompare(b))]
}

export interface FilterState {
  state: string
  district: string
  eventType: string
  severity: string
}

export const defaultFilters: FilterState = {
  state: 'all',
  district: 'all',
  eventType: 'all',
  severity: 'all',
}

export function useFilters(incidents: Incident[]) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)

  const setFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => {
      if (key === 'state') {
        return { ...prev, state: value, district: 'all' }
      }
      return { ...prev, [key]: value }
    })
  }

  const reset = () => setFilters(defaultFilters)

  const filteredIncidents: Incident[] = incidents.filter(inc => {
    // Case-insensitive state matching with 'all' sentinel
    const stateMatch = filters.state === 'all' || 
      inc.state.trim().toUpperCase() === filters.state.trim().toUpperCase()
    // Case-insensitive district matching with 'all' sentinel
    const districtMatch = filters.district === 'all' || 
      inc.district.trim().toUpperCase() === filters.district.trim().toUpperCase()
    // Exact event type match
    const eventMatch = filters.eventType === 'all' || inc.event === filters.eventType
    // Exact severity match
    const severityMatch = filters.severity === 'all' || inc.severity === filters.severity
    
    return stateMatch && districtMatch && eventMatch && severityMatch
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
  return (
    <div className="toolbar">
      <SearchableSelect
        label="State"
        value={filters.state}
        options={filterOptions.state}
        placeholder="All India"
        inputHint="Enter state name"
        onChange={val => setFilter('state', val)}
      />
      <SearchableSelect
        label="District"
        value={filters.district}
        options={getDistrictOptions(filters.state)}
        placeholder="All districts"
        inputHint="Enter district name"
        formatLabel={toTitleCase}
        onChange={val => setFilter('district', val)}
      />
      <SearchableSelect
        label="Event type"
        value={filters.eventType}
        options={filterOptions.eventType}
        placeholder="All events"
        inputHint="Enter event type"
        onChange={val => setFilter('eventType', val)}
      />
      <label>
        Severity
        <select
          value={filters.severity}
          onChange={e => setFilter('severity', e.target.value)}
        >
          {filterOptions.severity.map(opt => (
            <option key={opt} value={opt}>
              {opt === 'all' ? 'All severities' : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <button className="reset" onClick={reset}>
        <RotateCcw size={13} /> Reset filters
      </button>
    </div>
  )
}
