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
