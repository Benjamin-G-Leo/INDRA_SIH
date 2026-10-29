export type Severity = 'critical' | 'high' | 'moderate' | 'low'

export type LifecycleStage = 'Detected' | 'Verified' | 'Acknowledged' | 'Assigned' | 'Responding' | 'Resolved'

export interface GeoCoord {
  lat: number
  lng: number
}

export interface AreaAffected {
  area: string
  population: string
  hospitals: string
  schools: string
  roads: string
  infrastructure: string
  districts: string
}

export interface EvidenceSource {
  name: string
  status: 'verified' | 'pending'
}

export interface Incident {
  id: number
  event: string
  name: string
  place: string
  state: string
  district: string
  severity: Severity
  value: string
  source: string
  reports: number
  confidence: number
  consensus: 'High' | 'Medium' | 'Low'
  independentSources: string
  status: LifecycleStage
  impact: string
  lat: number
  lng: number
  time: string
  alertText: string
  areaAffected: AreaAffected
  evidence: EvidenceSource[]
}

export interface Alert {
  sev: Severity
  event: string
  place: string
  time: string
  text: string
  confidence: string
  source: string
  incidentId: number
  status: LifecycleStage
}

export interface KPICard {
  icon: string
  label: string
  value: string
  delta: string
  tone: string
}

/* ===== Canonical data contract (additive — existing types unchanged) ===== */

export const DATA_SCHEMA_VERSION = '1.0.0'

// Source record from public social media / news / government posts
export interface PublicReport {
  kind: 'public'
  sourceRecordId: string      // post_id from CSV
  source: string              // telegram_channel, twitter_x, etc.
  sourceKind: string          // messaging, social_media, news, government
  authorHandle?: string
  authorVerified: boolean
  authorFollowers?: number
  language: string
  text: string
  hashtags: string[]
  postedAt: string            // ISO timestamp
  scrapedAt?: string
  city?: string
  state: string
  locality?: string
  latitude: number
  longitude: number
  mediaType?: string
  likes?: number
  reposts?: number
  disasterTypeClaimed?: string
  isRealCrisis: boolean
  label: 'real' | 'rumour' | 'noise'
  linkedEventId?: string      // groups reports into events; undefined = unlinked
  credibilityScore?: number
  urgency: 'low' | 'medium' | 'high'
  dataSource: string
  isSynthetic: boolean
}

// Source record from IMD weather observations
export interface ImdObservation {
  kind: 'imd'
  recordId: string            // record_id from CSV
  observationDate: string     // ISO date
  observationTimeIst: string
  year: number
  month: number
  season: string
  stationId: string
  stationName: string
  state: string
  district: string
  latitude: number
  longitude: number
  tempMaxC?: number
  tempMinC?: number
  rainfallMm?: number
  disasterType?: string       // may be undefined / "None"
  allHazards?: string[]
  imdAlertColor?: 'green' | 'yellow' | 'orange' | 'red'
  disasterProbabilityPct?: number
  dataSource: string
  isSynthetic: boolean
}

export type SourceRecord = PublicReport | ImdObservation

// Canonical incident (what the dashboard displays)
export interface CanonicalIncident {
  incidentId: string          // stable canonical ID
  linkedEventId?: string
  eventType: string
  severity?: Severity         // optional — explicitly test-only; NOT mapped from urgency/IMD color
  place: string
  state: string
  district?: string
  latitude: number
  longitude: number
  observedAt?: string
  updatedAt: string
  confidence?: number         // 0-100, optional
  sourceCount: number
  supportingSourceIds: string[]
  status?: LifecycleStage
  value?: string
  dataSource: string
  isSynthetic: boolean
  materialChange?: boolean    // test-only flag for update scenarios
}

// Canonical alert (operational, linked to canonical incident)
export interface CanonicalAlert {
  alertId: string
  incidentId: string          // references CanonicalIncident.incidentId
  severity?: Severity         // optional — NOT mapped from public urgency / IMD color
  eventType: string
  place: string
  time: string
  text: string
  confidence?: string
  source: string
  status?: LifecycleStage
  createdAt: string
  updatedAt: string
  isSynthetic: boolean
}

// Complete dataset container
export interface PrototypeDataset {
  schemaVersion: string
  generatedAt: string
  incidents: CanonicalIncident[]
  sourceRecords: SourceRecord[]
  alerts: CanonicalAlert[]
}
