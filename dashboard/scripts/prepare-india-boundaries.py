"""Build a dashboard-sized India ADM1 GeoJSON for public/india-states.geojson.

Reads a validated geoBoundaries (or compatible) FeatureCollection and writes
Polygon/MultiPolygon features with properties.name, CRS84 [lng, lat] coordinates,
and enough simplification for a ~420px SVG map.
"""
from __future__ import annotations

import json
import math
import sys
import unicodedata
from pathlib import Path

INCIDENTS = [
    ("Delhi", 77.2090, 28.6139, "Delhi"),
    ("Jaisalmer", 70.9083, 26.9155, "Rajasthan"),
    ("Puri", 85.8312, 19.8135, "Odisha"),
    ("Siliguri", 88.3953, 26.7271, "West Bengal"),
    ("Pune", 73.8567, 18.5204, "Maharashtra"),
    ("Bengaluru", 77.5946, 12.9716, "Karnataka"),
]


def fold(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch)).lower()


def perpendicular_distance(px: float, py: float, ax: float, ay: float, bx: float, by: float) -> float:
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def simplify_open(points: list, epsilon: float) -> list:
    if len(points) < 3:
        return points
    ax, ay = points[0][0], points[0][1]
    bx, by = points[-1][0], points[-1][1]
    max_d = -1.0
    idx = 0
    for i in range(1, len(points) - 1):
        d = perpendicular_distance(points[i][0], points[i][1], ax, ay, bx, by)
        if d > max_d:
            max_d = d
            idx = i
    if max_d > epsilon:
        left = simplify_open(points[: idx + 1], epsilon)
        right = simplify_open(points[idx:], epsilon)
        return left[:-1] + right
    return [points[0], points[-1]]


def simplify_ring(ring: list, epsilon: float) -> list | None:
    if len(ring) < 4:
        return None
    closed = ring[0][0] == ring[-1][0] and ring[0][1] == ring[-1][1]
    body = [[pt[0], pt[1]] for pt in (ring[:-1] if closed else ring)]
    simplified = simplify_open(body, epsilon)
    if len(simplified) < 3:
        return None
    simplified.append([simplified[0][0], simplified[0][1]])
    return simplified


def simplify_polygon(rings: list, epsilon: float) -> list | None:
    if not rings:
        return None
    outer = simplify_ring(rings[0], epsilon)
    if not outer:
        return None
    holes = []
    for hole in rings[1:]:
        simple = simplify_ring(hole, max(epsilon * 1.4, 0.02))
        if simple:
            holes.append(simple)
    return [outer, *holes]


def simplify_geom(geom: dict, epsilon: float) -> dict | None:
    t = geom.get("type")
    coords = geom.get("coordinates") or []
    if t == "Polygon":
        poly = simplify_polygon(coords, epsilon)
        return {"type": "Polygon", "coordinates": poly} if poly else None
    if t == "MultiPolygon":
        polys = [p for p in (simplify_polygon(poly, epsilon) for poly in coords) if p]
        if not polys:
            return None
        if len(polys) == 1:
            return {"type": "Polygon", "coordinates": polys[0]}
        return {"type": "MultiPolygon", "coordinates": polys}
    return None


def ring_contains(lng: float, lat: float, ring: list) -> bool:
    inside = False
    n = len(ring)
    if n < 3:
        return False
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > lat) != (yj > lat)) and (
            lng < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-16) + xi
        ):
            inside = not inside
        j = i
    return inside


def polygon_contains(lng: float, lat: float, rings: list) -> bool:
    if not rings or not ring_contains(lng, lat, rings[0]):
        return False
    return not any(ring_contains(lng, lat, hole) for hole in rings[1:])


def geom_contains(lng: float, lat: float, geom: dict) -> bool:
    t = geom.get("type")
    coords = geom.get("coordinates") or []
    if t == "Polygon":
        return polygon_contains(lng, lat, coords)
    if t == "MultiPolygon":
        return any(polygon_contains(lng, lat, poly) for poly in coords)
    return False


def feature_name(props: dict) -> str:
    for key in ("shapeName", "name", "NAME_1", "ST_NM", "NAME"):
        val = props.get(key)
        if val:
            return str(val)
    return "Unknown"


def pip_ok(features: list) -> bool:
    ok = True
    for label, lng, lat, expected in INCIDENTS:
        hits = [
            feature_name(f.get("properties") or {})
            for f in features
            if geom_contains(lng, lat, f.get("geometry") or {})
        ]
        matched = any(fold(expected) in fold(h) or fold(h) in fold(expected) for h in hits)
        print(f"PIP {label}: hits={hits} ok={matched}")
        ok = ok and matched
    return ok


def main() -> None:
    src = Path(sys.argv[1])
    dest = Path(sys.argv[2])
    data = json.loads(src.read_text(encoding="utf-8"))
    features_in = data.get("features") or []

    # ~0.4px at 420px over ~30° of latitude; keeps state outlines recognizable.
    epsilon = 0.03
    while epsilon >= 0.008:
        out_features = []
        for f in features_in:
            geom = simplify_geom(f.get("geometry") or {}, epsilon)
            if not geom:
                continue
            out_features.append(
                {
                    "type": "Feature",
                    "properties": {"name": feature_name(f.get("properties") or {})},
                    "geometry": geom,
                }
            )
        print("try epsilon", epsilon, "features", len(out_features))
        if len(out_features) == len(features_in) and pip_ok(out_features):
            collection = {"type": "FeatureCollection", "features": out_features}
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(json.dumps(collection, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
            print("wrote", dest, "bytes", dest.stat().st_size)
            return
        epsilon *= 0.7

    raise SystemExit("Could not simplify while preserving incident containment")


if __name__ == "__main__":
    main()
