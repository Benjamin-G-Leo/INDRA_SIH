import { bboxFromGeometries, padBoundingBox, type BoundingBox } from './geo'

export interface BoundaryGeometry {
  type: 'Polygon' | 'MultiPolygon'
  coordinates: number[][][] | number[][][][]
}

export interface BoundaryFeature {
  type: 'Feature'
  properties: { name: string }
  geometry: BoundaryGeometry
}

export interface BoundaryCollection {
  type: 'FeatureCollection'
  features: BoundaryFeature[]
}

export interface LoadedBoundaries {
  collection: BoundaryCollection
  bbox: BoundingBox
}

/**
 * Prototype ADM1 dataset served from public/india-states.geojson.
 * Swap that file (CRS84 Polygon/MultiPolygon FeatureCollection) to use
 * authorized Survey of India data without changing marker projection.
 */
export const INDIA_BOUNDARY_DATASET = {
  id: 'geoboundaries-ind-adm1',
  path: '/india-states.geojson',
  crs: 'CRS84',
  source: 'geoBoundaries gbOpen IND ADM1 (DataMeet / Election Commission of India)',
  license: 'CC BY 2.5 IN',
  attribution:
    'Administrative boundaries: geoBoundaries (gbOpen IND ADM1). Original geometry: DataMeet / Election Commission of India. License: CC BY 2.5 IN. Not official Survey of India data. Replace public/india-states.geojson with authorized SoI GeoJSON (CRS84) to swap the basemap.',
} as const

function readName(properties: Record<string, unknown> | undefined): string {
  if (!properties) return 'Unknown'
  for (const key of ['name', 'shapeName', 'NAME_1', 'ST_NM', 'NAME']) {
    const value = properties[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return 'Unknown'
}

function asBoundaryGeometry(geometry: { type?: string; coordinates?: unknown } | null | undefined): BoundaryGeometry | null {
  if (!geometry || !geometry.coordinates) return null
  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    return {
      type: geometry.type,
      coordinates: geometry.coordinates as BoundaryGeometry['coordinates'],
    }
  }
  return null
}

export function normalizeBoundaryCollection(raw: unknown): BoundaryCollection {
  const data = raw as { type?: string; features?: unknown[] }
  const features: BoundaryFeature[] = []
  for (const item of data.features ?? []) {
    const feature = item as {
      properties?: Record<string, unknown>
      geometry?: { type?: string; coordinates?: unknown }
    }
    const geometry = asBoundaryGeometry(feature.geometry)
    if (!geometry) continue
    features.push({
      type: 'Feature',
      properties: { name: readName(feature.properties) },
      geometry,
    })
  }
  return { type: 'FeatureCollection', features }
}

export function extentFromBoundaries(collection: BoundaryCollection): BoundingBox {
  const raw = bboxFromGeometries(collection.features)
  if (!raw) {
    throw new Error('Boundary dataset did not contain usable coordinates')
  }
  return padBoundingBox(raw)
}

export async function loadIndiaBoundaries(): Promise<LoadedBoundaries> {
  const response = await fetch(INDIA_BOUNDARY_DATASET.path)
  if (!response.ok) {
    throw new Error(`Failed to load ${INDIA_BOUNDARY_DATASET.path} (${response.status})`)
  }
  const collection = normalizeBoundaryCollection(await response.json())
  return { collection, bbox: extentFromBoundaries(collection) }
}
