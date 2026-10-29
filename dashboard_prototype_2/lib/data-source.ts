/* ===== Data-access boundary for INDRA prototype dataset =====

This module provides:
1. An asynchronous-capable data-source interface (IncidentDataSource)
2. A static implementation that loads the prototype JSON fixture
3. A deterministic, collision-checked mapping from canonical string IDs
   to the dashboard's existing numeric Incident.id / Alert.incidentId
4. An adapter from CanonicalIncident / CanonicalAlert to the existing
   dashboard Incident / Alert interfaces

Existing dashboard types (Incident, Alert, Severity, LifecycleStage) are
NOT modified. This module is additive.

Prototype data is clearly labelled synthetic. The adapter uses supplied
canonical values wherever available. Where the existing dashboard type
requires a field that the canonical dataset does not provide, the
fallback is documented as a prototype-only limitation — it is NOT
inferred from public urgency, IMD alert colour, or any analytical
derivation, and it is NOT presented as a verified finding.
*/

import type {
  CanonicalAlert,
  CanonicalIncident,
  PrototypeDataset,
  Severity,
} from './types'
import type { Alert, Incident } from './types'
import prototypeFixture from '@/test-data/indra-prototype.json'

/* ------------------------------------------------------------------ */
/*  Data-source interface                                             */
/* ------------------------------------------------------------------ */

export interface IncidentDataSource {
  readonly schemaVersion: string
  readonly generatedAt: string
  /** Asynchronous dataset load. Called once; results are cached. */
  loadDataset(): Promise<PrototypeDataset>
  /** Convenience: incidents from the last successful load. */
  getIncidents(): CanonicalIncident[]
  /** Convenience: alerts from the last successful load. */
  getAlerts(): CanonicalAlert[]
  /** Convenience: source records from the last successful load. */
  getSourceRecords(): import('./types').SourceRecord[]
  isLoading(): boolean
  getError(): Error | null
}

/* ------------------------------------------------------------------ */
/*  Static prototype implementation                                   */
/* ------------------------------------------------------------------ */

export class StaticPrototypeDataSource implements IncidentDataSource {
  private dataset: PrototypeDataset | null = null
  private loading = false
  private error: Error | null = null
  private idMap = new Map<string, number>()
  private nextNumericId = 1

  constructor(private fixturePath: string) {}

  readonly schemaVersion = '1.0.0'
  readonly generatedAt = '2025-01-15T00:00:00Z'

  async loadDataset(): Promise<PrototypeDataset> {
    this.loading = true
    this.error = null
    try {
      const dataset: PrototypeDataset = prototypeFixture as PrototypeDataset
      this.validateDataset(dataset)
      this.buildIdMap(dataset.incidents)
      this.dataset = dataset
      return dataset
    } catch (err) {
      this.error = err instanceof Error ? err : new Error(String(err))
      throw this.error
    } finally {
      this.loading = false
    }
  }

  getIncidents(): CanonicalIncident[] {
    return this.dataset ? this.dataset.incidents : []
  }

  getAlerts(): CanonicalAlert[] {
    return this.dataset ? this.dataset.alerts : []
  }

  getSourceRecords(): import('./types').SourceRecord[] {
    return this.dataset ? this.dataset.sourceRecords : []
  }

  isLoading(): boolean {
    return this.loading
  }

  getError(): Error | null {
    return this.error
  }

  /** Deterministic, collision-checked mapping from canonical string ID
   *  to the dashboard's numeric ID. Never falls back to 0. Throws on
   *  duplicate or unmapped IDs. */
  getNumericId(canonicalId: string): number {
    const mapped = this.idMap.get(canonicalId)
    if (mapped === undefined) {
      throw new Error(`No numeric ID mapped for canonical incident "${canonicalId}"`)
    }
    return mapped
  }

  /** Reverse lookup for debugging / tests. */
  getCanonicalId(numericId: number): string | undefined {
    for (const [canonicalId, num] of this.idMap.entries()) {
      if (num === numericId) return canonicalId
    }
    return undefined
  }

  private buildIdMap(incidents: CanonicalIncident[]): void {
    this.idMap.clear()
    this.nextNumericId = 1

    const sorted = [...incidents].sort((a, b) =>
      a.incidentId.localeCompare(b.incidentId)
    )

    for (const inc of sorted) {
      if (this.idMap.has(inc.incidentId)) {
        throw new Error(`Duplicate canonical incidentId: ${inc.incidentId}`)
      }
      this.idMap.set(inc.incidentId, this.nextNumericId++)
    }
  }

  private validateDataset(dataset: PrototypeDataset): void {
    validateDataset(dataset)
  }
}

