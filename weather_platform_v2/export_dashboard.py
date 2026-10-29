"""
Turn the cleaned database into the JSON file the dashboard reads (schema 1.0.0, see dashboard_prototype_2/lib/types.ts).

  python ingest.py --reset            # once: fills weather_platform.db
  python train_classifier.py          # optional: lets the ML model label posts the rules miss
  python export_dashboard.py          # writes ../dashboard_prototype_2/public/data/indra-dataset.json

How an incident is built (the pipeline never looks at ground-truth columns like event_id or hazard_label):
  1. every clean public post gets a hazard: the rule tag if a rule fired, else the ML model's guess
  2. posts with the same state + hazard are chained into one incident while no gap between posts exceeds --gap-hours
  3. an IMD record for the same state + hazard whose valid time falls in the incident window "verifies" it:
     severity comes from the IMD colour, status becomes Verified, and the reading (temperature, rainfall ...) is shown
  4. incidents with 2+ posts or an IMD match are kept; the best --max-incidents are exported
  5. confidence = mean post credibility x 100 (same formula as the dashboard's prototype fixture)
Everything is marked isSynthetic while the inputs are generated data.
"""
import argparse, json, os, sqlite3
from collections import Counter
from datetime import datetime, timedelta, timezone


SCHEMA_VERSION = "1.0.0"
SEV_MAP = {"Red": "critical", "Orange": "high", "Yellow": "moderate", "Green": "low"}
SEV_RANK = {"critical": 3, "high": 2, "moderate": 1, "low": 0, None: -1}
SOURCE_KIND = {"twitter_x": "social_media", "facebook": "social_media", "youtube_comment": "social_media",
               "news_portal": "news", "whatsapp_forward": "messaging", "citizen_app": "citizen_app"}
RAIN = {"Heavy Rainfall", "Very Heavy Rainfall", "Extremely Heavy Rainfall", "Flood"}
WIND = {"Cyclone", "Extreme Wind", "Strong Surface Winds", "Squall", "Dust Storm", "Dust-Raising Winds"}
HEAT = {"Heatwave", "Hot Day", "Hot & Humid", "Warm Night"}
COLD = {"Cold Wave", "Cold Day", "Ground Frost"}
DATA_SOURCE = "synthetic_pipeline"


def parse_dt(s): return datetime.strptime(s, "%Y-%m-%d %H:%M:%S")
def iso(dt): return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
def season(m): return "Winter" if m in (12, 1, 2) else "Pre-monsoon" if m in (3, 4, 5) else "Monsoon" if m in (6, 7, 8, 9) else "Post-monsoon"


def load_posts(db, use_model):
    posts = [dict(r) for r in db.execute("SELECT * FROM public_clean WHERE state IS NOT NULL AND state<>'' AND latitude IS NOT NULL")]
    for p in posts: p["hazard"] = p["hazard_rule"] or None
    missing = [p for p in posts if not p["hazard"]]
    if missing and use_model:
        try:
            from train_classifier import load_model, predict
            for p, (h, _) in zip(missing, predict(load_model(), [p["text_original"] for p in missing])): p["hazard"] = h
        except Exception as e:  # no model trained / scikit-learn missing -> rules only
            print(f"note: ML model not used ({type(e).__name__}); posts without a rule tag are skipped")
    return [p for p in posts if p["hazard"]]


def cluster(posts, gap_hours):
    groups = {}
    for p in sorted(posts, key=lambda p: p["posted_at_utc"]): groups.setdefault((p["state"], p["hazard"]), []).append(p)
    out = []
    for (state, hazard), g in groups.items():
        cur = [g[0]]
        for p in g[1:]:
            if parse_dt(p["posted_at_utc"]) - parse_dt(cur[-1]["posted_at_utc"]) > timedelta(hours=gap_hours): out.append((state, hazard, cur)); cur = []
            cur.append(p)
        out.append((state, hazard, cur))
    return out


