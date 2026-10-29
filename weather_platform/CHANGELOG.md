# Changelog

## Pass 3 - more realistic data + fixes
- **Generator:** ~45% of genuine posts now use extra phrasings, ~12% describe the event with NO hazard keyword (only ML can label
  them), ~8% are vague / sarcastic / questions / forecasts / mixed-hazard. Added SMS short-forms, 3 typo kinds, 8 weather-word
  non-events (hard negatives) and 2% annotator label noise (`hazard_label` can be wrong; true value in `_gt_hazard`).
- **Fixed eval:** duplicates are scored per original/copy pair (`_gt_dup_of`), so keeping the copy instead of the original is no
  longer counted as a lost genuine record. `genuine_lost` ignores dedupe decisions.
- **Lexicons:** extra impact cues and non-event phrases (trip planning, throwback, nickname ...).
- **Repo:** removed the accidental nested copy `weather_platform/weather_platform/`, added `.gitignore`, db file untracked.
- Rule tagger coverage is now ~90% (was 98%): the rest is the ML model's job.

## Pass 2 - robustness fixes + regression tests
- **Fixed:** Hinglish "gaya" ("went/happened"), "puri" (food) and "surat" (face) were read as the cities Gaya, Puri, Surat,
  giving wrong state/district and inflating relevance. They now count only when Capitalised in mixed-case text.
- **Fixed crash:** a feed with a missing/blank `record_id` raised `KeyError`. Such rows are now rejected as `missing_record_id`.
- **Fixed crash:** re-ingesting a corrected record with an existing `record_id` (or a repeated id inside one file) raised
  `IntegrityError` and aborted the whole run. Now logged to `rejected_records` as `record_id_conflict`; the first version is kept.
- **Changed:** raw rows carry a private `_raw_id`, so lineage is correct even when ids are missing or repeated.
- **Added:** `tests/test_pipeline.py` (15 tests: parsing, units, geography, language, hashtags, spam, relevance,
  near-duplicates, ingest edge cases). Run `python -m unittest discover -s tests -v`.

## Pass 1 - first debug pass
- Generator: day-max temperature could be below night-min.
- Tagger: concatenated hashtags, "Thunder, lightning", "lifting loose dust", weak single cues.
- Language: any real Devanagari content now marks a post Hindi.
- Earlier: duplicate timestamp ties, "market" as negative context, over-broad impact cues, near-duplicate numbers/district
  rule, pressure jitter.

## Known open items
- MySQL path untested (no server in the build environment).
- Dedupe compares only within one run, not against earlier batches.
- Corrected IMD bulletins are not applied as updates (first version wins).
