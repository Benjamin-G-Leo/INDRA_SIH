from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from db_config import get_db_engine

app = FastAPI(title="INDRA Weather Intelligence API", version="1.0.0")

# Enable CORS for Grafana Cloud and external callers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "online", "system": "INDRA Spatial API"}

@app.get("/api/v1/alerts/geojson")
def get_weather_geojson():
    engine = get_db_engine()
    
    # Query PostGIS to build standard GeoJSON FeatureCollection directly
    query = text("""
        SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(jsonb_agg(features.feature), '[]'::jsonb)
        )
        FROM (
            SELECT jsonb_build_object(
                'type', 'Feature',
                'id', id,
                'geometry', CASE 
                    WHEN geom IS NOT NULL THEN ST_AsGeoJSON(geom)::jsonb 
                    ELSE NULL 
                END,
                'properties', to_jsonb(s) - 'geom'
            ) AS feature
            FROM station_weather s
        ) AS features;
    """)

    try:
        with engine.connect() as conn:
            result = conn.execute(query).fetchone()
            return result[0] if result else {"type": "FeatureCollection", "features": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))