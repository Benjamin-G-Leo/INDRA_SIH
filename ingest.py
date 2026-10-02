import json
import os
from datetime import datetime
import requests
from kafka_mock_bus import MockKafkaProducer

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
    "User-Agent": "Mozilla/5.0"
}

producer = MockKafkaProducer(topic="imd-weather-raw")

def ingest_all_imd_apis():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    print(f"--- Starting Data Ingestion ({len(IMD_ENDPOINTS)} Endpoints) ---")
    
    for api_key, url in IMD_ENDPOINTS.items():
        try:
            response = requests.get(url, headers=HEADERS, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                event_message = {
                    "endpoint": api_key,
                    "timestamp": timestamp,
                    "payload": data
                }
                producer.send(event_message)
            else:
                print(f"[HTTP {response.status_code}] {api_key} unauthorized/unavailable. Injecting mock event.")
                mock_event = {
                    "endpoint": api_key,
                    "timestamp": timestamp,
                    "payload": [{
                        "Station_Code": "42182",
                        "Station_Name": "New Delhi",
                        "Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "Today_Max_temp": 33.5,
                        "Today_Min_temp": 22.8,
                        "Past_24_hrs_Rainfall": 5.2
                    }]
                }
                producer.send(mock_event)

        except Exception as e:
            print(f"[ERROR] Ingest failed for {api_key}: {e}")

if __name__ == "__main__":
    ingest_all_imd_apis()