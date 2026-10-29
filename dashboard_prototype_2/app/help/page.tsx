'use client'

import { useEffect, useRef, useState } from 'react'
import Topbar from '@/components/dashboard/Topbar'
import Link from 'next/link'

const sections = [
  { id: 'welcome', title: 'Welcome to INDRA' },
  { id: 'dashboard', title: 'Understanding Your Dashboard' },
  { id: 'map', title: 'Reading the Intelligence Map' },
  { id: 'report', title: 'Incident Report' },
  { id: 'severity', title: 'Severity' },
  { id: 'refresh', title: 'Time, Refresh & Data Reliability' },
  { id: 'data', title: 'Understanding Incident Data' },
  { id: 'sources', title: 'Sources' },
  { id: 'faq', title: 'Troubleshooting & FAQs' },
  { id: 'privacy', title: 'Privacy Policy' },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState('welcome')
  const [visibleSectionIds, setVisibleSectionIds] = useState<string[]>(sections.map(s => s.id))
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null)
  const scrollTargetRef = useRef<string | null>(null)

  useEffect(() => {
    if (!searchQuery) {
      setVisibleSectionIds(sections.map(s => s.id))
      return
    }
    const query = searchQuery.toLowerCase()
    const visible = sections.filter(s => {
      const titleMatch = s.title.toLowerCase().includes(query)
      const el = document.getElementById(s.id)
      const contentMatch = el ? (el.textContent || '').toLowerCase().includes(query) : false
      return titleMatch || contentMatch
    })
    setVisibleSectionIds(visible.map(s => s.id))
  }, [searchQuery])

  useEffect(() => {
    if (pendingScrollId) {
      const el = document.getElementById(pendingScrollId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
      setPendingScrollId(null)
    }
  }, [pendingScrollId, visibleSectionIds])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (scrollTargetRef.current !== null) {
          for (const entry of entries) {
            if (entry.isIntersecting && entry.target.id === scrollTargetRef.current) {
              scrollTargetRef.current = null
              setActiveSection(entry.target.id)
            }
          }
          return
        }
        const visible = entries
          .filter(e => e.isIntersecting && e.target.id)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id)
        }
      },
      { threshold: 0.5, rootMargin: '-140px 0% -30% 0%' }
    )
    const elements = document.querySelectorAll('.help-section')
    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [visibleSectionIds])

  return (
    <main className="dashboard help-page" id="main-content">
      <Topbar />

      <div className="help-search">
        <input
          className="help-search-input"
          type="search"
          placeholder="Search help topics…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search help sections"
        />
        <button
          className="help-search-reset"
          onClick={() => setSearchQuery('')}
          disabled={!searchQuery}
          aria-label="Clear search"
        >
          ✕
        </button>
      </div>

      <div className="help-content">
        <div className="help-sticky-nav">
          <Link href="/" className="help-back-link">&larr; Back to Dashboard</Link>
          <nav className="help-nav help-sticky-list" aria-label="Help sections">
            {sections.map(section => (
              <Link
                key={section.id}
                href={`#${section.id}`}
                className={`help-nav-item ${activeSection === section.id ? 'help-nav-item--active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  scrollTargetRef.current = section.id
                  setActiveSection(section.id)
                  if (!visibleSectionIds.includes(section.id)) {
                    setSearchQuery('')
                    setPendingScrollId(section.id)
                  } else {
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
              >
                {section.title}
              </Link>
            ))}
          </nav>
        </div>
        <div className="help-body">

          {visibleSectionIds.length === 0 && (
            <div className="help-empty">
              No results found for &ldquo;<span>{searchQuery}</span>&rdquo;. Try different keywords.
            </div>
          )}

        <section id="welcome" className="help-section" style={{ display: visibleSectionIds.includes('welcome') ? undefined : 'none' }}>
          <h2>Welcome to INDRA</h2>
          <p>
            <strong>INDRA</strong> is India&apos;s National Disaster &amp; Risk Analytics, a dashboard for incident intelligence across India.
          </p>
          <p>
            This dashboard may be useful to anyone who needs a consolidated view of incident information across India, including members of the public, researchers, and emergency-planning stakeholders. It presents a single unified view; role-based interfaces are not part of the current implementation.
          </p>
        </section>

        <section id="dashboard" className="help-section" style={{ display: visibleSectionIds.includes('dashboard') ? undefined : 'none' }}>
          <h2>Understanding Your Dashboard</h2>
          <p>
            The Home dashboard brings together five key metric cards, four filter controls, an intelligence map, an alert stream, and detailed incident reports. Use the filters to focus on the states, districts, event types, and severities that matter to you.
          </p>
          <div className="help-grid">
            <div className="help-card">
              <h3>KPI Section</h3>
              <p>Four stat cards show aggregate counts computed from the incident data:</p>
              <ul>
                <li><strong>Total incident reports</strong> — number of incident reports shown on the dashboard.</li>
                <li><strong>Active incidents</strong> — count of incidents whose status is not Resolved.</li>
                <li><strong>Critical alerts</strong> — number of Critical-severity alerts.</li>
                <li><strong>AI-detected incidents</strong> — count of incidents with confidence above 90%.</li>
              </ul>
            </div>
            <div className="help-card">
              <h3>Filter Toolbar</h3>
              <p>Four filters control which incidents appear on the map and in the alert stream:</p>
              <ul>
                <li><strong>State</strong> — searchable dropdown. Choose All India or a specific state.</li>
                <li><strong>District</strong> — searchable dropdown. Options depend on the state you select.</li>
                <li><strong>Event Type</strong> — dropdown (e.g. Heatwave, Heavy Rainfall, Cyclone, Flood).</li>
                <li><strong>Severity</strong> — dropdown (Critical, High, Moderate, or Low).</li>
              </ul>
            </div>
            <div className="help-example">
              <h4>How the dashboard fits together</h4>
              <ul>
                <li><strong>Filter first:</strong> Use State and District to narrow the view to a region.</li>
                <li><strong>Scan the map:</strong> Colored markers show incident locations. Click a marker to open its detailed report.</li>
                <li><strong>Read the alerts:</strong> The alert stream lists active incidents with severity badges and timestamps.</li>
                <li><strong>Open a report:</strong> Select any incident to see its full lifecycle stage, AI metrics, evidence sources, and affected-area breakdown.</li>
              </ul>
            </div>
            <div className="help-card">
              <h3>Navigation</h3>
              <ul>
                <li><strong>Home</strong> — the current dashboard with map, KPIs, filters, and alerts.</li>
                <li><strong>Analysis</strong> — trend charts and system health summary.</li>
                <li><strong>Help</strong> — this page.</li>
              </ul>
            </div>
            <div className="help-card">
              <h3>Interactive Intelligence Map</h3>
              <p>An SVG map of India shows incident markers positioned by latitude/longitude. Click any marker to view the Selected Incident Report.</p>
            </div>
            <div className="help-card">
              <h3>Alert System</h3>
              <p>The alert stream is organized into three severity tabs — Red (Critical), Orange (High), and Yellow (Moderate). Each tab displays a count calculated from the current alert data and retains its bright severity colour regardless of which tab is selected. Selecting a tab filters the displayed alerts to that severity only.</p>
              <ul>
                <li>Severity badge (Critical / High / Moderate / Low)</li>
                <li>Timestamp and location</li>
                <li>Alert text</li>
                <li>AI confidence percentage</li>
                <li>Multi-source attribution (e.g. &quot;Satellite + IMD&quot;)</li>
                <li>An <strong>Acknowledge</strong> button</li>
              </ul>
              <p>These severity tabs reflect INDRA's prototype data mappings and are not official government classifications.</p>
            </div>
          </div>
        </section>

        <section id="map" className="help-section" style={{ display: visibleSectionIds.includes('map') ? undefined : 'none' }}>
          <h2>Reading the Intelligence Map</h2>
          <p>
            The map is an SVG outline of India with incident markers plotted at each incident's latitude and longitude. Markers are colored by severity — critical,
            high, moderate, or low — using the same color scheme as alerts and KPI cards.
          </p>
          <p>
            Clicking a marker opens that incident's detailed report panel. The report shows the incident's lifecycle
            stage, current reading, AI confidence, reports analyzed, consensus, independent sources, evidence list, and
            area-affected breakdown.
          </p>
          <div className="help-grid">
            <div className="help-card">
              <h3>Map Controls</h3>
              <ul>
                <li><strong>Zoom in (+) / Zoom out (−):</strong> Adjust the map scale up to 5×.</li>
                <li><strong>Reset view:</strong> Return to the default zoom and position.</li>
                <li><strong>Clear selection:</strong> Deselect the currently selected incident.</li>
                <li><strong>Drag to pan:</strong> Move the map view in any direction.</li>
              </ul>
            </div>
            <div className="help-example">
              <h4>Map severity legend</h4>
              <div className="help-example-legend">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: 8, background: "var(--critical)" }} />
                    <strong>Critical</strong> — highest severity
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: 8, background: "var(--high)" }} />
                    <strong>High</strong> — elevated severity
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: 8, background: "var(--moderate)" }} />
                    <strong>Moderate</strong> — moderate severity
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: 8, background: "var(--low)" }} />
                    <strong>Low</strong> — lowest severity
                  </div>
                </div>
              </div>
            </div>
            <div className="help-card">
              <h3>Boundary data attribution</h3>
              <p>
                State boundary geometry comes from geoBoundaries gbOpen IND ADM1 (DataMeet / Election Commission of
                India), licensed CC BY 2.5 IN. This is <strong>not</strong> official Survey of India data. Boundary data
                and incident coordinates are separate datasets: markers are plotted at each incident's recorded lat/lng,
                independent of state outline precision. Do not infer exact geographic accuracy from boundary geometry alone.
              </p>
            </div>
          </div>
        </section>

        <section id="report" className="help-section" style={{ display: visibleSectionIds.includes('report') ? undefined : 'none' }}>
          <h2>Incident Report</h2>
          <p>
            The Incident Report lets you drill down from All India to individual incidents. Selecting an incident displays its full detailed report panel.
          </p>
          <div className="help-card">
            <h3>All India View</h3>
            <ul>
              <li>Displays all available states represented in the currently filtered incident data.</li>
              <li>States are ordered by highest severity first, then by incident count, and finally alphabetically.</li>
              <li>Selecting a state opens its district/area list for further drilling down.</li>
              <li>The report reflects active dashboard filters applied to the current view.</li>
            </ul>
          </div>

          <div className="help-card">
            <h3>State View</h3>
            <ul>
              <li>Shows districts or areas belonging to the selected state.</li>
              <li>Districts are ordered by severity (Critical → High → Moderate → Low), then by incident count, and finally alphabetically.</li>
              <li>Selecting a district/area displays its incident report cards below.</li>
              <li>Clicking an incident opens its full detailed report panel.</li>
            </ul>
          </div>

          <div className="help-card">
            <h3>Navigation Flow</h3>
            <ul>
              <li>Start from All India → select a State → select a District/Area → open the specific incident report.</li>
              <li>Each selection narrows the context: States → Districts → Individual incidents.</li>
              <li>When you open an incident report, it centers on that incident's location on the map.</li>
            </ul>
          </div>
        </section>

        <section id="severity" className="help-section" style={{ display: visibleSectionIds.includes('severity') ? undefined : 'none' }}>
          <h2>Severity</h2>
          <p>
            Severity classifies each incident into one of four levels. Colors are applied consistently across map
            markers, alert tags, and stat-card accents:
          </p>
          <div className="severity-grid">
            <div className="severity-item critical">
              <div className="severity-badge" style={{ background: 'var(--alert-critical)' }}>CRITICAL</div>
              <h3>Critical</h3>
            </div>
            <div className="severity-item high">
              <div className="severity-badge" style={{ background: 'var(--alert-high)' }}>HIGH</div>
              <h3>High</h3>
            </div>
            <div className="severity-item moderate">
              <div className="severity-badge" style={{ background: 'var(--alert-moderate)' }}>MODERATE</div>
              <h3>Moderate</h3>
            </div>
            <div className="severity-item low">
              <div className="severity-badge" style={{ background: 'var(--alert-low)' }}>LOW</div>
              <h3>Low</h3>
            </div>
          </div>
          <p>
            Every incident also carries AI-assessed trust metrics:
          </p>
          <ul>
            <li><strong>Confidence</strong> — AI model certainty (0–100%).</li>
            <li><strong>Reports analyzed:</strong> number of source reports reviewed.</li>
            <li><strong>Consensus:</strong> agreement level across sources (High / Medium / Low).</li>
            <li><strong>Independent sources:</strong> count of independent providers confirming the incident.</li>
          </ul>
        </section>

        <section id="refresh" className="help-section" style={{ display: visibleSectionIds.includes('refresh') ? undefined : 'none' }}>
          <h2>Time, Refresh & Data Reliability</h2>
          <p>
            Current Time (IST) is displayed in the top bar and updates once per second using the Asia/Kolkata timezone.
            Last Updated shows the timestamp of the last successful synchronization.
          </p>
          <div className="help-grid">
            <div className="help-card">
              <h3>Current Time (IST)</h3>
              <p>Displays the current time in Indian Standard Time (Asia/Kolkata), updated every second.</p>
            </div>
            <div className="help-card">
              <h3>Last Updated</h3>
              <p>Shows the timestamp of the last successful dashboard synchronization.</p>
            </div>
            <div className="help-card">
              <h3>Refresh Indicator</h3>
              <p>The FRESH / UPDATING / STALE badge indicates the synchronization state:</p>
              <ul>
                <li><strong>FRESH</strong> — last sync within the last 60 seconds</li>
                <li><strong>UPDATING</strong> — a synchronization cycle is in progress</li>
                <li><strong>STALE</strong> — no successful sync in over 60 seconds</li>
              </ul>
            </div>
            <div className="help-card">
              <h3>Manual Refresh</h3>
              <p>Clicking the Refresh button triggers an immediate synchronization cycle. In this prototype, refresh recomputes the same static dataset and updates the timestamp — it does not fetch new backend records.</p>
            </div>
          </div>
          <div className="help-example">
            <h4>Freshness status guide</h4>
            <div className="help-example-legend">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: 8, background: "var(--low)" }} />
                  <strong>FRESH</strong> — synced within 60 seconds
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: 8, background: "var(--amber)" }} />
                  <strong>UPDATING</strong> — sync cycle in progress
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: 8, background: "var(--red)" }} />
                  <strong>STALE</strong> — no successful sync in over 60 seconds
                </div>
              </div>
            </div>
            <p className="note">
              Freshness status reflects the prototype'"'"'s sync state only. It does not confirm that real-world incident data is current or accurate.
            </p>
          </div>
        </section>

        <section id="data" className="help-section" style={{ display: visibleSectionIds.includes('data') ? undefined : 'none' }}>
          <h2>Understanding Incident Data</h2>
          <p>
            Each incident in the dashboard carries structured information organized into groups. The fields below describe what the interface displays — they are interface labels, not independently verified facts.
          </p>
          <div className="help-grid">
            <div className="help-card">
              <h3>Core Information</h3>
              <ul>
                <li><strong>Event:</strong> type of incident (e.g. Heatwave, Heavy Rainfall)</li>
                <li><strong>Place:</strong> location name (e.g. "Delhi NCR")</li>
                <li><strong>State / District:</strong> administrative location</li>
              </ul>
            </div>
            <div className="help-card">
              <h3>Measurement</h3>
              <ul>
                <li><strong>Severity:</strong> critical, high, moderate, or low</li>
                <li><strong>Value:</strong> measured reading with unit (e.g. "45.2°C", "142 mm")</li>
                <li><strong>Alert text:</strong> short description of the incident</li>
              </ul>
            </div>
            <div className="help-card">
              <h3>AI Trust Metrics</h3>
              <ul>
                <li><strong>Confidence:</strong> AI model certainty (0–100%)</li>
                <li><strong>Reports analyzed:</strong> number of source reports reviewed.</li>
                <li><strong>Consensus:</strong> agreement across sources (High / Medium / Low).</li>
              </ul>
            </div>
            <div className="help-card">
              <h3>Source & Location</h3>
              <ul>
                <li><strong>Source:</strong> data provider that reported the incident</li>
                <li><strong>Lat / Lng:</strong> coordinates for map positioning</li>
                <li><strong>Time:</strong> display-relative timestamp (e.g. "41 min ago")</li>
              </ul>
            </div>
            
          </div>
          <div className="help-example">
            <h4>Example incident report structure</h4>
            <div className="help-example-legend">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                  <strong>Event:</strong> Heatwave
                </div>
                <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                  <strong>Severity:</strong> Critical
                </div>
                <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                  <strong>Value:</strong> 45.2°C
                </div>
                <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                  <strong>Confidence:</strong> 96%
                </div>
                <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                  <strong>Evidence:</strong> IMD API (verified), Satellite / sensor (verified), Citizen reports (verified), Public posts (pending)
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="sources" className="help-section" style={{ display: visibleSectionIds.includes('sources') ? undefined : 'none' }}>
          <h2>Sources</h2>
        </section>

        <section id="faq" className="help-section" style={{ display: visibleSectionIds.includes('faq') ? undefined : 'none' }}>
          <h2>Troubleshooting & FAQs</h2>
          <p>
            Common questions about using the INDRA dashboard.
          </p>
          <dl>
            <dt>Why do I see the same incidents after refreshing?</dt>
            <dd>This prototype uses static/mock incident data. Refreshing recomputes the same dataset and updates the timestamp; it does not fetch new backend records.</dd>
            <dt>Why is an incident missing from the map?</dt>
            <dd>Check the filter toolbar. State, District, Event Type, and Severity filters may exclude the incident from view.</dd>
            <dt>Why does the District filter show no options?</dt>
            <dd>District options depend on the state you select. If no districts appear, none are configured for that state in the reference data.</dd>
            <dt>What does FRESH / UPDATING / STALE mean?</dt>
            <dd>Freshness indicates data currency: FRESH (synced within 60 seconds), UPDATING (sync in progress), STALE (no sync in over 60 seconds).</dd>
            <dt>Can I use this dashboard for emergency response?</dt>
            <dd>No. This is a frontend prototype with static/mock data. It is not suitable for operational decisions or emergency response.</dd>
          </dl>
        </section>
        <section id="privacy" className="help-section" style={{ display: visibleSectionIds.includes('privacy') ? undefined : 'none' }}>
          <h2>Privacy Policy</h2>
          <p>INDRA's Privacy Policy explains how information is collected, processed, stored, and handled on the platform, including data minimisation, security, retention, disclosure, and privacy-related enquiries.</p>
          <p><Link href="/privacy" className="help-privacy-link">Read the Privacy Policy →</Link></p>
        </section>
      </div>
    </div>
    </main>
  )
}