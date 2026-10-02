"""
04_analytics_ai.py
==================

INDRA - AI Analytics & Data Fusion Engine.

This module implements the final stage of the INDRA disaster-response
weather-intelligence pipeline.  It queries the PostGIS-backed
``station_weather`` table for the most recent weather observations,
fuses the raw sensor readings (wind speed, rainfall) into a unified
disaster-risk index, and then asks Google's Gemma 4 31B model (served
via the OpenRouter API) to generate a concise, actionable emergency
advisory for local district authorities and NDRF/SDRF response teams.

The script degrades gracefully: when an OpenRouter API key is either
absent from the environment or left as a default placeholder, the
advisory generator falls back to a deterministic rule-based mock
advisory so that the rest of the analytics pipeline keeps running.

Usage:

    $ export OPENROUTER_API_KEY="sk-..."
    $ python 04_analytics_ai.py
"""

import os
import time

import requests
from sqlalchemy import text

from db_config import get_db_engine

# --------------------------------------------------------------------------- #
# OpenRouter configuration
# --------------------------------------------------------------------------- #
OPENROUTER_API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
TARGET_MODEL = "google/gemma-4-31b-it:free"
HTTP_REFERER = "https://github.com/Benjamin-G-Leo/INDRA_SIH"
X_TITLE = "INDRA Disaster Intelligence System"

# Placeholder strings that indicate the key has *not* been configured.
DEFAULT_KEY_PLACEHOLDERS = (
    "",
    "YOUR_OPENROUTER_API_KEY",
    "sk-your-api-key",
    "sk-...",
)

# A short timeout keeps the pipeline responsive under degraded networks.
REQUEST_TIMEOUT = 30

# Number of recent station records to pull from PostGIS on every run.
RECORD_LIMIT = 5

# Seconds to wait between consecutive live OpenRouter calls.  Spacing the
# requests keeps the free-tier ``google/gemma-4-31b-it:free`` route from
# rate-limiting (HTTP 429) under burst load, so Gemma 4 31B can actually
# answer every record instead of falling back to the mock advisory.
API_CALL_INTERVAL = 1.0


def _get_api_key():
    """Return a usable OpenRouter API key or ``None`` if unconfigured.

    The key is considered unconfigured when the ``OPENROUTER_API_KEY``
    environment variable is missing, empty, or holds one of the
    well-known default placeholder strings.
    """
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if api_key is None:
        return None
    api_key = api_key.strip()
    if api_key in DEFAULT_KEY_PLACEHOLDERS:
        return None
    return api_key


# --------------------------------------------------------------------------- #
# Disaster-risk engine
# --------------------------------------------------------------------------- #
def calculate_risk_index(wind_speed, rainfall):
    """Compute a normalised disaster-risk score and impact classification.

    The blended risk score weights rainfall (0.6) more heavily than wind
    speed (0.4) because precipitation-driven flooding is the dominant
    threat across the Indian subcontinent.  The score is capped at 100.

    Parameters
    ----------
    wind_speed : float
        Maximum observed wind speed in km/h.
    rainfall : float
        Cumulative rainfall in mm over the observation window.

    Returns
    -------
    dict
        ``{"risk_score", "risk_level", "impact_radius"}``.
    """
    score = min(100.0, (wind_speed * 0.4) + (rainfall * 0.6))

    if score >= 70:
        risk_level = "CRITICAL"
        impact_radius = 50
    elif score >= 40:
        risk_level = "HIGH"
        impact_radius = 25
    elif score >= 20:
        risk_level = "MODERATE"
        impact_radius = 10
    else:
        risk_level = "LOW"
        impact_radius = 0

    return {
        "risk_score": score,
        "risk_level": risk_level,
        "impact_radius": impact_radius,
    }


