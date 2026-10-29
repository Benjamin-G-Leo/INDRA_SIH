"""
Ingestion + processing pipeline:  CSV feeds -> raw landing -> parse -> validate -> spam/relevance filter
-> dedupe -> categorise -> score -> split -> RDBMS (SQLite or MySQL).

  python ingest.py --reset                                                  # SQLite file weather_platform.db
  python ingest.py --reset --db "mysql://root:password@localhost:3306/weather_platform"
  python ingest.py --reset --export data/clean                              # also dump cleaned CSVs

Swap the two read_csv() calls for a Kafka consumer / API poller: everything after "landing" works on dicts.
"""
import argparse, csv, hashlib, json, os, uuid
from collections import Counter
from datetime import datetime, timezone

import processing as P
from db import Database

IMD_COLS = ["record_id", "raw_id", "event_id", "record_type", "bulletin_no", "issued_at_utc", "valid_at_utc", "lead_time_hours",
            "state", "district", "latitude", "longitude", "geo_precision", "hazard_type", "severity", "temp_max_c", "temp_min_c",
            "rainfall_mm_24h", "wind_speed_kmph", "humidity_pct", "visibility_m", "pressure_hpa", "snowfall_cm",
            "lightning_strikes_hr", "hail_size_mm", "river_level_above_danger_m", "metrics_consistent", "description",
            "issuing_centre", "duplicate_count", "qc_flags", "data_split"]
PUB_COLS = ["record_id", "raw_id", "event_id", "source_platform", "source_handle", "posted_at_utc", "text_original", "text_clean",
            "language", "is_repost", "hashtags", "state", "district", "latitude", "longitude", "geo_precision", "followers",
            "likes", "shares", "has_media", "hazard_rule", "hazard_rule_score", "hazard_conf", "hazard_label", "spam_score",
            "relevance_score", "duplicate_count", "corroboration_count", "credibility", "qc_flags", "data_split"]
now = lambda: datetime.now(timezone.utc).replace(tzinfo=None)
fmt = lambda v: v.strftime("%Y-%m-%d %H:%M:%S") if isinstance(v, datetime) else v


def read_csv(path):
    with open(path, newline="", encoding="utf-8-sig") as f: return list(csv.DictReader(f))


