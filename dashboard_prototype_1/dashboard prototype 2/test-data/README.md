# INDRA Prototype Dataset

This directory contains the synthetic prototype dataset used by the INDRA dashboard during development.

## Fixture: `indra-prototype.json`

### Record Counts

| Category | Count |
|---|---|
| Public reports (source records) | 200 |
| IMD observations (source records) | 201 |
| Canonical incidents | 40 |
| Canonical alerts | 40 |

### Provenance Notes

**IMD Observation Count Discrepancy (201 vs 200 CSV rows):**
The fixture contains **201** IMD observations while the supplied `imd_sample_data.csv` contains **200** data rows. The extra record is:

- **`IMD-2025-00090`** — Fog observation, Patna, Bihar, `imdAlertColor: yellow`, `disasterProbabilityPct: 30.0`

This record was present in the **original pre-expansion fixture** (created before the CSV import) and was preserved during the expansion. It is **not present in the supplied CSV**. All 200 CSV rows were imported successfully (193 new + 7 matching existing = 200 total from CSV), and this one legacy record accounts for the +1 difference.

All records are explicitly labelled synthetic (`isSynthetic: true`, `dataSource: synthetic_*`).

### Confidence Derivation

Canonical incident `confidence` values follow the formula:
```
confidence = Math.round(average(credibilityScore of supporting public reports) * 100)
```
with fallback `0.5` for missing/invalid `credibilityScore`.

The three pre-existing incidents (`IND-EVT-019`, `IND-EVT-020`, `IND-EVT-024`) were recalculated to match this formula during the correction pass (see `expand-dataset.mjs` validation).

### Schema Version

`schemaVersion: "1.0.0"` — defined in `lib/types.ts`.