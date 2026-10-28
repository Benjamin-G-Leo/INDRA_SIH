"""Parsing, validation, spam / relevance filtering, deduplication, hazard categorisation, scoring."""
import hashlib, html, re, unicodedata
from bisect import bisect_left, bisect_right
from datetime import datetime, timedelta, timezone

from lexicons import (GEO, HAZARDS, STATE_ALIASES, DISTRICT_ALIASES, PATTERNS, GENERIC_WEATHER, IMPACT_CUES,
                      QUANTITY, NEGATIVE_CONTEXT, SHORTENERS, SPAM_PHRASES, PHONE, normalize_hazard)

IST = timezone(timedelta(hours=5, minutes=30))


class Reject(Exception):
    def __init__(self, stage, reason, detail=""):
        super().__init__(reason); self.stage, self.reason, self.detail = stage, reason, detail


# =========================================================================== timestamps / numbers
_FORMATS = ["%d-%m-%Y %H:%M", "%d-%m-%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d %b %Y %H:%M", "%Y/%m/%d %H:%M:%S",
            "%a %b %d %H:%M:%S %z %Y", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"]


def parse_timestamp(s):
    """Any common format -> naive UTC datetime.  Naive inputs are assumed IST."""
    if s is None: return None
    s = str(s).strip()
    if not s: return None
    if re.fullmatch(r"\d{10}(\.\d+)?", s): dt = datetime.fromtimestamp(float(s), tz=timezone.utc)
    elif re.fullmatch(r"\d{13}", s): dt = datetime.fromtimestamp(int(s) / 1000, tz=timezone.utc)
    else:
        s2 = re.sub(r"\s*IST$", "", s, flags=re.I); dt = None
        for f in _FORMATS:
            try: dt = datetime.strptime(s2, f); break
            except ValueError: pass
        if dt is None:
            try: dt = datetime.fromisoformat(s2)
            except ValueError: return None
        if dt.tzinfo is None: dt = dt.replace(tzinfo=IST)
    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    return dt if datetime(2000, 1, 1) <= dt <= now + timedelta(days=366) else None


_NUM = re.compile(r"^\s*([-+]?\d+(?:[.,]\d+)?)\s*([a-zA-Z°/ ]*)\s*$")
_NULLS = {"", "na", "n/a", "nan", "null", "none", "-", "--", "m", "missing"}


def parse_number(v, kind="x"):
    """'44.6 °C' / '112F' / '31 kt' / '12 cm' -> float in canonical units (°C, mm, km/h, cm, m)."""
    if v is None: return None
    s = str(v).strip()
    if s.lower() in _NULLS: return None
    m = _NUM.match(s)
    if not m: return None
    x = float(m.group(1).replace(",", "."))
    u = (m.group(2) or "").lower().replace("°", "").replace(" ", "")
    if kind == "temp":
        if u in ("f", "degf"): x = (x - 32) * 5 / 9
        elif u == "k": x -= 273.15
    elif kind == "rain":
        if u == "cm": x *= 10
        elif u in ("in", "inch", "inches"): x *= 25.4
    elif kind == "wind":
        if u in ("kt", "kts", "knot", "knots"): x *= 1.852
        elif u in ("m/s", "ms", "mps"): x *= 3.6
    elif kind == "vis" and u == "km": x *= 1000
    elif kind == "snow":
        if u == "mm": x /= 10
        elif u == "m": x *= 100
    return round(x, 2)


RANGES = {"temp_max_c": (-45, 56), "temp_min_c": (-60, 45), "rainfall_mm_24h": (0, 1500), "wind_speed_kmph": (0, 350),
          "humidity_pct": (0, 100), "visibility_m": (0, 50000), "pressure_hpa": (850, 1085), "snowfall_cm": (0, 500),
          "lightning_strikes_hr": (0, 2000), "hail_size_mm": (0, 150), "river_level_above_danger_m": (-20, 30)}
KINDS = {"temp_max_c": "temp", "temp_min_c": "temp", "rainfall_mm_24h": "rain", "wind_speed_kmph": "wind",
         "visibility_m": "vis", "snowfall_cm": "snow"}


# =========================================================================== geography
def _k(s): return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9& ]+", " ", str(s).lower())).strip()


