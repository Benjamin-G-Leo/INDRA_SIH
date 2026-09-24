'use client'

import { useState } from 'react'
import { Bot } from 'lucide-react'
import Panel from './Panel'
import { Bars, SectionHead } from './Charts'
import SystemHealth from './SystemHealth'
import {
  statesData,
  sourcesData,
  incidentTypeData,
  aiClassificationData,
  aiRiskRows,
  incidents,
  lifecycle,
} from '@/lib/data'

export default function AnalysisView() {
  const [range, setRange] = useState('24H')

  return (
    <main className="dashboard">
      <div className="section-head">
        <div>
          <span className="eyebrow">ANALYTICS LAYER</span>
          <h2>Incident activity &amp; distribution</h2>
        </div>
        <div className="range-tabs">
          {['1H', '6H', '24H', '7D'].map(x => (
            <button
              className={range === x ? 'active' : ''}
              key={x}
              onClick={() => setRange(x)}
            >
              {x}
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-grid">
        <Panel title="Reports over time" eyebrow={`TIME SERIES · LAST ${range}`} className="trend-panel">
          <div className="chart-legend">
            <span className="cyan">● Rainfall</span>
            <span className="blue">● Flood</span>
            <span className="orange">● Heatwave</span>
            <span className="red">● Cyclone</span>
          </div>
          <div className="line-chart">
            <div className="y-axis">
              <span>2k</span>
              <span>1k</span>
              <span>500</span>
              <span>0</span>
            </div>
            <svg viewBox="0 0 700 210" preserveAspectRatio="none" role="img" aria-label="Incident reports trend chart">
              <path
                className="area"
                d="M0 170 C45 165 48 120 94 145 S145 90 190 124 S245 75 290 115 S340 80 385 98 S440 40 480 82 S530 35 570 60 S625 20 700 36 L700 210 L0 210Z"
              />
              <path
                className="line"
                d="M0 170 C45 165 48 120 94 145 S145 90 190 124 S245 75 290 115 S340 80 385 98 S440 40 480 82 S530 35 570 60 S625 20 700 36"
              />
              <path
                className="line secondary"
                d="M0 190 C65 185 65 165 120 178 S180 140 230 167 S290 130 340 160 S410 120 460 142 S520 100 570 130 S640 95 700 112"
              />
            </svg>
            <div className="x-axis">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>NOW</span>
            </div>
          </div>
        </Panel>

        <Panel title="Incidents by type" eyebrow="BAR CHART · TOTAL 37">
          <Bars data={incidentTypeData as [string, number][]} color="cyan" />
        </Panel>

        <Panel title="Reports by source" eyebrow="INGESTION MIX">
          <div className="donut-wrap">
            <div className="donut">
              <span>
                128k<small>REPORTS</small>
              </span>
            </div>
            <div className="source-list">
              {sourcesData.map(([n, v], i) => (
                <div key={n}>
                  <i className={`source s${i}`} />
                  <span>{n}</span>
                  <b>{v}%</b>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="lower-grid">
        <Panel title="Incidents by state" eyebrow="TOP 5 · ACTIVE REPORTS">
          <Bars data={statesData as [string, number][]} color="blue" />
        </Panel>

        <Panel
          title="AI risk intelligence"
          eyebrow="CLASSIFICATION OUTPUT"
          action={
            <span className="ai-chip">
              <Bot size={13} /> MODEL ONLINE
            </span>
          }
        >
          <div className="ai-list">
            {aiRiskRows.map(x => (
              <div className="ai-row" key={x[1]}>
                <div className="ai-icon">
                  <Bot size={15} />
                </div>
                <div>
                  <b>
                    {x[0]} <small>· {x[1]}</small>
                  </b>
                  <p>
                    Severity: <strong>{x[2]}</strong> · {x[4]} reports analyzed
                  </p>
                </div>
                <span>
                  {x[3]}
                  <small>CONFIDENCE</small>
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="AI classification distribution" eyebrow="MODEL OUTPUT">
          <div className="classification">
            <span className="big-number">64</span>
            <small>DETECTED EVENTS</small>
            <div className="classification-bars">
              <Bars data={aiClassificationData as [string, number][]} color="purple" />
            </div>
          </div>
        </Panel>
      </div>

      <div className="analysis-grid-2">
        <Panel title="Data reliability &amp; source consensus" eyebrow="EVIDENCE LAYER">
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
              <b>4 of 5 active</b>
            </div>
            <div className="consensus-row">
              <span className="eyebrow">CONSENSUS LEVEL</span>
              <b className="green">HIGH</b>
            </div>
            <div className="consensus-row">
              <span className="eyebrow">RELIABILITY INDEX</span>
              <b>92.4 / 100</b>
            </div>
            <div className="consensus-note">
              <p>
                Source consensus measures agreement across independent data providers.
                AI confidence measures model certainty in classification.
                These are distinct metrics and should not be conflated.
              </p>
            </div>
          </div>
        </Panel>

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
              <path
                className="line"
                d="M0 120 C60 110 80 80 140 95 S200 60 260 85 S320 50 380 70 S440 30 500 55 S560 20 620 40 L700 30"
              />
              <path
                className="line secondary"
                d="M0 130 C60 125 80 110 140 118 S200 95 260 108 S320 85 380 95 S440 75 500 88 S560 70 620 80 L700 75"
              />
            </svg>
          </div>
        </Panel>
      </div>

      <SystemHealth />

      <footer>
        <span>INDRA prototype · PostgreSQL data layer · v3.0.0</span>
        <span>
          India&apos;s National Disaster &amp; Risk Analytics <b>◆</b>
        </span>
      </footer>
    </main>
  )
}