def reading(hazard, imd):
    f = lambda v, fmt: fmt.format(v) if v is not None else None
    if hazard in HEAT: return f(imd["temp_max_c"], "{:.1f}°C")
    if hazard in COLD: return f(imd["temp_min_c"], "{:.1f}°C")
    if hazard in RAIN: return f(imd["rainfall_mm_24h"], "{:.0f} mm")
    if hazard in WIND: return f(imd["wind_speed_kmph"], "{:.0f} km/h")
    if hazard == "Fog": return f(imd["visibility_m"], "{:.0f} m visibility")
    if hazard == "Heavy Snowfall": return f(imd["snowfall_cm"], "{:.0f} cm")
    return None


def build(db, max_incidents=60, gap_hours=6, window_hours=6, use_model=True):
    db.row_factory = sqlite3.Row
    imd_rows = [dict(r) for r in db.execute("SELECT * FROM imd_clean")]
    imd_by = {}
    for r in imd_rows: imd_by.setdefault((r["state"], r["hazard_type"]), []).append(r)

    cands = []
    for state, hazard, g in cluster(load_posts(db, use_model), gap_hours):
        t0, t1 = parse_dt(g[0]["posted_at_utc"]), parse_dt(g[-1]["posted_at_utc"])
        near = [r for r in imd_by.get((state, hazard), []) if t0 - timedelta(hours=window_hours) <= parse_dt(r["valid_at_utc"]) <= t1 + timedelta(hours=window_hours)]
        if len(g) < 2 and not near: continue
        conf = round(sum(p["credibility"] or .5 for p in g) / len(g) * 100)
        sev = max((SEV_MAP.get(r["severity"]) for r in near), key=lambda s: SEV_RANK[s], default=None)
        cands.append(dict(state=state, hazard=hazard, posts=g, imd=near, t0=t0, t1=t1, conf=conf, sev=sev,
                          score=(len(g) + (3 if near else 0), conf)))
    cands = sorted(cands, key=lambda c: c["score"], reverse=True)[:max_incidents]
    cands.sort(key=lambda c: (c["t0"], c["state"], c["hazard"]))

    incidents, alerts, source_records, seen_imd = [], [], [], set()
    for n, c in enumerate(cands, 1):
        iid, eid = f"INC-{n:04d}", f"EVT-{n:04d}"
        g = c["posts"]
        district = Counter(p["district"] for p in g if p["district"]).most_common(1)
        district = district[0][0] if district else None
        verified = bool(c["imd"]) and c["conf"] >= 50
        inc = dict(incidentId=iid, linkedEventId=eid, eventType=c["hazard"], place=district or c["state"], state=c["state"],
                   latitude=round(sum(p["latitude"] for p in g) / len(g), 4), longitude=round(sum(p["longitude"] for p in g) / len(g), 4),
                   observedAt=iso(c["t0"]), updatedAt=iso(max([c["t1"]] + [parse_dt(r["valid_at_utc"]) for r in c["imd"]])),
                   confidence=c["conf"], sourceCount=len(g), supportingSourceIds=[p["record_id"] for p in g],
                   status="Verified" if verified else "Detected",
                   dataSource=DATA_SOURCE + ("+imd" if c["imd"] else ""), isSynthetic=True)
        if district: inc["district"] = district
        if c["sev"]: inc["severity"] = c["sev"]
        ranked = sorted(c["imd"], key=lambda r: SEV_RANK[SEV_MAP.get(r["severity"])], reverse=True)
        val = next((v for v in (reading(c["hazard"], r) for r in ranked) if v), None)   # first matched bulletin that has the reading
        if val: inc["value"] = val
        incidents.append(inc)

        if c["sev"] in ("critical", "high", "moderate"):   # operational alerts only where an official (IMD) severity backs them
            where = f"{inc['place']}, {c['state']}" if district else c["state"]
            alerts.append(dict(alertId=f"ALERT-{iid}", incidentId=iid, severity=c["sev"], eventType=c["hazard"], place=inc["place"], time=inc["updatedAt"],
                               text=f"{c['hazard']} reported in {where}. {len(g)} public report{'s' if len(g) != 1 else ''}"
                                    f"{' verified against an IMD bulletin' if verified else ' matched with an IMD bulletin'}"
                                    f"{' (' + val + ')' if val else ''}.",
                               confidence=f"{c['conf']}%", source=inc["dataSource"], status=inc["status"],
                               createdAt=inc["observedAt"], updatedAt=inc["updatedAt"], isSynthetic=True))

        for p in g:
            low = "low_signal" in (p["qc_flags"] or "")
            source_records.append(dict(
                kind="public", sourceRecordId=p["record_id"], source=p["source_platform"], sourceKind=SOURCE_KIND.get(p["source_platform"], "other"),
                authorHandle=p["source_handle"], authorVerified=False, authorFollowers=p["followers"], language=p["language"],
                text=p["text_clean"], hashtags=["#" + h for h in (p["hashtags"] or "").split(",") if h],
                postedAt=iso(parse_dt(p["posted_at_utc"])), state=p["state"], locality=p["district"], latitude=p["latitude"], longitude=p["longitude"],
                likes=p["likes"], reposts=p["shares"], disasterTypeClaimed=p["hazard"], isRealCrisis=not low, label="rumour" if low else "real",
                linkedEventId=eid, credibilityScore=p["credibility"], urgency="high" if p["corroboration_count"] >= 3 else "medium" if p["corroboration_count"] >= 1 else "low",
                dataSource=DATA_SOURCE, isSynthetic=True))
        for r in c["imd"]:
            if r["record_id"] in seen_imd: continue
            seen_imd.add(r["record_id"]); v = parse_dt(r["valid_at_utc"]); ist = v + timedelta(hours=5, minutes=30)
            rec = dict(kind="imd", recordId=r["record_id"], observationDate=ist.strftime("%Y-%m-%d"), observationTimeIst=ist.strftime("%H:%M"),
                       year=ist.year, month=ist.month, season=season(ist.month), stationId="IMD-" + (r["district"] or r["state"]).upper().replace(" ", "-")[:12],
                       stationName=r["district"] or r["state"], state=r["state"], district=r["district"] or "", latitude=r["latitude"], longitude=r["longitude"],
                       disasterType=r["hazard_type"], allHazards=[r["hazard_type"]], dataSource=DATA_SOURCE + "_imd", isSynthetic=True)
            for k, col in (("tempMaxC", "temp_max_c"), ("tempMinC", "temp_min_c"), ("rainfallMm", "rainfall_mm_24h")):
                if r[col] is not None: rec[k] = r[col]
            if SEV_MAP.get(r["severity"]): rec["imdAlertColor"] = (r["severity"] or "").lower()
            source_records.append(rec)

    return dict(schemaVersion=SCHEMA_VERSION, generatedAt=iso(datetime.now(timezone.utc).replace(tzinfo=None)),
                incidents=incidents, sourceRecords=source_records, alerts=alerts)


def main(a):
    if not os.path.exists(a.db): raise SystemExit(f"{a.db} not found - run  python ingest.py --reset  first")
    ds = build(sqlite3.connect(a.db), a.max_incidents, a.gap_hours, a.window_hours, not a.no_model)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as f: json.dump(ds, f, ensure_ascii=False, indent=1)
    sev = Counter(i.get("severity", "none") for i in ds["incidents"])
    print(f"wrote {a.out}\n  incidents {len(ds['incidents'])} (severity {dict(sev)}), alerts {len(ds['alerts'])}, source records {len(ds['sourceRecords'])}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default="weather_platform.db")
    ap.add_argument("--out", default=os.path.join("..", "dashboard_prototype_2", "public", "data", "indra-dataset.json"))
    ap.add_argument("--max-incidents", type=int, default=60)
    ap.add_argument("--gap-hours", type=float, default=6, help="max silence between posts of one incident")
    ap.add_argument("--window-hours", type=float, default=6, help="IMD record may fall this far outside the post window")
    ap.add_argument("--no-model", action="store_true", help="rule tags only")
    main(ap.parse_args())