STATE_LOOKUP = {_k(s): s for s in GEO}
STATE_LOOKUP.update({_k(a): c for a, c in STATE_ALIASES.items()})
DIST_LOOKUP = {_k(d): (s, d) for s, ds in GEO.items() for d in ds}
DIST_LOOKUP.update({_k(a): next((s, d) for s, ds in GEO.items() for d in ds if d == c) for a, c in DISTRICT_ALIASES.items()})
_names = sorted(list(DIST_LOOKUP) + [_k(s) for s in GEO], key=len, reverse=True)
_GAZ = re.compile(r"(?<![a-z0-9])(" + "|".join(re.escape(n) for n in _names) + r")(?![a-z0-9])", re.I)
INDIA = (6.0, 37.6, 68.0, 97.5)  # lat_min, lat_max, lon_min, lon_max


def norm_state(x): return STATE_LOOKUP.get(_k(x)) if x else None
def norm_district(x): return DIST_LOOKUP.get(_k(x)) if x else None


AMBIGUOUS_PLACES = {"gaya", "puri", "surat"}   # also ordinary Hinglish/Hindi words ("bhar gaya", "puri sabzi", "surat")


def find_place(text):
    """Gazetteer lookup in free text -> (state, district|None).
    Ambiguous names only count when Capitalised in mixed-case text."""
    state_hit = None
    for m in _GAZ.finditer(text):
        g = m.group(1); key = _k(g)
        if key in AMBIGUOUS_PLACES and not (g[0].isupper() and not text.isupper()): continue
        if key in DIST_LOOKUP: return DIST_LOOKUP[key]
        if state_hit is None and key in STATE_LOOKUP: state_hit = (STATE_LOOKUP[key], None)
    return state_hit or (None, None)


def valid_coord(lat, lon):
    return lat is not None and lon is not None and INDIA[0] <= lat <= INDIA[1] and INDIA[2] <= lon <= INDIA[3]


def to_float(x):
    try: return float(str(x).strip()) if str(x).strip() != "" else None
    except ValueError: return None


def resolve_geo(state_raw, dist_raw, lat_raw, lon_raw, text=""):
    """Return state, district, lat, lon, geo_precision, flags."""
    flags = []
    st = norm_state(state_raw); d = norm_district(dist_raw)
    if d and (st is None or st == d[0]): st, dist = d[0], d[1]
    elif d and st != d[0]: dist = None; flags.append("state_district_mismatch")
    else: dist = None
    if (st is None or dist is None) and text:
        ps, pd_ = find_place(text)
        if st is None and ps: st = ps; flags.append("state_from_text")
        if dist is None and pd_ and ps == st: dist = pd_; flags.append("district_from_text")
    lat, lon = to_float(lat_raw), to_float(lon_raw)
    prec = "gps"
    if lat is not None and lon is not None and not valid_coord(lat, lon):
        if valid_coord(lon, lat): lat, lon = lon, lat; flags.append("latlon_swapped")
        else: lat = lon = None; flags.append("bad_coordinates")
    if lat is None or lon is None:
        if st and dist: lat, lon = GEO[st][dist]; prec = "district_centroid"
        elif st: vals = list(GEO[st].values()); lat = sum(v[0] for v in vals) / len(vals); lon = sum(v[1] for v in vals) / len(vals); prec = "state_centroid"
        else: lat = lon = None; prec = "unknown"
    return st, dist, lat, lon, prec, flags


