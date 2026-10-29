'use client'

import { useState, useMemo } from 'react'
import { Bot } from 'lucide-react'
import Panel from './Panel'
import { Bars, Donut } from './Charts'
import SystemHealth from './SystemHealth'
import type { PublicReport } from '@/lib/types'
import { useSharedFilters } from './FilterContext'

type Range = '1H' | '6H' | '24H' | '7D' | '30D' | '1Y'
const RANGES: Range[] = ['1H', '6H', '24H', '7D', '30D', '1Y']

/** Top-N counts of a list of labels, as [label, count] pairs. */
function countBy(labels: string[], top = 5): [string, number][] {
  const counts = new Map<string, number>()
  for (const l of labels) if (l) counts.set(l, (counts.get(l) ?? 0) + 1)
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, top)
}

export default function AnalysisView() {
  const { filteredReports, filteredIncidents, latestReportAt } = useSharedFilters()
  const [range, setRange] = useState<Range>('24H')

  const IST = 'Asia/Kolkata'
  // Charts end at the newest report in the dataset (the data is a recorded sample, not live).
  const now = useMemo(() => (latestReportAt ? new Date(latestReportAt) : new Date()), [latestReportAt])

  const windowStart = useMemo(() => {
    const d = new Date(now)
    switch (range) {
      case '1H': d.setHours(d.getHours() - 1); return d
      case '6H': d.setHours(d.getHours() - 6); return d
      case '24H': d.setDate(d.getDate() - 1); return d
      case '7D': d.setDate(d.getDate() - 7); return d
      case '30D': d.setDate(d.getDate() - 30); return d
      case '1Y': d.setFullYear(d.getFullYear() - 1); return d
    }
  }, [range, now])

  const bucketConfig = useMemo(() => {
    switch (range) {
      case '1H': return { count: 6, interval: 10 * 60 * 1000, fmt: { hour: 'numeric', minute: '2-digit', hour12: false } as Intl.DateTimeFormatOptions }
      case '6H': return { count: 6, interval: 60 * 60 * 1000, fmt: { hour: 'numeric', hour12: false } as Intl.DateTimeFormatOptions }
      case '24H': return { count: 12, interval: 2 * 60 * 60 * 1000, fmt: { hour: 'numeric', hour12: false } as Intl.DateTimeFormatOptions }
      case '7D': return { count: 7, interval: 24 * 60 * 60 * 1000, fmt: { weekday: 'short' } as Intl.DateTimeFormatOptions }
      case '30D': return { count: 30, interval: 24 * 60 * 60 * 1000, fmt: { day: 'numeric' } as Intl.DateTimeFormatOptions }
      case '1Y': return { count: 12, interval: 30 * 24 * 60 * 60 * 1000, fmt: { month: 'short' } as Intl.DateTimeFormatOptions }
    }
  }, [range])

  const timeSeriesData = useMemo(() => {
    const { count: bucketCount, interval } = bucketConfig
    const data = Array.from({ length: bucketCount }, () => ({ count: 0 }))
    for (const report of filteredReports) {
      if (typeof report.postedAt !== 'string') continue
      const posted = new Date(report.postedAt)
      if (isNaN(posted.getTime())) continue
      if (posted < windowStart || posted > now) continue
      const idx = Math.floor((posted.getTime() - windowStart.getTime()) / interval)
      if (idx >= 0 && idx < bucketCount) {
        data[idx].count++
      }
    }
    return data
  }, [filteredReports, windowStart, now, bucketConfig])

  const incidentTypeDistribution = useMemo(() => {
    const counts = new Map<string, number>()
    for (const inc of filteredIncidents) {
      const event = inc.event.trim()
      if (!event) continue
      counts.set(event, (counts.get(event) || 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [filteredIncidents])

  const stateDistribution = useMemo(() => {
    const counts = new Map<string, number>()
    for (const inc of filteredIncidents) {
      const state = inc.state.trim()
      if (!state) continue
      counts.set(state, (counts.get(state) || 0) + 1)
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [filteredIncidents])

  const xLabels = useMemo(() => {
    const { count: bucketCount, interval } = bucketConfig
    return Array.from({ length: bucketCount }, (_, i) => {
      const t = new Date(windowStart.getTime() + i * interval)
      return t.toLocaleString('en-IN', { timeZone: IST, ...bucketConfig.fmt })
    })
  }, [windowStart, bucketConfig])

  const maxCount = Math.max(1, ...timeSeriesData.map(d => d.count))
  const totalReports = timeSeriesData.reduce((s, d) => s + d.count, 0)

  const reportsBySource = useMemo(() => countBy(filteredReports.map(r => r.source), 8), [filteredReports])
  const reportsByHazard = useMemo(() => countBy(filteredReports.map(r => r.disasterTypeClaimed ?? ''), 5), [filteredReports])
  const topIncidents = useMemo(() => [...filteredIncidents].sort((a, b) => b.confidence - a.confidence || b.reports - a.reports).slice(0, 3), [filteredIncidents])

  const summary = useMemo(() => {
    const n = filteredIncidents.length
    const verified = filteredIncidents.filter(i => i.status === 'Verified').length
    const avgConfidence = n ? Math.round(filteredIncidents.reduce((s, i) => s + i.confidence, 0) / n) : 0
    const scored = filteredReports.filter(r => typeof r.credibilityScore === 'number')
    const reliability = scored.length ? (scored.reduce((s, r) => s + (r.credibilityScore ?? 0), 0) / scored.length) * 100 : 0
    return {
      incidents: n,
      reports: filteredReports.length,
      critical: filteredIncidents.filter(i => i.severity === 'critical').length,
      verifiedPct: n ? Math.round((verified / n) * 100) : 0,
      avgConfidence,
      reliability,
      platforms: new Set(filteredReports.map(r => r.source)).size,
      level: avgConfidence >= 75 ? 'High' : avgConfidence >= 50 ? 'Medium' : 'Low',
    }
  }, [filteredIncidents, filteredReports])

  return (
    <div>
      <div className="section-head">
        <div>
          <span className="eyebrow">ANALYTICS LAYER</span>
          <h2>Incident activity &amp; distribution</h2>
        </div>
      </div>

      <div className="analytics-grid">
        {totalReports > 0 ? (
          <Panel title="Reports over time" className="trend-panel" action={
            <div className="range-tabs">
              {RANGES.map((x) => (
                <button
                  className={range === x ? 'active' : ''}
                  key={x}
                  onClick={() => setRange(x)}
                >
                  {x}
                </button>
              ))}
            </div>
          }>
            <p className="caption">District filtering for public reports uses reported locality and may not exactly match official district boundaries.</p>
            <div className="line-chart">
              <div className="y-axis">
                <span>{maxCount}</span>
                <span>{Math.ceil(maxCount / 2)}</span>
                <span>{Math.ceil(maxCount / 4)}</span>
                <span>0</span>
              </div>
              <svg viewBox={`0 0 ${60 + xLabels.length * 48} 210`} preserveAspectRatio="none" role="img" aria-label="Incident reports trend chart">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#35d5e8" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#35d5e8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  className="area"
                  d={[
                    `M60 210`,
                    ...timeSeriesData.map((d, i) => {
                      const x = 60 + i * 48;
                      const y = 210 - (d.count / maxCount) * 160;
                      return `L${x} ${y}`;
                    }),
                    `L${60 + (timeSeriesData.length - 1) * 48} 210`,
                    `L60 210Z`,
                  ].join(' ')}
                />
                <path
                  className="line"
                  d={[
                    `M60 ${210 - (timeSeriesData[0].count / maxCount) * 160}`,
                    ...timeSeriesData.map((d, i) => {
                      const x = 60 + i * 48;
                      const y = 210 - (d.count / maxCount) * 160;
                      return `L${x} ${y}`;
                    }),
                  ].join(' ')}
                  fill="none"
                  stroke="var(--cyan)"
                  strokeWidth="2"
                />
              </svg>
              <div className="x-axis">
                {xLabels.map((label, i) => (
                  <span key={i}>{label}</span>
                ))}
              </div>
            </div>
          </Panel>
        ) : (
          <Panel title="Reports over time" className="trend-panel" action={
            <div className="range-tabs">
              {RANGES.map((x) => (
                <button
                  className={range === x ? 'active' : ''}
                  key={x}
                  onClick={() => setRange(x)}
                >
                  {x}
                </button>
              ))}
            </div>
          }>
            <div className="line-chart">
              <div className="y-axis">
                <span>0</span>
                <span>0</span>
                <span>0</span>
                <span>0</span>
              </div>
              <svg viewBox="0 0 700 210" preserveAspectRatio="none" role="img" aria-label="Incident reports trend chart">
                <path className="area" d="M0 210 L700 210 L700 210 L0 210Z" fill="var(--cyan)" opacity="0.15" />
                <path className="line" d="M0 210 L700 210" fill="none" stroke="var(--cyan)" strokeWidth="2" />
              </svg>
              <div className="x-axis">
                {xLabels.map((label, i) => (
                  <span key={i}>{label}</span>
                ))}
              </div>
            </div>
            <p className="caption">No reports in this period.</p>
          </Panel>
        )}

<Panel title="Incidents by type" eyebrow="TOP 8 · BAR CHART">
          {incidentTypeDistribution.length > 0 ? (
            <Bars data={incidentTypeDistribution} color="cyan" />
          ) : (
            <p className="caption">No incidents match the selected filters.</p>
          )}
        </Panel>

        <Panel title="Reports by source" eyebrow="INGESTION MIX">
          {reportsBySource.length > 0 ? (
            <Donut data={reportsBySource} />
          ) : (
            <p className="caption">No reports match the selected filters.</p>
          )}
        </Panel>
<Panel title="Incidents by state" eyebrow="TOP 5 · ACTIVE INCIDENTS">

          {stateDistribution.length > 0 ? (
            <Bars data={stateDistribution} color="blue" />
          ) : (
            <p className="caption">No incidents match the selected filters.</p>
          )}
        </Panel>
<Panel title="AI risk intelligence" eyebrow="MODEL STATUS · EVENT CLASSIFICATION">

          
          <div className="ai-list">
            {topIncidents.length === 0 && <p className="caption">No incidents match the selected filters.</p>}
            {topIncidents.map((inc) => (
              <div className="ai-row" key={inc.id}>
                <div className="ai-icon">
                  <Bot size={14} />
                </div>
                <div className="ai-info">
                  <div className="ai-event">{inc.event}</div>
                  <div className="ai-location">{inc.place}</div>
                </div>
                <div className="ai-severity">{inc.severity.toUpperCase()}</div>
                <div className="ai-reports">{inc.reports} reports</div>
                <div className="ai-confidence">{inc.confidence}%</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="AI classification distribution" eyebrow="DETECTED EVENTS">
          <div className="classification-bars">
            {reportsByHazard.length > 0 ? (
              <Bars data={reportsByHazard} color="purple" />
            ) : (
              <p className="caption">No reports match the selected filters.</p>
            )}
          </div>
        </Panel>

        {summary.incidents > 0 && (
          <Panel title="Data reliability & source consensus" eyebrow="EVIDENCE LAYER">
            <div className="consensus-detail">
              <div className="consensus-row">
                <span className="eyebrow">VERIFIED AGAINST IMD</span>
                <div className="consensus-track">
                  <i style={{ width: `${summary.verifiedPct}%` }} />
                </div>
                <b>{summary.verifiedPct}% of incidents</b>
              </div>
              <div className="consensus-row">
                <span className="eyebrow">REPORT PLATFORMS</span>
                <b>{summary.platforms} active</b>
              </div>
              <div className="consensus-row">
                <span className="eyebrow">CONSENSUS LEVEL</span>
                <b className="green">{summary.level}</b>
              </div>
              <div className="consensus-row">
                <span className="eyebrow">RELIABILITY INDEX</span>
                <b>{summary.reliability.toFixed(1)} / 100</b>
              </div>
              <div className="consensus-note">
                <p>
                  Verification compares public reports with IMD bulletins for the same state and hazard.
                  The reliability index is the mean credibility score of the reports in view. AI confidence
                  measures model certainty in classification. These are distinct metrics and should not
                  be conflated.
                </p>
              </div>
            </div>
          </Panel>
        )}

        <Panel title="Dataset summary" eyebrow="PIPELINE OUTPUT">
          <div className="trend-comparison">
            <div className="trend-stat">
              <b className="cyan">{summary.incidents}</b>
              <small>INCIDENTS</small>
            </div>
            <div className="trend-stat">
              <b>{summary.reports.toLocaleString()}</b>
              <small>PUBLIC REPORTS</small>
            </div>
            <div className="trend-stat">
              <b className="red">{summary.critical}</b>
              <small>CRITICAL EVENTS</small>
            </div>
            <div className="trend-stat">
              <b className="green">{summary.avgConfidence}%</b>
              <small>AVG CONFIDENCE</small>
            </div>
          </div>
        </Panel>
      </div>

      <SystemHealth />

      <footer>
        <span>INDRA prototype · synthetic data from the weather_platform_v2 pipeline</span>
        <span>
          India&apos;s National Disaster &amp; Risk Analytics <b>▲</b>
        </span>
      </footer>
    </div>
  )
}

