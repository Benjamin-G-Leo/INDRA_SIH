# INDRA Dashboard

The frontend dashboard for **INDRA — India's National Disaster & Risk Analytics**.

## Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The dashboard will be available at the local address shown by Next.js.

## Data

The dashboard reads `public/data/indra-dataset.json`, produced by the data pipeline (`weather_platform_v2/export_dashboard.py`).
To refresh it, run the pipeline and export, then reload the page (the dashboard also re-reads the file every 10 seconds or when you press Refresh):

```bash
cd ../weather_platform_v2 && python export_dashboard.py
```

Set `NEXT_PUBLIC_DATASET_URL` to read the dataset from another URL (for example a future API). If the file cannot be loaded the dashboard
shows an error; it does not fall back to other data. The original hand-made fixture is kept in `test-data/`.

```bash
npm test        # unit tests (vitest)
```

## Tech Stack

* Next.js
* React
* TypeScript
* Tailwind CSS

## Repository

This dashboard is part of the main INDRA repository.