# =========================================================================== text cleaning
URL_RE = re.compile(r"https?://\S+|\b(?:bit\.ly|tinyurl\.com|cutt\.ly|rb\.gy|is\.gd|t\.me|wa\.me|goo\.gl|shorturl\.at)/\S+", re.I)
EMOJI_RE = re.compile("[\U0001F000-\U0001FAFF\u2600-\u27BF\uFE0F\u200d\u2B50\u2B06\u2194-\u21AA]")
BOILER = re.compile(r"\b(breaking|update|now|just now|ground report|live|pls share|please share( to all)?|staff reporter|our bureau|forwarded( many times)?)\b:?", re.I)
HING = set("hai hain mein raha rahi rahe bahut aaj nahi gaya gayi gaye bhari barish garmi thand hawa tez sadak madad chahiye kuch dikh toh aur saath neend ka ki ke aaya baadh kohra pala aandhi toofan me".split()) - {"me"}


def clean_text(raw):
    t = unicodedata.normalize("NFKC", html.unescape(str(raw)))
    f = {}
    f["is_repost"] = bool(re.match(r"^\s*RT\s+@\w+:?\s*", t, re.I)) or bool(re.search(r"forwarded( many times)?", t, re.I))
    t = re.sub(r"^\s*RT\s+@\w+:?\s*", "", t, flags=re.I)
    t = re.sub(r"forwarded( many times)?:?\s*", "", t, flags=re.I)
    urls = URL_RE.findall(t); t = URL_RE.sub(" ", t)
    f["urls"] = urls
    t = re.sub(r"@\w+", " ", t)
    tags = re.findall(r"#(\w+)", t)
    f["hashtags"] = tags
    letters = [c for c in t if c.isalpha()]
    f["caps_ratio"] = sum(c.isupper() for c in letters) / len(letters) if letters else 0
    f["n_letters"] = len(letters)
    f["emoji"] = len(EMOJI_RE.findall(t))
    f["punct_burst"] = bool(re.search(r"[!?]{3,}", t))
    no_tag = re.sub(r"#\w+", " ", t)
    t = re.sub(r"#(\w+)", r"\1", t)
    clean = re.sub(r"\s+", " ", EMOJI_RE.sub(" ", t)).strip()
    norm = EMOJI_RE.sub(" ", no_tag).lower()
    norm = BOILER.sub(" ", norm)
    norm = re.sub(r"[^\w\s\u0900-\u097F]", " ", norm)
    f["text_norm"] = re.sub(r"\s+", " ", norm).strip()
    f["text_clean"] = clean
    return f


def detect_language(text):
    letters = [c for c in text if c.isalpha()]
    if not letters: return "und"
    if sum("\u0900" <= c <= "\u097F" for c in letters) >= 4: return "hi"   # Latin place names/hashtags dilute any ratio test
    toks = re.findall(r"[a-z]+", text.lower())
    return "hi-Latn" if sum(w in HING for w in toks) >= 2 else "en"


# =========================================================================== IMD
SEV_MAP = {"green": "Green", "yellow": "Yellow", "orange": "Orange", "red": "Red"}


def _consistent(h, m):
    r, tx, tn, vis, sn = m["rainfall_mm_24h"], m["temp_max_c"], m["temp_min_c"], m["visibility_m"], m["snowfall_cm"]
    rng = {"Heavy Rainfall": (64.5, 115.5), "Very Heavy Rainfall": (115.6, 204.4), "Extremely Heavy Rainfall": (204.5, 1e9)}
    if h in rng and r is not None: return int(rng[h][0] * .85 <= r <= rng[h][1] * 1.15)
    if h == "Heatwave" and tx is not None: return int(tx >= 38)
    if h == "Cold Wave" and tn is not None: return int(tn <= 5)
    if h == "Fog" and vis is not None: return int(vis <= 1000)
    if h == "Heavy Snowfall" and sn is not None: return int(sn >= 5)
    return None


