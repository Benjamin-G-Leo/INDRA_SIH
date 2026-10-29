import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useFilters } from './FilterToolbar'
import { adaptIncidentToDashboard } from '@/lib/data-source'
import type { Incident, Severity, LifecycleStage } from '@/lib/types'
import prototypeFixture from '@/test-data/indra-prototype.json'

function buildTestIdMap(canonicalIds: string[]): Map<string, number> {
  const map = new Map()
  let nextId = 1
  const sorted = [...canonicalIds].sort((a, b) => a.localeCompare(b))
  for (const id of sorted) {
    map.set(id, nextId++)
  }
  return map
}

const idMap = buildTestIdMap(
  prototypeFixture.incidents.map(i => i.incidentId)
)
const testIncidents: Incident[] = prototypeFixture.incidents.map(inc =>
  adaptIncidentToDashboard({
    ...inc,
    severity: inc.severity as Severity,
    status: inc.status as LifecycleStage,
  }, idMap)
)

describe('useFilters', () => {
  it('returns all incidents when no filters applied', () => {
    const { result } = renderHook(() => useFilters(testIncidents))
    expect(result.current.filteredIncidents).toHaveLength(testIncidents.length)
    expect(result.current.filteredIncidents.map(i => i.id)).toEqual(
      expect.arrayContaining(testIncidents.map(i => i.id))
    )
    expect(result.current.filters).toEqual({
      state: 'all',
      district: 'all',
      eventType: 'all',
      severity: 'all',
    })
  })

  it('filters by state', () => {
    const { result } = renderHook(() => useFilters(testIncidents))
    act(() => {
      result.current.setFilter('state', 'Uttar Pradesh')
    })
    const filtered = result.current.filteredIncidents
    expect(filtered.every(i => i.state.trim().toUpperCase() === 'UTTAR PRADESH')).toBe(true)
    expect(filtered.length).toBeLessThan(testIncidents.length)
    const upIncidents = testIncidents.filter(
      i => i.state.trim().toUpperCase() === 'UTTAR PRADESH'
    )
    expect(filtered).toHaveLength(upIncidents.length)
    expect(filtered.some(i => i.state.toLowerCase() === 'uttar pradesh')).toBe(true)
  })

  it('filters by severity', () => {
    const { result } = renderHook(() => useFilters(testIncidents))
    act(() => {
      result.current.setFilter('severity', 'moderate')
    })
    const filtered = result.current.filteredIncidents
    expect(filtered.every(i => i.severity === 'moderate')).toBe(true)
    expect(filtered.length).toBeLessThan(testIncidents.length)
    const moderateIncidents = testIncidents.filter(i => i.severity === 'moderate')
    expect(filtered).toHaveLength(moderateIncidents.length)
    if (moderateIncidents.some(i => i.event === 'Cold Wave')) {
      expect(filtered.some(i => i.event === 'Cold Wave')).toBe(true)
    }
  })

  it('filters by event type', () => {
    const { result } = renderHook(() => useFilters(testIncidents))
    act(() => {
      result.current.setFilter('eventType', 'Cold Wave')
    })
    const filtered = result.current.filteredIncidents
    expect(filtered.every(i => i.event === 'Cold Wave')).toBe(true)
    expect(filtered.length).toBeLessThan(testIncidents.length)
    const eventIncidents = testIncidents.filter(i => i.event === 'Cold Wave')
    expect(filtered).toHaveLength(eventIncidents.length)
    if (eventIncidents.length > 0) {
      expect(filtered.length).toBeGreaterThan(0)
    }
  })

  it('resets filters to all incidents', () => {
    const { result } = renderHook(() => useFilters(testIncidents))
    act(() => {
      result.current.setFilter('severity', 'moderate')
    })
    expect(result.current.filteredIncidents.length).toBeLessThan(testIncidents.length)
    act(() => {
      result.current.reset()
    })
    expect(result.current.filters).toEqual({
      state: 'all',
      district: 'all',
      eventType: 'all',
      severity: 'all',
    })
    expect(result.current.filteredIncidents).toHaveLength(testIncidents.length)
    expect(result.current.filteredIncidents.map(i => i.id)).toEqual(
      expect.arrayContaining(testIncidents.map(i => i.id))
    )
  })

  it('filtering by district works', () => {
    const { result } = renderHook(() => useFilters(testIncidents))
    act(() => {
      result.current.setFilter('district', 'Gomti Nagar')
    })
    const filtered = result.current.filteredIncidents
    expect(filtered.every(i => i.district.trim().toUpperCase() === 'GOMTI NAGAR')).toBe(true)
    expect(filtered.length).toBeLessThan(testIncidents.length)
    const districtIncidents = testIncidents.filter(
      i => i.district.trim().toUpperCase() === 'GOMTI NAGAR'
    )
    expect(filtered).toHaveLength(districtIncidents.length)
    if (filtered.length > 0) {
      expect(filtered.every(i => i.state.trim().toUpperCase() === 'UTTAR PRADESH')).toBe(true)
    }
  })
})

