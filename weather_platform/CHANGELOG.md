# Changelog

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