# --------------------------------------------------------------------------- #
# AI advisory generator (Google Gemma 4 31B via OpenRouter)
# --------------------------------------------------------------------------- #
def _generate_mock_advisory(location_name, wind_speed, rainfall,
                            risk_level, risk_score, impact_radius):
    """Rule-based fallback advisory used when the LLM API is unavailable.

    Each template produces exactly two sentences, keeping the fallback
    output consistent with the strict 2-sentence contract of the live
    Gemma 4 31B advisory.
    """
    templates = {
        "CRITICAL": (
            "CRITICAL alert for {loc}: immediate life-threatening "
            "conditions with {wind} km/h winds and {rain} mm rainfall "
            "detected across the area. District authorities must "
            "activate NDRF/SDRF response teams within {rad} km and "
            "initiate urgent evacuation of vulnerable low-lying zones "
            "without delay."
        ),
        "HIGH": (
            "HIGH risk advisory for {loc}: severe weather with {wind} "
            "km/h winds and {rain} mm rainfall is affecting the region. "
            "District collectors should pre-position NDRF/SDRF assets "
            "within a {rad} km radius and prepare staged evacuations of "
            "at-risk communities."
        ),
        "MODERATE": (
            "MODERATE risk for {loc}: weather conditions ({wind} km/h "
            "winds, {rain} mm rainfall) warrant heightened vigilance. "
            "Authorities within {rad} km must monitor updates closely "
            "and keep NDRF/SDRF response units on standby for rapid "
            "deployment."
        ),
        "LOW": (
            "LOW risk for {loc}: weather is currently stable ({wind} km/h "
            "winds, {rain} mm rainfall) but conditions are being "
            "monitored. Maintain routine surveillance of the {rad} km "
            "area and keep emergency response channels on alert status."
        ),
    }
    template = templates.get(risk_level, templates["LOW"])
    return template.format(
        loc=location_name,
        wind=wind_speed,
        rain=rainfall,
        rad=impact_radius,
    )