/** Checks a dataset against the schema contract. Throws on the first problem. */
export function validateDataset(dataset: PrototypeDataset): void {
  if (dataset.schemaVersion !== '1.0.0') {
    throw new Error(`Unsupported schema version: ${dataset.schemaVersion}`)
  }

  const incidentIds = dataset.incidents.map(i => i.incidentId)
  if (new Set(incidentIds).size !== incidentIds.length) {
    throw new Error('Duplicate incidentId in dataset')
  }

  const validIncidentIds = new Set(incidentIds)
  for (const alert of dataset.alerts) {
    if (!validIncidentIds.has(alert.incidentId)) {
      throw new Error(
        `Alert ${alert.alertId} references unknown incidentId ${alert.incidentId}`
      )
    }
  }

  for (const inc of dataset.incidents) {
    if (!inc.isSynthetic) {
      throw new Error(`Incident ${inc.incidentId} is not marked isSynthetic`)
    }
  }
  for (const alert of dataset.alerts) {
    if (!alert.isSynthetic) {
      throw new Error(`Alert ${alert.alertId} is not marked isSynthetic`)
    }
  }
  for (const rec of dataset.sourceRecords) {
    const id = rec.kind === 'public' ? rec.sourceRecordId : rec.recordId
    if (!rec.isSynthetic) {
      throw new Error(`Source record ${id} is not marked isSynthetic`)
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Remote implementation: the JSON written by the pipeline           */
/*  (weather_platform_v2/export_dashboard.py)                         */
/* ------------------------------------------------------------------ */

export const DEFAULT_DATASET_URL = process.env.NEXT_PUBLIC_DATASET_URL ?? '/data/indra-dataset.json'

/** Fetches and validates the pipeline dataset. Never falls back to other data: errors are thrown to the caller. */
export async function loadRemoteDataset(url: string = DEFAULT_DATASET_URL): Promise<PrototypeDataset> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Could not load ${url} (HTTP ${res.status}). Run export_dashboard.py in weather_platform_v2 to create it.`)
  }
  const dataset = (await res.json()) as PrototypeDataset
  validateDataset(dataset)
  return dataset
}

/* ------------------------------------------------------------------ */
/*  Canonical-to-dashboard adapter                                    */
/* ------------------------------------------------------------------ */

/**
 * Adapts a CanonicalIncident to the existing dashboard Incident type.
 *
 * Supplied canonical values are preserved wherever available.
 * Required dashboard fields that the canonical dataset does not provide
 * receive documented prototype-only fallbacks. These fallbacks are
 * NOT inferred from public urgency, IMD alert colour, or any analytical
 * derivation, and they are NOT presented as verified findings.
 *
 * Limitations:
 *   - consensus: canonical dataset has no consensus field. Fallback 'Medium'
 *     is a prototype-only placeholder, NOT derived from LifecycleStage.
 *   - independentSources: canonical dataset has sourceCount only.
 *     Fallback '0/0' is a prototype-only placeholder, NOT derived from
 *     sourceCount.
 *   - confidence: optional in canonical dataset. Fallback 0 is a
 *     prototype-only placeholder.
 *   - severity: optional in canonical dataset. Fallback 'low' is a
 *     prototype-only placeholder. NOT mapped from urgency/IMD colour.
 *   - status: optional in canonical dataset. Fallback 'Detected' is a
 *     prototype-only fallback.
 */
export function adaptIncidentToDashboard(
  c: CanonicalIncident,
  idMap: Map<string, number>
): Incident {
  const numericId = idMap.get(c.incidentId)
  if (numericId === undefined) {
    throw new Error(`No numeric ID mapped for canonical incident "${c.incidentId}"`)
  }

  return {
    id: numericId,
    event: c.eventType,
    name: c.eventType,
    place: c.place,
    state: c.state,
    district: c.district ?? '',
    severity: c.severity ?? 'low',
    value: c.value ?? '',
    source: c.dataSource,
    reports: c.sourceCount,
    confidence: c.confidence ?? 0,
    consensus: 'Medium',
    independentSources: '0/0',
    status: c.status ?? 'Detected',
    impact: '',
    lat: c.latitude,
    lng: c.longitude,
    time: c.updatedAt,
    alertText: '',
    areaAffected: {
      area: '',
      population: '',
      hospitals: '',
      schools: '',
      roads: '',
      infrastructure: '',
      districts: '',
    },
    evidence: [],
  }
}

/**
 * Adapts a CanonicalAlert to the existing dashboard Alert type.
 *
 * Same principles: supplied values preserved, documented fallbacks only
 * where the existing type requires a field the canonical dataset lacks.
 */
export function adaptAlertToDashboard(
  a: CanonicalAlert,
  idMap: Map<string, number>
): Alert {
  const numericIncidentId = idMap.get(a.incidentId)
  if (numericIncidentId === undefined) {
    throw new Error(
      `Alert ${a.alertId} references unmapped incidentId "${a.incidentId}"`
    )
  }

  return {
    sev: a.severity ?? 'low',
    event: a.eventType,
    place: a.place,
    time: a.time,
    text: a.text,
    confidence: a.confidence ?? '',
    source: a.source,
    incidentId: numericIncidentId,
    status: a.status ?? 'Detected',
  }
}