def parse_imd(row):
    rid = (row.get("record_id") or "").strip()
    if not rid: raise Reject("parse", "missing_record_id")
    hz = normalize_hazard(row.get("hazard_type"))
    if not hz: raise Reject("parse", "unknown_hazard", str(row.get("hazard_type"))[:80])
    valid = parse_timestamp(row.get("valid_at"))
    if valid is None: raise Reject("parse", "bad_valid_timestamp", str(row.get("valid_at"))[:80])
    issued = parse_timestamp(row.get("issued_at")); flags = []
    if issued is None: issued = valid; flags.append("issued_at_imputed")
    st, dist, lat, lon, prec, gf = resolve_geo(row.get("state"), row.get("district"), row.get("latitude"), row.get("longitude"))
    flags += gf
    if st is None: raise Reject("validate", "unknown_location", f"{row.get('state')}/{row.get('district')}")
    rtype = (row.get("record_type") or "").strip().lower()
    if rtype not in ("observation", "warning"): rtype = "observation"; flags.append("record_type_defaulted")
    sev = next((v for k, v in SEV_MAP.items() if k in str(row.get("severity", "")).lower()), None)
    m = {}
    for col in RANGES:
        v = parse_number(row.get(col), KINDS.get(col, "x"))
        lo, hi = RANGES[col]
        if v is not None and not (lo <= v <= hi): flags.append(f"out_of_range:{col}"); v = None
        m[col] = v
    if m["temp_max_c"] is not None and m["temp_min_c"] is not None and m["temp_max_c"] < m["temp_min_c"]:
        m["temp_max_c"], m["temp_min_c"] = m["temp_min_c"], m["temp_max_c"]; flags.append("tmax_tmin_swapped")
    out = dict(record_id=rid, event_id=(row.get("event_id") or None), record_type=rtype, bulletin_no=(row.get("bulletin_no") or "")[:40],
               issued_at_utc=issued, valid_at_utc=valid, lead_time_hours=round((valid - issued).total_seconds() / 3600, 2),
               state=st, district=dist, latitude=lat, longitude=lon, geo_precision=prec, hazard_type=hz, severity=sev,
               description=(row.get("description") or "").strip(), issuing_centre=(row.get("issuing_centre") or "")[:30],
               metrics_consistent=_consistent(hz, m), duplicate_count=0, **m)
    out["qc_flags"] = ",".join(flags)[:255]
    return out


def dedupe_imd(recs):
    """Bulletins re-sent with new bulletin numbers: same place + hazard + valid time + type => keep earliest."""
    kept, seen, dups = [], {}, []
    for r in sorted(recs, key=lambda r: (r["issued_at_utc"], r["record_id"])):
        key = (r["state"], r["district"], r["hazard_type"], r["valid_at_utc"], r["record_type"])
        if key in seen:
            seen[key]["duplicate_count"] += 1; dups.append((r, "duplicate_bulletin", seen[key]["record_id"]))
        else: seen[key] = r; kept.append(r)
    return kept, dups


# =========================================================================== public posts
SOURCE_MAP = {"twitter": "twitter_x", "x": "twitter_x", "tweet": "twitter_x", "twitter_x": "twitter_x", "facebook": "facebook",
              "fb": "facebook", "news": "news_portal", "news_portal": "news_portal", "citizen_app": "citizen_app",
              "whatsapp": "whatsapp_forward", "whatsapp_forward": "whatsapp_forward", "youtube": "youtube_comment",
              "youtube_comment": "youtube_comment"}
SOURCE_TRUST = {"news_portal": .75, "citizen_app": .55, "facebook": .45, "twitter_x": .40, "youtube_comment": .30, "whatsapp_forward": .25}


def to_int(x, default=0):
    try: return max(0, int(float(str(x).strip())))
    except (ValueError, TypeError): return default


