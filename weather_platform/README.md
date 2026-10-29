# India Weather & Disaster Platform: sample dataset + ingestion layer

Python 3.10+. SQLite works with no setup; MySQL needs `pip install pymysql`.

## Run (Windows PowerShell)
```powershell
py -m venv .venv ; .\.venv\Scripts\Activate.ps1
python generate_dataset.py                          # data/imd_records.csv (2000) + data/public_records.csv (3000)
python ingest.py --reset --export data\clean        # SQLite: weather_platform.db
pip install pymysql
python ingest.py --reset --db "mysql://root:YourPassword@localhost:3306/weather_platform"
```
Special characters in the password must be URL-encoded (`@` -> `%40`). The database is created if missing.
Re-running without `--reset` is idempotent: already-landed rows are skipped by content hash.

## Pipeline (ingest.py -> processing.py)
1. **Landing**: every raw payload is stored untouched in `raw_records` (hash-deduplicated, replayable).
2. **Parse**: 5 timestamp formats (+epoch, IST/UTC) -> UTC; units (F/K -> C, cm -> mm, kt and m/s -> km/h);
   hazard-name aliases -> 23 canonical hazards; state/district aliases (Orissa, Bangalore, UP ...) -> canonical;
   missing/invalid coordinates -> district centroid; place extracted from text when location fields are blank.
3. **Validate**: physical range checks (bad values nulled and flagged in `qc_flags`), India bounding box,
   metric-vs-hazard consistency flag (`metrics_consistent`).
4. **Text clean (public)**: HTML unescape, NFKC, URLs/@mentions/emoji stripped, RT/"Forwarded" detected,
   language tag (en / hi / hi-Latn).
5. **Spam filter**: shorteners, promo/scam phrases, phone numbers, hashtag/caps/emoji/punctuation bursts,
   follower-vs-share anomalies; additive score, threshold 3.
6. **Irrelevance filter**: weather lexicon (English/Hinglish/Hindi) + impact cues + location vs figurative or
   entertainment contexts (cricket, movies, songs, stocks ...). Weak posts are kept as `low_signal`.
7. **Dedupe**: IMD re-issued bulletins; public exact / repost / near-duplicate (token + char-trigram Jaccard,
   same numbers, compatible location, +/-1 day). Survivor keeps `duplicate_count`.
8. **Categorise**: rule-based multilingual hazard tagger (`hazard_rule`, score, confidence); rainfall class
   resolved from mm values. Posts it can't tag are left for your ML model.
9. **Score**: `corroboration_count` (other handles, same state + hazard, +/-3 h) and `credibility` (0-1).
10. **Split**: 70/15/15 train/val/test **by event_id** (no leakage between linked IMD and public rows).
11. **Load**: `imd_clean`, `public_clean`, `rejected_records` (stage, reason, duplicate_of), `pipeline_runs`.

To go real-time, replace `read_csv()` in `ingest.py` with a Kafka consumer or API poller; steps 2-9 operate on dicts.

## Tests and re-runs
`python -m unittest discover -s tests -v` runs 15 regression tests (no database server needed).
A `record_id` that already exists (earlier run, or repeated in one file) is kept as first loaded and the later version is
logged in `rejected_records` with reason `record_id_conflict`. See CHANGELOG.md.

## Dataset notes
* 5000 raw rows are deliberately noisy: ~6% spam, ~7% irrelevant, ~10% duplicates/reposts, ~3% resent IMD
  bulletins, messy formats, typos, Hinglish and Hindi text. Expect about 4250 clean rows after processing.
* `event_id` links IMD and public rows; `hazard_label` is the ML target; `_gt_noise` is ground truth used only
  by the evaluation printout (it never influences a filter decision).
* Synthetic data: values follow IMD-style thresholds but are not real observations.
