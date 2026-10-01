"""Validate geoBoundaries India ADM1 GeoJSON against INDRA incident points."""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

PATH = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "AppData/Local/Temp/gb_ind_adm1.geojson"

INCIDENTS = [
    ("Delhi", 77.2090, 28.6139, "Delhi"),
    ("Jaisalmer", 70.9083, 26.9155, "Rajasthan"),
    ("Puri", 85.8312, 19.8135, "Odisha"),
    ("Siliguri", 88.3953, 26.7271, "West Bengal"),
    ("Pune", 73.8567, 18.5204, "Maharashtra"),
    ("Bengaluru", 77.5946, 12.9716, "Karnataka"),
]


def ring_contains(lng: float, lat: float, ring: list) -> bool:
    inside = False
    n = len(ring)
    if n < 3:
        return False
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        intersects = ((yi > lat) != (yj > lat)) and (
            lng < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-16) + xi
        )
        if intersects:
            inside = not inside
        j = i
    return inside


def polygon_contains(lng: float, lat: float, rings: list) -> bool:
    if not rings:
        return False
    if not ring_contains(lng, lat, rings[0]):
        return False
    for hole in rings[1:]:
        if ring_contains(lng, lat, hole):
            return False
    return True


def geom_contains(lng: float, lat: float, geom: dict) -> bool:
    t = geom.get("type")
    coords = geom.get("coordinates") or []
    if t == "Polygon":
        return polygon_contains(lng, lat, coords)
    if t == "MultiPolygon":
        return any(polygon_contains(lng, lat, poly) for poly in coords)
    return False


def iter_coords(geom: dict):
    t = geom.get("type")
    coords = geom.get("coordinates") or []
    if t == "Polygon":
        for ring in coords:
            for pt in ring:
                yield pt
    elif t == "MultiPolygon":
        for poly in coords:
            for ring in poly:
                for pt in ring:
                    yield pt


def feature_name(props: dict) -> str:
    for key in ("shapeName", "shapeNameAlt", "name", "NAME_1", "ST_NM", "NAME"):
        val = props.get(key)
        if val:
            return str(val)
    return ""


def dist_deg(lng: float, lat: float, pt) -> float:
    return math.hypot(lng - pt[0], lat - pt[1])


def nearest_vertex(lng: float, lat: float, geom: dict) -> float:
    best = 1e9
    for pt in iter_coords(geom):
        d = dist_deg(lng, lat, pt)
        if d < best:
            best = d
    return best


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    print("file", PATH, "bytes", PATH.stat().st_size)
    data = json.loads(PATH.read_text(encoding="utf-8"))
    print("type", data.get("type"))
    print("crs", json.dumps(data.get("crs")))
    feats = data.get("features") or []
    print("feature_count", len(feats))

    names = []
    types = {}
    min_lng = min_lat = 1e9
    max_lng = max_lat = -1e9
    sample_ok = 0
    swapped_suspect = 0

    for f in feats:
        geom = f.get("geometry") or {}
        types[geom.get("type")] = types.get(geom.get("type"), 0) + 1
        nm = feature_name(f.get("properties") or {})
        names.append(nm)
        props_keys = sorted((f.get("properties") or {}).keys())
        for pt in iter_coords(geom):
            if len(pt) < 2:
                continue
            lng, lat = pt[0], pt[1]
            if abs(lng) <= 90 and abs(lat) > 90:
                swapped_suspect += 1
            min_lng, max_lng = min(min_lng, lng), max(max_lng, lng)
            min_lat, max_lat = min(min_lat, lat), max(max_lat, lat)
            if sample_ok == 0:
                sample_ok = 1

    print("geometry_types", types)
    print("property_keys", props_keys)
    print("names")
    for n in sorted(names):
        print(" -", n.encode("utf-8", "replace").decode("utf-8"))
    print("bbox_lng", min_lng, max_lng)
    print("bbox_lat", min_lat, max_lat)
    print("swapped_coord_suspects", swapped_suspect)

    print("point_in_polygon")
    for label, lng, lat, expected in INCIDENTS:
        hits = [feature_name(f.get("properties") or {}) for f in feats if geom_contains(lng, lat, f.get("geometry") or {})]
        nearest = []
        for f in feats:
            nm = feature_name(f.get("properties") or {})
            if expected.lower() in nm.lower() or nm.lower() in expected.lower():
                nearest.append((nm, nearest_vertex(lng, lat, f.get("geometry") or {})))
        print(f"  {label} ({lng},{lat}) expected={expected} hits={hits} named_feature_nearest_deg={nearest}")


if __name__ == "__main__":
    main()
