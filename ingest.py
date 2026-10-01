import json
import os
from datetime import datetime
import requests

# Cleaned dictionary keys (no spaces/special characters)
IMD_ENDPOINTS = {
    "city_forecast_7days": "https://api.imd.gov.in/api/v1/cityforecast?id=42182",
    "city_forecast_loc_7days": "https://api.imd.gov.in/api/v1/cityforecastloc?id=42182",
    "current_weather": "https://api.imd.gov.in/api/v1/current_wx",
    "district_nowcast": "https://api.imd.gov.in/api/v1/districtnowcast",
    "district_warnings": "https://api.imd.gov.in/api/v1/districtwarning",
    "district_rainfall": "https://api.imd.gov.in/api/v1/districtrainfall",
    "station_nowcast": "https://api.imd.gov.in/api/v1/stationnowcast",
    "state_rainfall": "https://api.imd.gov.in/api/v1/staterainfall",
    "aws_mapping_data": "https://api.imd.gov.in/api/v1/aws_data",
    "port_warning": "https://api.imd.gov.in/api/v1/portwarning",
    "subdivisional_rainfall_forecast_7days": "https://api.imd.gov.in/api/v1/subdivision_rainfall_forecast",
    "state_district_rainfall_forecast_5days": "https://api.imd.gov.in/api/v1/state_district_rainfall_forecast",
    "cyclone_track": "https://api.imd.gov.in/api/v1/cyclone_track",
    "cyclone_wind_warning": "https://api.imd.gov.in/api/v1/cyclone_wind"
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