def generate_ai_advisory(location_name, wind_speed, rainfall,
                         risk_level, risk_score, impact_radius):
    """Generate a 2-sentence emergency advisory via Gemma 4 31B.

    Builds a structured chat prompt containing the location name,
    observed wind speed, rainfall total, risk level, risk score and
    impact radius, then submits it to the OpenRouter endpoint using the
    ``google/gemma-4-31b-it:free`` model.  Any failure (missing key,
    timeout, non-2xx response, malformed payload) is caught and a
    deterministic mock advisory is returned instead so the pipeline
    never crashes.
    """
    system_prompt = (
        "You are the INDRA Disaster Response Command Officer, an expert "
        "meteorological analyst embedded with the National Disaster "
        "Response Force (NDRF) and State Disaster Response Force (SDRF). "
        "Your sole responsibility is to convert technical weather data "
        "into clear, decisive, actionable emergency instructions for "
        "local district authorities and NDRF/SDRF response teams."
    )
    user_prompt = (
        "Generate a clear, actionable emergency advisory. "
        "STRICTLY return exactly TWO sentences. Do not number them, "
        "do not use bullet points, and do not add introductory phrases.\n"
        "\n"
        f"Location Name: {location_name}\n"
        f"Wind Speed (km/h): {wind_speed}\n"
        f"Rainfall (mm): {rainfall}\n"
        f"Risk Level: {risk_level}\n"
        f"Risk Score: {risk_score}\n"
        f"Impact Radius (km): {impact_radius}"
    )

    api_key = _get_api_key()
    if api_key is None:
        print("[AI ADVISORY] OPENROUTER_API_KEY is missing or is a "
              "default placeholder; returning fallback mock advisory.")
        return _generate_mock_advisory(
            location_name, wind_speed, rainfall,
            risk_level, risk_score, impact_radius,
        )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": HTTP_REFERER,
        "X-Title": X_TITLE,
    }

    payload = {
        "model": TARGET_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 256,
    }

    try:
        response = requests.post(
            OPENROUTER_API_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()
        advisory = data["choices"][0]["message"]["content"].strip()
        print("[AI ADVISORY] Advisory generated by Gemma 4 31B "
              "via OpenRouter.")
        return advisory
    except requests.exceptions.Timeout:
        print("[AI ADVISORY] OpenRouter request timed out after "
              f"{REQUEST_TIMEOUT}s; returning fallback mock advisory.")
    except requests.exceptions.RequestException as exc:
        print(f"[AI ADVISORY] OpenRouter endpoint error: {exc}; "
              "returning fallback mock advisory.")
    except (KeyError, ValueError, IndexError) as exc:
        print(f"[AI ADVISORY] Malformed response from OpenRouter: {exc}; "
              "returning fallback mock advisory.")

    return _generate_mock_advisory(
        location_name, wind_speed, rainfall,
        risk_level, risk_score, impact_radius,
    )


# --------------------------------------------------------------------------- #
# Database integration & main execution pipeline
# --------------------------------------------------------------------------- #
def fetch_recent_weather_records(engine, limit=RECORD_LIMIT):
    """Return the most recent weather records from the PostGIS sink.

    Fetches ``id``, ``station_name``, ``wind_speed`` and ``rainfall``
    ordered by descending ``id`` (most recently inserted first) and
    limited to ``limit`` rows.
    """
    limit = int(limit)
    query = text(
        f"SELECT id, station_name, wind_speed, rainfall "
        f"FROM station_weather "
        f"ORDER BY id DESC "
        f"LIMIT {limit}"
    )
    with engine.connect() as conn:
        return conn.execute(query).fetchall()


def process_analytics():
    """Run the full AI analytics & data-fusion pipeline.

    1. Open a SQLAlchemy connection to the PostGIS database.
    2. Pull the 5 most recent ``station_weather`` records.
    3. For every record, compute the blended risk index.
    4. Generate an LLM advisory (with a safe fallback).
    5. Print a formatted terminal report.
    """
    print("=" * 72)
    print("[INDRA] AI Analytics & Data Fusion Engine - starting run")
    print("=" * 72)

    engine = get_db_engine()

    try:
        records = fetch_recent_weather_records(engine)
    except Exception as exc:
        print(f"[DATABASE] Unable to query station_weather: {exc}")
        return

    if not records:
        print("[DATABASE] No weather records found in 'station_weather'.")
        return

    print(f"\n[DATABASE] Retrieved {len(records)} recent record(s) "
          "from PostGIS.\n")

    # When an OpenRouter key is configured, throttle between consecutive
    # calls so the free-tier route does not 429 under burst load.
    use_live_api = _get_api_key() is not None

    for idx, row in enumerate(records):
        # Unpack with null-safety defaults as required by the spec.
        rec_id = row[0]
        station_name = (row[1] if row[1] is not None
                        else "Unknown Location")
        wind_speed = float(row[2]) if row[2] is not None else 0.0
        rainfall = float(row[3]) if row[3] is not None else 0.0

        # Fuse raw observations into a disaster-risk index.
        metrics = calculate_risk_index(wind_speed, rainfall)
        risk_score = metrics["risk_score"]
        risk_level = metrics["risk_level"]
        impact_radius = metrics["impact_radius"]

        # Generate the natural-language advisory via Gemma 4 31B.
        advisory = generate_ai_advisory(
            station_name, wind_speed, rainfall,
            risk_level, risk_score, impact_radius,
        )

        print("-" * 72)
        print(f"  ID            : {rec_id}")
        print(f"  Station Name  : {station_name}")
        print(f"  Wind Speed    : {wind_speed} km/h")
        print(f"  Rainfall      : {rainfall} mm")
        print(f"  Risk Score    : {risk_score:.2f}")
        print(f"  Risk Level    : {risk_level}")
        print(f"  Impact Radius : {impact_radius} km")
        print(f"  AI Advisory   : {advisory}")
        print("-" * 72)
        print()

        # Throttle only the live path; the mock-fallback path is instant.
        if use_live_api and idx < len(records) - 1:
            time.sleep(API_CALL_INTERVAL)

    print("[INDRA] Analytics run complete.")


if __name__ == "__main__":
    process_analytics()