def parse_public(row):
    rid = (row.get("record_id") or "").strip()
    if not rid: raise Reject("parse", "missing_record_id")
    raw = row.get("text") or ""
    if len(raw.strip()) < 5: raise Reject("parse", "empty_text")
    posted = parse_timestamp(row.get("posted_at"))
    if posted is None: raise Reject("parse", "bad_timestamp", str(row.get("posted_at"))[:80])
    f = clean_text(raw)
    if len(f["text_clean"]) < 5: raise Reject("parse", "empty_after_cleaning")
    st, dist, lat, lon, prec, flags = resolve_geo(row.get("state"), row.get("district"), row.get("latitude"), row.get("longitude"), f["text_clean"])
    src = SOURCE_MAP.get(_k(row.get("source", "")).replace(" ", "_"), "other")
    return dict(record_id=rid, event_id=(row.get("event_id") or None), source_platform=src, source_handle=(row.get("source_handle") or "")[:60],
                posted_at_utc=posted, text_original=raw, text_clean=f["text_clean"], text_norm=f["text_norm"], language=detect_language(f["text_clean"]),
                is_repost=int(f["is_repost"]), hashtags=",".join(f["hashtags"])[:255], state=st, district=dist, latitude=lat, longitude=lon,
                geo_precision=prec, followers=to_int(row.get("followers")), likes=to_int(row.get("likes")), shares=to_int(row.get("shares")),
                has_media=to_int(row.get("has_media")), hazard_label=(normalize_hazard(row.get("hazard_label")) if row.get("hazard_label") else None),
                duplicate_count=0, corroboration_count=0, _feat=f, _flags=flags)


# ---------------------------------------------------------------- spam
def spam_score(r):
    f, txt = r["_feat"], r["text_original"]
    s = 0.0
    if SHORTENERS.search(txt): s += 2
    k = len({m.group(0).lower() for m in SPAM_PHRASES.finditer(txt)}); s += min(k, 3) * 1.5
    if PHONE.search(txt): s += 2
    if len(f["hashtags"]) >= 4: s += 1
    if f["caps_ratio"] > .6 and f["n_letters"] >= 15: s += 1
    if f["punct_burst"]: s += 1
    if f["emoji"] >= 6: s += 1
    if r["followers"] < 20 and r["shares"] > 200: s += 1
    return s


SPAM_THRESHOLD = 3.0


# ---------------------------------------------------------------- hazard categorisation + relevance
_RAIN = re.compile(r"(\d+(?:\.\d+)?)\s*mm")


def classify_hazard(text):
    """Rule-based multilingual categoriser.  Returns (hazard|None, score, confidence, strong_hits)."""
    t = text.lower()
    sc = {h: 0.0 for h in HAZARDS}; hits = 0; weak = False
    for h, pats in PATTERNS.items():
        for rx, w in pats:
            if rx.search(t):
                sc[h] += w
                if w >= 2: hits += 1
                else: weak = True
    fam = ["Heavy Rainfall", "Very Heavy Rainfall", "Extremely Heavy Rainfall"]
    best = next((h for h in reversed(fam) if sc[h] >= 3), None)
    mm = _RAIN.search(t)
    if best and mm:
        v = float(mm.group(1))
        if v >= 204.5: best = fam[2]
        elif v >= 115.6: best = fam[1]
        elif v >= 64.5: best = fam[0]
    if best:
        top = max(sc[h] for h in fam)
        for h in fam: sc[h] = 0
        sc[best] = max(top, 3)
    if sc["Thunderstorm"] >= 2 and sc["Lightning"] >= 3:
        sc["Thunderstorm & Lightning"] = sc["Thunderstorm"] + sc["Lightning"]; sc["Thunderstorm"] = sc["Lightning"] = 0
    ranked = sorted(sc.items(), key=lambda kv: -kv[1])
    (h1, s1), (_, s2) = ranked[0], ranked[1]
    if s1 < 3: return None, s1, 0.0, (hits, weak)
    return h1, s1, round(s1 / (s1 + s2 + 1.0), 2), (hits, weak)


def relevance(r, evidence):
    """Score how likely the post is a real weather report.  Returns (score, verdict).
    verdict: relevant | low_signal (kept, flagged, lower credibility) | irrelevant (rejected)."""
    strong, weak = evidence
    t = r["text_clean"]
    hits = min(strong, 2)
    generic = bool(GENERIC_WEATHER.search(t)) or weak
    pos = hits + (1 if hits == 0 and generic else 0)
    pos += 1 if QUANTITY.search(t) else 0
    pos += 1 if IMPACT_CUES.search(t) else 0
    pos += 1 if r["state"] else 0
    neg = min(len(NEGATIVE_CONTEXT.findall(t)), 2)
    score = pos - neg
    if neg and score < 2: return score, "irrelevant"           # figurative / entertainment use of a weather word
    if hits == 0 and not generic:                               # no weather vocabulary at all
        return score, ("low_signal" if pos >= 2 else "irrelevant")  # e.g. "cars floating, need rescue" + a place
    return score, ("low_signal" if pos == 1 else "relevant")


