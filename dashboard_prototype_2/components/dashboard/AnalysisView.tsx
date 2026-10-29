'use client'

import { useState, useMemo } from 'react'
import { Bot } from 'lucide-react'
import Panel from './Panel'
import { Bars, Donut } from './Charts'
import SystemHealth from './SystemHealth'
import {
  sourcesData,
  aiClassificationData,
  aiRiskRows,
  incidents,
} from '@/lib/data'
import type { PublicReport } from '@/lib/types'
import { useSharedFilters } from './FilterContext'

export default function AnalysisView() {
  const { filteredReports, filteredIncidents } = useSharedFilters()
  const [range, setRange] = useState<'1H' | '6H' | '24H' | '7D'>('24H')

  const IST = 'Asia/Kolkata'
  const now = new Date()

  const windowStart = useMemo(() => {
    const d = new Date(now)
    switch (range) {
      case '1H': d.setHours(d.getHours() - 1); return d
      case '6H': d.setHours(d.getHours() - 6); return d
      case '24H': d.setDate(d.getDate() - 1); return d
      case '7D': d.setDate(d.getDate() - 7); return d
    }
  }, [range])

  const bucketConfig = useMemo(() => {
    switch (range) {
      case '1H': return { count: 6, interval: 10 * 60 * 1000, fmt: { hour: 'numeric', minute: '2-digit', hour12: false } as Intl.DateTimeFormatOptions }
      case '6H': return { count: 6, interval: 60 * 60 * 1000, fmt: { hour: 'numeric', hour12: false } as Intl.DateTimeFormatOptions }
      case '24H': return { count: 12, interval: 2 * 60 * 60 * 1000, fmt: { hour: 'numeric', hour12: false } as Intl.DateTimeFormatOptions }
      case '7D': return { count: 7, interval: 24 * 60 * 60 * 1000, fmt: { weekday: 'short' } as Intl.DateTimeFormatOptions }
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
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
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
      return t.toLocaleTimeString('en-IN', { timeZone: IST, ...bucketConfig.fmt })
    })
  }, [windowStart, bucketConfig])

  const maxCount = Math.max(1, ...timeSeriesData.map(d => d.count))
  const totalReports = timeSeriesData.reduce((s, d) => s + d.count, 0)

  const primaryIncident = incidents[0]

  return (
    <main className="dashboard">
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
              {(['1H', '6H', '24H', '7D'] as const).map((x) => (
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
            <div className="chart-legend">
              <span className="cyan">▲ Rainfall</span>
              <span className="blue">▲ Flood</span>
              <span className="orange">▲ Heatwave</span>
              <span className="red">▲ Cyclone</span>
            </div>
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
              {(['1H', '6H', '24H', '7D'] as const).map((x) => (
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
            <div className="chart-legend">
              <span className="cyan">▲ Rainfall</span>
              <span className="blue">▲ Flood</span>
              <span className="orange">▲ Heatwave</span>
              <span className="red">▲ Cyclone</span>
            </div>
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

<Panel title="Incidents by type" eyebrow="BAR CHART">
          {incidentTypeDistribution.length > 0 ? (
            <Bars data={incidentTypeDistribution} color="cyan" />
          ) : (
            <p className="caption">No incidents match the selected filters.</p>
          )}
        </Panel>

        <Panel title="Reports by source" eyebrow="INGESTION MIX">
          <Donut data={sourcesData} />
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
            {aiRiskRows.map((x) => (
              <div className="ai-row" key={x[1]}>
                <div className="ai-icon">
                  <Bot size={14} />
                </div>
                <div className="ai-info">
                  <div className="ai-event">{x[0]}</div>
                  <div className="ai-location">{x[1]}</div>
                </div>
                <div className="ai-severity">{x[2]}</div>
                <div className="ai-reports">{x[4]} reports</div>
                <div className="ai-confidence">{x[3]}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="AI classification distribution" eyebrow="DETECTED EVENTS">
          <div className="classification-bars">
            <Bars data={aiClassificationData as [string, number][]} color="purple" />
          </div>
        </Panel>

        {primaryIncident && (
          <Panel title="Data reliability & source consensus" eyebrow="EVIDENCE LAYER">
            <div className="consensus-detail">
              <div className="consensus-row">
                <span className="eyebrow">SOURCE AGREEMENT</span>
                <div className="consensus-track">
                  <i style={{ width: '84%' }} />
                </div>
                <b>84% agreement</b>
              </div>
              <div className="consensus-row">
                <span className="eyebrow">INDEPENDENT SOURCES</span>
                <b>{primaryIncident.independentSources} active</b>
              </div>
              <div className="consensus-row">
                <span className="eyebrow">CONSENSUS LEVEL</span>
                <b className="green">{primaryIncident.consensus}</b>
              </div>
              <div className="consensus-row">
                <span className="eyebrow">RELIABILITY INDEX</span>
                <b>92.4 / 100</b>
              </div>
              <div className="consensus-note">
                <p>
                  Source consensus measures agreement across independent data providers. AI confidence
                  measures model certainty in classification. These are distinct metrics and should not
                  be conflated.
                </p>
              </div>
            </div>
          </Panel>
        )}

        <Panel title="Historical trend analysis" eyebrow="7-DAY COMPARISON">
          <div className="trend-comparison">
            <div className="trend-stat">
              <b className="cyan">+12.8%</b>
              <small>WEEK-OVER-WEEK</small>
            </div>
            <div className="trend-stat">
              <b>128,450</b>
              <small>TOTAL REPORTS (7D)</small>
            </div>
            <div className="trend-stat">
              <b className="red">8</b>
              <small>CRITICAL EVENTS</small>
            </div>
            <div className="trend-stat">
              <b className="green">−18%</b>
              <small>RESPONSE TIME</small>
            </div>
          </div>
          <div className="line-chart small">
            <svg viewBox="0 0 700 140" preserveAspectRatio="none" role="img" aria-label="7-day trend comparison">
              <path
                className="area"
                d="M0 120 C60 110 80 80 140 95 S200 60 260 85 S320 50 380 70 S440 30 500 55 S560 20 620 40 L700 30 L700 140 L0 140Z"
              />
              <path className="line" d="M0 120 C60 110 80 80 140 95 S200 60 260 85 S320 50 380 70 S440 30 500 55 S560 20 620 40 L700 30" />
              <path className="line secondary" d="M0 130 C60 125 80 110 140 118 S200 95 260 108 S320 85 380 95 S440 75 500 88 S560 70 620 80 L700 75" />
            </svg>
          </div>
        </Panel>
      </div>

      <SystemHealth />

      <footer>
        <span>INDRA prototype · PostgreSQL data layer · v3.0.0</span>
        <span>
          India&apos;s National Disaster &amp; Risk Analytics <b>▲</b>
        </span>
      </footer>
    </main>
  )
}

