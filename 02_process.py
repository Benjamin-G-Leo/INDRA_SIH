import json
import queue
import time
from bs4 import BeautifulSoup
from transformers import pipeline
from sqlalchemy import text
from db_config import get_db_engine, init_db

# 1. Initialize PostGIS Schema
print("[POSTGIS] Checking database tables and spatial extension...")
init_db()
engine = get_db_engine()

# 2. Simulated In-Memory Message Bus (Replaces external Kafka)
kafka_bus_queue = queue.Queue()

# 3. Ingestion Stage: Scraping IMD HTML with BeautifulSoup
def scrape_imd_bulletin():
    print("\n--- INGESTION LAYER (BeautifulSoup) ---")
    html_bulletin = """
    <div class="imd-alert">
        <h3 class="region">Odisha Coast</h3>
        <p class="description">Severe Cyclonic Storm warning issued for North Odisha coast. Expect heavy to very heavy rainfall exceeding 180mm with wind speed 90-100 kmph.</p>
    </div>
    """
    soup = BeautifulSoup(html_bulletin, 'html.parser')
    region = soup.find('h3', class_='region').text
    description = soup.find('p', class_='description').text
    
    payload = {
        "event_type": "UNSTRUCTURED_BULLETIN",
        "region": region,
        "raw_text": description,
        "timestamp": time.time()
    }
    
    kafka_bus_queue.put(payload)
    print(f"[BEAUTIFUL SOUP] Scraped bulletin for region: '{region}' and published event to bus.")

# 4. Processing Stage: NLP Enrichment with Hugging Face
def process_pipeline():
    scrape_imd_bulletin()
    
    print("\n--- PROCESSING LAYER (Hugging Face NLP) ---")
    print("[HUGGING FACE] Initializing NLP classification pipeline...")
    nlp_classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
    
    while not kafka_bus_queue.empty():
        event = kafka_bus_queue.get()
        
        if event.get("event_type") == "UNSTRUCTURED_BULLETIN":
            raw_text = event.get("raw_text")
            region = event.get("region")
            
            candidate_labels = ["Cyclone Warning", "Heavy Rainfall", "Heatwave", "Normal Weather"]
            result = nlp_classifier(raw_text, candidate_labels)
            
            top_label = result['labels'][0]
            confidence = result['scores'][0]
            
            print(f"[HUGGING FACE NLP] Extracted Alert: '{top_label}' ({confidence * 100:.1f}% confidence)")
            
            # 5. Storage Stage: Spatial PostGIS Sink
            print("\n--- STORAGE LAYER (PostGIS Sink) ---")
            insert_sql = text("""
                INSERT INTO station_weather (
                    station_code, 
                    station_name, 
                    recorded_at, 
                    max_temp, 
                    min_temp, 
                    rainfall_24h, 
                    location
                )
                VALUES (
                    :code, 
                    :name, 
                    NOW(), 
                    0.0, 
                    0.0, 
                    180.0, 
                    ST_SetSRID(ST_MakePoint(85.8245, 19.8135), 4326)
                );
            """)
            
            with engine.begin() as conn:
                conn.execute(insert_sql, {
                    "code": "OD01", 
                    "name": f"{region} - {top_label}"
                })
                
            print("[POSTGRES SINK] NLP-enriched bulletin successfully saved to PostGIS!")

if __name__ == "__main__":
    process_pipeline()
