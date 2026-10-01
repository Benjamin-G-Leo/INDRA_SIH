'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Incident } from '@/lib/types'
import { projectCoord, projectPolygon, projectMultiPolygon, type BoundingBox } from '@/lib/geo'
import {
  INDIA_BOUNDARY_DATASET,
  loadIndiaBoundaries,
  type BoundaryCollection,
} from '@/lib/boundaries'

export default function IntelligenceMap({
  incidents,
  selectedId,
  onSelect,
}: {
  incidents: Incident[]
  selectedId: number | null
  onSelect: (id: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [geoData, setGeoData] = useState<BoundaryCollection | null>(null)
  const [bbox, setBbox] = useState<BoundingBox | null>(null)
  const [dims, setDims] = useState({ width: 800, height: 420 })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

  useEffect(() => {
    loadIndiaBoundaries()
      .then(({ collection, bbox: extent }) => {
        setGeoData(collection)
        setBbox(extent)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      const e = entries[0]
      setDims({ width: e.contentRect.width, height: e.contentRect.height })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setPan({ x: dragStart.current.panX - dx, y: dragStart.current.panY - dy })
  }

  const handleMouseUp = () => setIsDragging(false)

  const zoomIn = () => setZoom(z => Math.min(z * 1.4, 5))
  const zoomOut = () => {
    setZoom(z => Math.max(z / 1.4, 1))
    if (zoom <= 1.4) setPan({ x: 0, y: 0 })
  }
  const recenter = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const clearSelection = () => {
    onSelect(0)
  }

  const w = dims.width
  const h = dims.height
  const northLabel = bbox ? `N ${bbox.maxLat.toFixed(0)}°` : ''
  const southLabel = bbox ? `N ${bbox.minLat.toFixed(0)}°` : ''

  return (
    <div className="map-panel-wrap">
      <div className="map-actions-bar">
        <span className="live-dot" /> LIVE
        <div className="map-controls">
          <button className="zoom" onClick={zoomIn} aria-label="Zoom in">+</button>
          <button className="zoom" onClick={zoomOut} aria-label="Zoom out">−</button>
          <button className="zoom reset" onClick={recenter} aria-label="Reset view">⟲</button>
          <button className="zoom reset" onClick={clearSelection} aria-label="Clear selection">✕</button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="map-wrap"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          className="india-map-svg"
        >
          <defs>
            <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect width={w} height={h} fill="url(#mapgrid)" />

          {bbox && geoData?.features.map((feature, i) => {
            const geom = feature.geometry
            let pathD = ''
            if (geom.type === 'Polygon') {
              pathD = projectPolygon(geom.coordinates as number[][][], bbox, w, h, zoom, pan.x, pan.y)
            } else if (geom.type === 'MultiPolygon') {
              pathD = projectMultiPolygon(geom.coordinates as number[][][][], bbox, w, h, zoom, pan.x, pan.y)
            }
            return (
              <path
                key={`${feature.properties.name}-${i}`}
                d={pathD}
                className="state-path"
                aria-label={feature.properties.name}
              />
            )
          })}

          {bbox && incidents.map(inc => {
            const { x, y } = projectCoord(
              { lat: inc.lat, lng: inc.lng },
              bbox,
              w,
              h,
              zoom,
              pan.x,
              pan.y,
            )
            if (x < -20 || x > w + 20 || y < -20 || y > h + 20) return null
            const isSelected = selectedId === inc.id
            const isHovered = hoveredId === inc.id
            return (
              <g
                key={inc.id}
                transform={`translate(${x},${y})`}
                className={`marker-g ${inc.severity} ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                onMouseDown={e => e.stopPropagation()}
                onClick={() => onSelect(inc.id)}
                onMouseEnter={() => setHoveredId(inc.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: 'pointer' }}
              >
                {isSelected && <circle r="22" className="marker-pulse" />}
                <circle r="8" className="marker-circle" />
                <circle r="3" className="marker-dot" />
                {(isSelected || isHovered) && (
                  <text x="0" y="-14" textAnchor="middle" className="marker-label">
                    {inc.event} · {inc.place}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {northLabel && <div className="map-label north">{northLabel}</div>}
        {southLabel && <div className="map-label south">{southLabel}</div>}

        <div className="legend">
          {['critical', 'high', 'moderate', 'low'].map(s => (
            <span key={s}>
              <i className={s} /> {s}
            </span>
          ))}
        </div>
      </div>
      <div className="map-attribution">
        {INDIA_BOUNDARY_DATASET.attribution}
      </div>
    </div>
  )
}