def land_raw(db, batch, source_type, rows):
    """Persist untouched payloads first (idempotent via content hash).
    Each new row gets a private '_raw_id' so rows with missing/duplicate record_id are still traceable."""
    seen = {h for (h,) in db.query("SELECT content_hash FROM raw_records")}
    nxt = (db.query("SELECT COALESCE(MAX(raw_id), 0) FROM raw_records")[0][0] or 0) + 1
    new, batch_rows = [], []
    for r in rows:
        h = hashlib.sha1(json.dumps(r, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        if h in seen: continue
        seen.add(h); r["_raw_id"] = nxt; new.append(r)
        batch_rows.append((nxt, batch, source_type, (r.get("record_id") or "")[:40], h, json.dumps(r, ensure_ascii=False), fmt(now()))); nxt += 1
    db.insert("raw_records", ["raw_id", "batch_id", "source_type", "source_record_id", "content_hash", "payload", "ingested_at"], batch_rows)
    return new


def drop_id_conflicts(recs, existing, rej, source_type):
    """First version of a record_id wins (already-loaded or earlier in this batch); later ones are logged, not crashed on."""
    seen, kept = set(existing), []
    for r in recs:
        if r["record_id"] in seen: rej(r["raw_id"], source_type, r["record_id"], "load", "record_id_conflict", r["record_id"], "record_id already loaded; first version kept")
        else: seen.add(r["record_id"]); kept.append(r)
    return kept


def run(a):
    t0 = now(); batch = f"B{t0:%Y%m%d%H%M%S}-{uuid.uuid4().hex[:6]}"
    db = Database(a.db); db.create_schema(reset=a.reset)
    imd_rows, pub_rows = read_csv(a.imd), read_csv(a.public)
    gt = {r["record_id"]: r.get("_gt_noise", "") for r in imd_rows + pub_rows if r.get("record_id")}          # evaluation only
    dup_of = {r["record_id"]: r.get("_gt_dup_of", "") for r in imd_rows + pub_rows if r.get("record_id")}
    stats = Counter(); rejected = []                                                  # (raw_id, type, rid, stage, reason, dup_of, detail)
    rej = lambda raw, typ, rid, st, why, dup=None, det="": rejected.append((raw, typ, rid, st, why, dup, det[:255], fmt(now())))

    # ---- 1. landing
    imd_new = land_raw(db, batch, "IMD", imd_rows)
    pub_new = land_raw(db, batch, "PUBLIC", pub_rows)
    stats["raw_imd_in"], stats["raw_public_in"] = len(imd_new), len(pub_new)
    stats["skipped_already_ingested"] = len(imd_rows) + len(pub_rows) - len(imd_new) - len(pub_new)

    # ---- 2. IMD: parse / validate / dedupe
    imd_ok = []
    for row in imd_new:
        try: rec = P.parse_imd(row); rec["raw_id"] = row["_raw_id"]; imd_ok.append(rec)
        except P.Reject as e: rej(row["_raw_id"], "IMD", row.get("record_id") or "", e.stage, e.reason, None, e.detail)
    imd_ok = drop_id_conflicts(imd_ok, {x for (x,) in db.query("SELECT record_id FROM imd_clean")}, rej, "IMD")
    imd_ok, dups = P.dedupe_imd(imd_ok)
    for r, why, of in dups: rej(r["raw_id"], "IMD", r["record_id"], "dedupe", why, of)

    # ---- 3. public: parse -> spam -> relevance -> dedupe -> categorise -> corroborate -> score
    pubs = []
    for row in pub_new:
        try: rec = P.parse_public(row); rec["raw_id"] = row["_raw_id"]; pubs.append(rec)
        except P.Reject as e: rej(row["_raw_id"], "PUBLIC", row.get("record_id") or "", e.stage, e.reason, None, e.detail)
    pubs = drop_id_conflicts(pubs, {x for (x,) in db.query("SELECT record_id FROM public_clean")}, rej, "PUBLIC")
    survivors, verdicts = [], {}
    for r in pubs:
        r["spam_score"] = P.spam_score(r)
        if r["spam_score"] >= P.SPAM_THRESHOLD:
            rej(r["raw_id"], "PUBLIC", r["record_id"], "spam", "spam", None, f"score={r['spam_score']}"); continue
        h, s, c, evidence = P.classify_hazard(r["text_clean"])
        r["hazard_rule"], r["hazard_rule_score"], r["hazard_conf"] = h, s, c
        r["relevance_score"], verdict = P.relevance(r, evidence)
        if verdict == "irrelevant":
            rej(r["raw_id"], "PUBLIC", r["record_id"], "relevance", "irrelevant", None, f"score={r['relevance_score']}"); continue
        verdicts[r["record_id"]] = verdict; survivors.append(r)
    pubs_ok, dups = P.dedupe_public(survivors, a.near_threshold)
    for r, why, of in dups: rej(r["raw_id"], "PUBLIC", r["record_id"], "dedupe", why, of)
    P.corroborate(pubs_ok)
    for r in pubs_ok:
        r["credibility"] = P.credibility(r, verdicts[r["record_id"]])
        r["qc_flags"] = ",".join(r["_flags"] + (["low_signal"] if verdicts[r["record_id"]] == "low_signal" else []) + (["no_hazard_keyword"] if not r["hazard_rule"] else []))[:255]

    # ---- 4. leakage-free split: whole events go to one split
    for r in imd_ok + pubs_ok: r["data_split"] = P.split_for(r["event_id"] or r["record_id"])

    # ---- 5. load
    row = lambda r, cols: tuple(fmt(r.get(c)) for c in cols)
    db.insert("imd_clean", IMD_COLS, [row(r, IMD_COLS) for r in imd_ok])
    db.insert("public_clean", PUB_COLS, [row(r, PUB_COLS) for r in pubs_ok])
    db.insert("rejected_records", ["raw_id", "source_type", "source_record_id", "stage", "reason", "duplicate_of", "detail", "rejected_at"], rejected)
    stats.update(imd_clean=len(imd_ok), public_clean=len(pubs_ok), rejected=len(rejected))
    report = evaluate(rejected, gt, dup_of, pubs_ok, imd_ok)
    db.insert("pipeline_runs", ["batch_id", "started_at", "finished_at", "stats"], [(batch, fmt(t0), fmt(now()), json.dumps({"counts": stats, "eval": report}, default=str))])
    db.commit()
    show(db, batch, stats, rejected, report, pubs_ok, imd_ok)
    if a.export: export(a.export, imd_ok, pubs_ok, rejected)
    db.close()


def evaluate(rejected, gt, dup_of, pubs_ok, imd_ok):
    """Compare pipeline decisions with the generator's ground truth (sample data only)."""
    removed = {r[2]: r[4] for r in rejected}
    DEDUPE = {"exact_duplicate", "repost_duplicate", "near_duplicate", "duplicate_bulletin"}
    out = {}
    for name, reasons in {"spam": {"spam"}, "irrelevant": {"irrelevant"}}.items():
        truth = {k for k, v in gt.items() if v == name}
        pred = {k for k, v in removed.items() if v in reasons}
        tp = len(truth & pred)
        out[name] = dict(truth=len(truth), flagged=len(pred), recall=round(tp / len(truth), 3) if truth else None, precision=round(tp / len(pred), 3) if pred else None)
    # Duplicates are scored per pair: a copy and its original are "resolved" when at most one of them survives.
    # (Which of two identical rows is kept does not matter, so removing the original instead of the copy is fine.)
    pairs = [(k, dup_of[k]) for k, v in gt.items() if v.startswith("duplicate") and dup_of.get(k)]
    in_pair = {x for p in pairs for x in p}
    resolved = sum(1 for a, b in pairs if a in removed or b in removed)
    pred = {k for k, v in removed.items() if v in DEDUPE}
    out["duplicates"] = dict(truth=len(pairs), flagged=len(pred), recall=round(resolved / len(pairs), 3) if pairs else None,
                             precision=round(len(pred & in_pair) / len(pred), 3) if pred else None)
    lab = [(r["hazard_label"], r["hazard_rule"]) for r in pubs_ok if r["hazard_label"]]
    cls = [(a, b) for a, b in lab if b]
    out["rule_categoriser"] = dict(coverage=round(len(cls) / len(lab), 3) if lab else None, accuracy_on_covered=round(sum(a == b for a, b in cls) / len(cls), 3) if cls else None)
    out["genuine_lost"] = sum(1 for r in rejected if r[2] in gt and gt[r[2]] == "" and r[4] not in DEDUPE and r[4] != "record_id_conflict")
    out["noise_leaked_to_clean"] = sum(1 for r in pubs_ok if gt.get(r["record_id"]) in ("spam", "irrelevant"))
    return out


def show(db, batch, stats, rejected, rep, pubs, imds):
    line = "=" * 64
    print(f"\n{line}\nbatch {batch}\n{line}")
    print(f"raw in      : IMD {stats['raw_imd_in']}  public {stats['raw_public_in']}  (skipped already-ingested: {stats['skipped_already_ingested']})")
    print(f"clean out   : imd_clean {stats['imd_clean']}  public_clean {stats['public_clean']}  rejected {stats['rejected']}")
    print("rejections  :", dict(Counter(f"{r[3]}/{r[4]}" for r in rejected)))
    print("\nfilter quality vs generator ground truth:")
    for k in ("spam", "irrelevant", "duplicates"): print(f"  {k:<11}", rep[k])
    print("  rule categoriser:", rep["rule_categoriser"], "(uncovered posts go to the ML model)")
    print(f"  genuine records wrongly rejected: {rep['genuine_lost']}   noise leaked into clean: {rep['noise_leaked_to_clean']}")
    print("\nsplit sizes :", {t: dict(Counter(r["data_split"] for r in rows)) for t, rows in (("imd", imds), ("public", pubs))})
    print("\nrow counts in database:")
    for t in ("raw_records", "imd_clean", "public_clean", "rejected_records", "pipeline_runs"):
        print(f"  {t:<18}{db.query(f'SELECT COUNT(*) FROM {t}')[0][0]:>6}")
    print("\nhazard coverage (public_clean.hazard_label):", len({r['hazard_label'] for r in pubs if r['hazard_label']}), "of 23; imd:", len({r['hazard_type'] for r in imds}), "of 23")


def export(folder, imds, pubs, rejected):
    os.makedirs(folder, exist_ok=True)
    for name, cols, rows in (("imd_clean", IMD_COLS, imds), ("public_clean", PUB_COLS, pubs)):
        with open(os.path.join(folder, f"{name}.csv"), "w", newline="", encoding="utf-8-sig") as f:
            w = csv.writer(f); w.writerow(cols); w.writerows([[fmt(r.get(c)) for c in cols] for r in rows])
    with open(os.path.join(folder, "rejected_records.csv"), "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f); w.writerow(["raw_id", "source_type", "source_record_id", "stage", "reason", "duplicate_of", "detail", "rejected_at"]); w.writerows(rejected)
    print("exported cleaned CSVs ->", folder)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--imd", default="data/imd_records.csv")
    ap.add_argument("--public", default="data/public_records.csv")
    ap.add_argument("--db", default="sqlite:///weather_platform.db", help="sqlite:///file.db  or  mysql://user:pass@host:3306/dbname")
    ap.add_argument("--reset", action="store_true", help="drop & recreate tables")
    ap.add_argument("--near-threshold", type=float, default=.85)
    ap.add_argument("--export", default="", help="folder to also write cleaned CSVs")
    run(ap.parse_args())
