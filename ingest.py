import json
import os
from datetime import datetime
import requests

# Cleaned dictionary keys (no spaces/special characters)
IMD_ENDPOINTS = {
    "city_forecast_7days": "https://api.imd.gov.in/api/v1/cityforecast?id=42182",
    
}

HEADERS = {
    "User-Agent": "Mozilla/5.0",
    # "x-api-key": "YOUR_IMD_KEY_HERE"  # Add key if needed
}

def ingest_all_imd_apis():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    print(f"--- Starting Data Ingestion ({len(IMD_ENDPOINTS)} Endpoints) ---")
    
    for api_key, url in IMD_ENDPOINTS.items():
        # Create folder name using clean key
        folder_path = os.path.join("data", "raw", api_key)
        os.makedirs(folder_path, exist_ok=True)
        
        file_path = os.path.join(folder_path, f"{api_key}_{timestamp}.json")
        
        try:
            response = requests.get(url, headers=HEADERS, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                print(f"[SUCCESS] {api_key} -> Saved to {file_path}")
            else:
                print(f"[FAILED] {api_key} -> HTTP {response.status_code}")
                
        except Exception as e:
            print(f"[ERROR] {api_key} -> {e}")

if __name__ == "__main__":
    ingest_all_imd_apis()