# INDRA - India's National Disaster Risk Analysis Platform

**Detect weather disasters, verify them with public media, and alert emergency services - fast.**

INDRA combines official weather bulletins (IMD) with crowd-sourced reports (social media, news, citizen apps) to spot
weather hazards early, judge how trustworthy each report is, and surface confirmed incidents to responders on a live dashboard.

> **Live demo:** <https://indra-dashboard-zeta.vercel.app> (the dashboard, hosted on Vercel; shows a recorded synthetic dataset)
>
> **Status: working prototype.** Official IMD and social-media (Meta, X, ...) API keys are not available yet, so the data
> pipeline runs on realistic **synthetic data**. Every component that touches data is written so a live feed can replace the CSV
> reader later without changing the rest of the pipeline.

---

## Table of contents
1. [How it works](#how-it-works)
2. [Repository layout](#repository-layout)
3. [Quick start](#quick-start)
4. [Data pipeline](#data-pipeline)
5. [ML hazard classifier](#ml-hazard-classifier)
6. [Results](#results)
7. [Dashboard](#dashboard)
8. [Known bugs and limitations](#known-bugs-and-limitations)
9. [Roadmap](#roadmap)
10. [Project report](#project-report)

---

## How it works

```
 IMD bulletins ──┐
                 ├─► Landing ─► Parse & validate ─► Spam / relevance filters ─► Dedupe
 Public posts ───┘   (raw, replayable)  (units, time, place)                    (exact, repost, near)
 (X, Facebook, news,                                                                 │
  WhatsApp, citizen app)                                                             ▼
                                              Database  ◄─ Score  ◄─ Categorise (rules + ML model)
                                         (SQLite / MySQL)  (credibility,
                                                │           corroboration)
                                                ▼
                                   Dashboard  ─►  Emergency alerts (planned)
```

1. **Collect** official IMD observations/warnings and public reports.
2. **Clean** the raw data: normalise timestamps, units, place names and text in English, Hindi and Hinglish.
3. **Filter** spam and irrelevant posts, and remove duplicates and reposts.
4. **Classify** each post into one of 23 hazard types (rule-based tagger plus a machine-learning model).
5. **Verify** by scoring credibility and counting independent corroborating reports.
6. **Act** - show confirmed incidents on the dashboard and alert emergency services (alerting is planned).

## Repository layout

| Path | What it is |
|---|---|
| [`weather_platform_v2/`](weather_platform_v2/) | **Current data pipeline.** Realistic synthetic data generator, cleaning pipeline, evaluation, and the ML hazard classifier. Start here. |
| [`weather_platform/`](weather_platform/) | First version of the pipeline, kept unchanged for reference. |
| [`dashboard_prototype_2/`](dashboard_prototype_2/) | **Current dashboard** (Next.js): map, KPI cards, alerts and analysis. Reads the JSON exported by the pipeline. |
| [`Project Report/`](Project%20Report/) | PDF report of the data-pipeline and ML work. |

## Quick start

### Requirements
- Python 3.10+ (SQLite works with no setup; MySQL needs `pymysql`)
- Node.js 20+ and npm (dashboard only)

### 1. Data pipeline and ML model
```bash
cd weather_platform_v2
python3 -m venv .venv
source .venv/bin/activate            # Windows: .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

python generate_dataset.py                       # 2,000 IMD rows + 3,000 public posts -> data/
python ingest.py --reset --export data/clean     # clean + load into weather_platform.db
python train_classifier.py                       # train and evaluate the hazard classifier
python export_dashboard.py                       # build the dashboard dataset (uses the model if trained)
python -m unittest discover -s tests -v          # 19 tests
```

To load into MySQL instead of SQLite:
```bash
python ingest.py --reset --db "mysql://root:YourPassword@localhost:3306/weather_platform"
```
Special characters in the password must be URL-encoded (`@` becomes `%40`). The MySQL path is implemented but not yet tested against a live server.

### 2. Dashboard
The repository already contains a generated dataset, so the dashboard runs without step 1.
```bash
cd dashboard_prototype_2
npm install
npm run dev          # development server, usually http://localhost:3000
npm test             # 14 unit tests
npm run build && npm start     # production build
```
To refresh the data, re-run `python export_dashboard.py` in `weather_platform_v2/` and reload the page (the dashboard also re-reads the file every 10 seconds).

## Data pipeline

Located in [`weather_platform_v2/`](weather_platform_v2/). Full details are in its [README](weather_platform_v2/README.md).

| Stage | What happens |
|---|---|
| Landing | Every raw payload is stored untouched and hash-deduplicated, so runs are replayable and idempotent. |
| Parse | Five timestamp formats (plus epoch, IST/UTC) to UTC; F/K to C, cm/in to mm, knots and m/s to km/h; hazard and place aliases (Orissa, Bangalore, UP, ...) to canonical names; coordinates fixed or filled from district centroids. |
| Validate | Physical range checks, India bounding box, metric-versus-hazard consistency flag. |
| Spam filter | Link shorteners, promo and scam phrases, phone numbers, hashtag/caps/emoji bursts, follower-versus-share anomalies. |
| Relevance filter | English/Hinglish/Hindi weather lexicon plus impact cues, with figurative and entertainment contexts rejected (cricket, movies, stocks, ...). |
| Deduplicate | IMD re-issued bulletins; public exact copies, reposts and near-duplicates. |
| Categorise | Rule-based multilingual tagger for 23 hazards, completed by the ML classifier. |
| Score | Corroboration count and a 0-1 credibility score per post. |
| Split | 70/15/15 train/val/test **by event**, so linked IMD and public rows never leak between splits. |
| Load | `imd_clean`, `public_clean`, `rejected_records` (with stage and reason), `pipeline_runs`. |

### Synthetic data
The sample dataset is deliberately noisy and now includes the hard cases real posts have: posts with no hazard keyword, vague or sarcastic wording,
questions, forecasts, mixed hazards, typos, SMS short-forms, Hinglish and Devanagari Hindi, weather words with no event behind them,
and 2% label noise. Values follow IMD-style thresholds but are **not real observations**.

## ML hazard classifier

[`weather_platform_v2/train_classifier.py`](weather_platform_v2/train_classifier.py) trains a text classifier that labels a post with one of the 23 hazards.

- **Model:** TF-IDF on words (1-2 grams) and characters (2-5 grams, so typos and Hinglish still match) feeding a logistic regression.
- **Training:** train split to fit, validation split to tune, test split scored once.
- **Honest test set:** [`tests/hand_labeled.csv`](weather_platform_v2/tests/hand_labeled.csv) holds 113 posts written by hand rather than generated.
- **Recommended use:** a hybrid - keep the rule tag when a rule fires, ask the model otherwise.

```python
from train_classifier import load_model, predict
predict(load_model(), ["Water everywhere in Kochi, cars floating, send boats"])
# [('Flood', 0.90)]
```

## Results

Measured on the 5,000-row synthetic dataset (seed 42). All figures were produced by the code in this repository.

**Pipeline filters**

| Stage | Recall | Precision |
|---|---|---|
| Spam filter | 95% | 100% |
| Irrelevant-post filter | 100% | 90% |
| Duplicate removal (per pair) | 94% | 97% |
| Rule tagger | 90% coverage | 98% accuracy where it fires |

Output: 1,934 clean IMD rows, 2,314 clean public posts, 752 rejected; 12 genuine posts wrongly rejected, 0 noise rows leaked into clean data.

**Hazard classification accuracy**

| Test set | Rules only | Model only | Rules + model |
|---|---|---|---|
| Hand-written (113 posts) | 75% | 97% | **99%** |
| Synthetic validation (321 posts) | 88% | 98% | 98% |
| Synthetic test (349 posts) | 89% | 98% | 98% |

The hand-written score is the one to quote. Scores on synthetic splits are optimistic because the generator reuses templates.

## Dashboard

[`dashboard_prototype_2/`](dashboard_prototype_2/) is the frontend: **Next.js, React, TypeScript and Tailwind CSS**.

**Live:** <https://indra-dashboard-zeta.vercel.app>. Hosted on Vercel from the `dashboard_prototype_2/` folder and linked to this repository. The site serves the committed `public/data/indra-dataset.json`; to update it, run `export_dashboard.py`, then commit and push. Vercel installs with `npm ci` (set in the project settings) because the repo also contains an out-of-date `pnpm-lock.yaml`.

![Home: incident map, KPI cards and alert stream](Project%20Report/screenshots/dashboard_home.png)

- **Home:** filter toolbar, a live intelligence map of India (markers coloured by IMD severity), an incident report panel that drills from state to district to incident, KPI cards, and a red/orange/yellow alert stream.
- **Analysis:** reports over time (1H to 1Y), incidents by type and state, reports by source, top incidents by confidence, and reliability figures.
- **Help and Privacy** pages, light/dark theme, and an accessible skip link.

| Incident detail | Analysis |
|---|---|
| ![Incident detail](Project%20Report/screenshots/dashboard_incident_detail.png) | ![Analysis page](Project%20Report/screenshots/dashboard_analysis.png) |

### From pipeline to dashboard
`weather_platform_v2/export_dashboard.py` turns the cleaned database into `dashboard_prototype_2/public/data/indra-dataset.json` (schema 1.0.0, defined in `lib/types.ts`):

1. Every clean public post gets a hazard: the rule tag if a rule fired, otherwise the ML model's guess. Ground-truth columns are never used.
2. Posts with the same state and hazard are chained into one **incident** while no gap exceeds 6 hours.
3. An **IMD bulletin** for the same state and hazard inside that window *verifies* the incident: it sets the severity colour (Red, Orange, Yellow, Green) and supplies the reading (for example 48.2 C or 341 mm).
4. **Confidence** is the mean credibility of the supporting posts. Alerts are created only where IMD gives a severity.
5. The dashboard loads and validates the file. If it is missing, it shows an error and does **not** fall back to other data.

Current export: 60 incidents, 59 alerts, 885 source records, all marked synthetic. Options (`--max-incidents`, `--gap-hours`, `--window-hours`, `--no-model`) are described in the [pipeline README](weather_platform_v2/README.md).

Still demonstration values: the KPI change percentages (for example +12.8%), the System Health panel, and the fixed "Source consensus: Medium" label on incident cards.

## Known bugs and limitations

**Open bugs** (found in review, not fixed yet)

| Where | Bug | Effect |
|---|---|---|
| Dashboard | KPI change figures (for example "+12.8%") and the System Health panel are hard-coded | Shown as demo values, not measurements |
| Dashboard | "Source consensus: Medium" on every incident card is a fixed placeholder in `lib/data-source.ts` | Not a measured value |
| Dashboard | The floating "?" help button overlaps page content (alert tabs, timestamps) | Minor visual issue |
| Dashboard | The donut total ("719 TOTAL REPORTS") renders below the ring instead of inside it | Minor visual issue |
| Dashboard | `useFilterState` in `FilterContext.tsx` duplicates `useFilters` in `FilterToolbar.tsx` | Dead duplicate code |
| Dashboard repo | `pnpm-lock.yaml` is out of date next to `package-lock.json` (a default Vercel install fails on it) | Worked around with `npm ci` in the Vercel project settings; deleting the pnpm lockfile is the proper fix |
| Dashboard repo | `dashboard_prototype_2/` still tracks about 35 development scratch files (build logs, `fix_*.py`, `__pycache__`, `tsconfig.tsbuildinfo`) | Repo clutter; `tsc` keeps modifying the tracked `tsbuildinfo` |
| Pipeline | About 12 genuine posts per 5,000 are wrongly rejected, mostly ones that describe an event without any weather word | Small data loss |
| Pipeline | Duplicate detection works within one batch only | Reposts arriving in a later run are not caught |
| Pipeline | Corrected IMD bulletins are not applied as updates; the first version wins | Corrections ignored |
| Pipeline | MySQL support is implemented but never tested against a live server | Unknown |

**Limitations**

- **Synthetic data only.** Real IMD and social-media feeds are not connected, so accuracy on real posts is unknown.
- **The classifier only picks a hazard.** It does not decide whether a post is real; spam and relevance filters run first for that.
- **Hand-written test set is small** (113 posts) and was written alongside the generator. A blind set from a teammate would be a fairer test.
- **Model files are pickles.** Only load model files you trained yourself.
- **Dashboard shows a recorded sample, not live data.** Incident dates are 2022-2025, and nearly every incident is IMD-verified because the generator creates a bulletin for almost every event.

## Roadmap

- [ ] Blind evaluation set written by a teammate; re-score the classifier
- [ ] Credibility model combining classifier output, corroboration, source trust and IMD match
- [x] Pipeline-to-dashboard export (JSON file)
- [ ] Replace the JSON file with a live API layer over the database
- [ ] Live ingestion (IMD feed, social-media APIs) in place of the CSV reader
- [ ] Image and video verification of media attached to posts
- [ ] Emergency-service alert dispatch (SMS, email, webhook)
- [ ] Cross-batch deduplication and MySQL/PostgreSQL testing

## Project report

A 9-page PDF report covering the pipeline review, the ML classifier, the dashboard connection (with screenshots), results tables and next steps is in [`Project Report/`](Project%20Report/INDRA_Session_Report.pdf).
