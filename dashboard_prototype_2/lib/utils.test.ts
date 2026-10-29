import { describe, expect, it } from 'vitest'
import { computeFreshness, formatTimestamp } from '@/lib/utils'

describe('computeFreshness', () => {
  it('returns updating when syncing is true', () => {
    expect(computeFreshness(new Date(), true)).toBe('updating')
  })

  it('returns updating when lastSync is null', () => {
    expect(computeFreshness(null, false)).toBe('updating')
  })

  it('returns updating when lastSync is undefined', () => {
    expect(computeFreshness(undefined, false)).toBe('updating')
  })

  it('returns fresh when sync happened recently', () => {
    const now = new Date()
    expect(computeFreshness(now, false)).toBe('fresh')
  })

  it('returns stale when sync is older than threshold', () => {
    const oldDate = new Date(Date.now() - 120_000) // 2 minutes ago
    expect(computeFreshness(oldDate, false, 60_000)).toBe('stale')
  })

  it('uses custom stale threshold', () => {
    const recentDate = new Date(Date.now() - 30_000) // 30 seconds ago
    expect(computeFreshness(recentDate, false, 10_000)).toBe('stale')
    expect(computeFreshness(recentDate, false, 60_000)).toBe('fresh')
  })
})
describe('formatTimestamp', () => {
  it('formats an ISO timestamp in IST', () => {
    expect(formatTimestamp('2025-01-09T07:56:17Z')).toContain('IST')
    expect(formatTimestamp('2025-01-09T07:56:17Z')).toContain('13:26')
  })

  it('leaves non-date text unchanged', () => {
    expect(formatTimestamp('SYNTHETIC')).toBe('SYNTHETIC')
    expect(formatTimestamp('41 min ago')).toBe('41 min ago')
  })
})
