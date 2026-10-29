import type { GeoCoord } from './types'

export interface BoundingBox {
  minLng: number
  maxLng: number
  minLat: number
  maxLat: number
}

/** Fallback only until a boundary dataset is loaded. Prefer bboxFromGeometries(). */
export const INDIA_BBOX: BoundingBox = {
  minLng: 68.0,
  maxLng: 97.5,
  minLat: 6.5,
  maxLat: 37.2,
}

function extendBBox(bbox: BoundingBox, lng: number, lat: number): void {
  if (lng < bbox.minLng) bbox.minLng = lng
  if (lng > bbox.maxLng) bbox.maxLng = lng
  if (lat < bbox.minLat) bbox.minLat = lat
  if (lat > bbox.maxLat) bbox.maxLat = lat
}

function walkPositions(
  type: string,
  coordinates: number[][] | number[][][] | number[][][][],
  visit: (lng: number, lat: number) => void,
): void {
  if (type === 'Polygon') {
    for (const ring of coordinates as number[][][]) {
      for (const pt of ring) visit(pt[0], pt[1])
    }
    return
  }
  if (type === 'MultiPolygon') {
    for (const polygon of coordinates as number[][][][]) {
      for (const ring of polygon) {
        for (const pt of ring) visit(pt[0], pt[1])
      }
    }
  }
}

export function bboxFromGeometries(
  features: Array<{ geometry?: { type: string; coordinates: number[][] | number[][][] | number[][][][] } }>,
): BoundingBox | null {
  const bbox: BoundingBox = {
    minLng: Infinity,
    maxLng: -Infinity,
    minLat: Infinity,
    maxLat: -Infinity,
  }
  for (const feature of features) {
    const geom = feature.geometry
    if (!geom) continue
    walkPositions(geom.type, geom.coordinates, (lng, lat) => extendBBox(bbox, lng, lat))
  }
  if (!Number.isFinite(bbox.minLng)) return null
  return bbox
}

export function padBoundingBox(bbox: BoundingBox, padRatio: number = 0.012): BoundingBox {
  const lngPad = (bbox.maxLng - bbox.minLng) * padRatio
  const latPad = (bbox.maxLat - bbox.minLat) * padRatio
  return {
    minLng: bbox.minLng - lngPad,
    maxLng: bbox.maxLng + lngPad,
    minLat: bbox.minLat - latPad,
    maxLat: bbox.maxLat + latPad,
  }
}

export interface ProjectionResult {
  x: number
  y: number
}

export function projectCoord(
  coord: GeoCoord,
  bbox: BoundingBox,
  width: number,
  height: number,
  zoom: number = 1,
  panX: number = 0,
  panY: number = 0,
): ProjectionResult {
  const lngRange = bbox.maxLng - bbox.minLng
  const latRange = bbox.maxLat - bbox.minLat

  const scaleX = width / lngRange
  const scaleY = height / latRange
  const scale = Math.min(scaleX, scaleY)

  const offsetX = (width - lngRange * scale) / 2
  const offsetY = (height - latRange * scale) / 2

  const x = ((coord.lng - bbox.minLng) * scale + offsetX - panX) * zoom + (width * (1 - zoom)) / 2
  const y = ((bbox.maxLat - coord.lat) * scale + offsetY - panY) * zoom + (height * (1 - zoom)) / 2

  return { x, y }
}

export function projectPath(
  coordinates: number[][],
  bbox: BoundingBox,
  width: number,
  height: number,
  zoom: number = 1,
  panX: number = 0,
  panY: number = 0,
): string {
  const lngRange = bbox.maxLng - bbox.minLng
  const latRange = bbox.maxLat - bbox.minLat
  const scale = Math.min(width / lngRange, height / latRange)
  const offsetX = (width - lngRange * scale) / 2
  const offsetY = (height - latRange * scale) / 2

  const points = coordinates.map(([lng, lat]) => {
    const x = ((lng - bbox.minLng) * scale + offsetX - panX) * zoom + (width * (1 - zoom)) / 2
    const y = ((bbox.maxLat - lat) * scale + offsetY - panY) * zoom + (height * (1 - zoom)) / 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return 'M' + points.join('L') + 'Z'
}

export function projectMultiPolygon(
  coords: number[][][][],
  bbox: BoundingBox,
  width: number,
  height: number,
  zoom: number = 1,
  panX: number = 0,
  panY: number = 0,
): string {
  return coords
    .map(polygon =>
      polygon
        .map(ring => projectPath(ring, bbox, width, height, zoom, panX, panY))
        .join(''),
    )
    .join('')
}

export function projectPolygon(
  coords: number[][][],
  bbox: BoundingBox,
  width: number,
  height: number,
  zoom: number = 1,
  panX: number = 0,
  panY: number = 0,
): string {
  return coords.map(ring => projectPath(ring, bbox, width, height, zoom, panX, panY)).join('')
}