# ---------------------------------------------------------------- dedupe
def _jaccard(a, b):
    return len(a & b) / len(a | b) if a and b else 0.0


def _tri(s):
    s = s.replace(" ", "")
    return {s[i:i + 3] for i in range(len(s) - 2)}


def dedupe_public(recs, near_threshold=.85):
    """exact (same handle+text) -> repost (same text, other handle) -> near-duplicate (token Jaccard)."""
    kept, dups = [], []
    exact, same_text, buckets = {}, {}, {}
    for r in sorted(recs, key=lambda r: (r["posted_at_utc"], r["record_id"])):
        tn = r["text_norm"]; toks = set(tn.split()); r["_toks"] = toks; r["_tri"] = _tri(tn)
        r["_nums"] = frozenset(re.findall(r"\d+(?:\.\d+)?", tn))
        compat = lambda o: not ((o["state"] and r["state"] and o["state"] != r["state"]) or (o["district"] and r["district"] and o["district"] != r["district"]))
        orig, why = None, None
        if (r["source_handle"], tn) in exact: orig, why = exact[(r["source_handle"], tn)], "exact_duplicate"
        elif tn in same_text and compat(same_text[tn]): orig, why = same_text[tn], "repost_duplicate"
        elif len(toks) >= 6:
            day = r["posted_at_utc"].date()
            for d in (day, day - timedelta(days=1)):
                for o in buckets.get(d, []):
                    if compat(o) and o["_nums"] == r["_nums"] and max(_jaccard(toks, o["_toks"]), _jaccard(r["_tri"], o["_tri"])) >= near_threshold:
                        orig, why = o, "near_duplicate"; break
                if orig: break
        if orig is not None:
            orig["duplicate_count"] += 1; dups.append((r, why, orig["record_id"])); continue
        kept.append(r); exact[(r["source_handle"], tn)] = r; same_text.setdefault(tn, r)
        buckets.setdefault(r["posted_at_utc"].date(), []).append(r)
    return kept, dups


# ---------------------------------------------------------------- corroboration + credibility
def corroborate(recs, window_h=3):
    """Number of OTHER distinct handles reporting the same hazard in the same state within +/- window_h."""
    groups = {}
    for r in recs:
        if r["hazard_rule"] and r["state"]: groups.setdefault((r["state"], r["hazard_rule"]), []).append(r)
    for g in groups.values():
        g.sort(key=lambda r: r["posted_at_utc"]); times = [r["posted_at_utc"] for r in g]
        for r in g:
            lo = bisect_left(times, r["posted_at_utc"] - timedelta(hours=window_h))
            hi = bisect_right(times, r["posted_at_utc"] + timedelta(hours=window_h))
            r["corroboration_count"] = len({o["source_handle"] for o in g[lo:hi]} - {r["source_handle"]})


def credibility(r, verdict):
    s = SOURCE_TRUST.get(r["source_platform"], .3)
    s += .10 if r["geo_precision"] == "gps" else .05 if r["geo_precision"] == "district_centroid" else 0
    s += .10 if r["has_media"] else 0
    s += min(.2, .05 * r["corroboration_count"])
    s += .05 if r["followers"] > 1000 else 0
    s += .10 if QUANTITY.search(r["text_clean"]) else 0
    s -= .15 if verdict == "low_signal" else 0
    return round(max(0.0, min(1.0, s)), 3)


def split_for(key, train=70, val=15):
    b = int(hashlib.md5(str(key).encode()).hexdigest(), 16) % 100
    return "train" if b < train else "val" if b < train + val else "test"
