# MOCK DATA GENERATOR by reading JSON files
import json
import os
from datetime import datetime
# Simulating raw API responses for IMD endpoints
MOCK_DATASETS = {
    "city_forecast_7days": [
        {
            "Station_Code": "42182",
            "Station_Name": "New Delhi",
            "Date": "2026-10-02",
            "Today_Max_temp": "33.5",
            "Today_Min_temp": "22.8",
            "Past_24_hrs_Rainfall": "5.2",
            "Todays_Forecast": "Partly cloudy sky with light rain",
            "Relative_Humidity_at_0830": "84",
            "Relative_Humidity_at_1730": "68"
        },
        {
            "Station_Code": "43285",
            "Station_Name": "Bengaluru",
            "Date": "2026-10-02",
            "Today_Max_temp": "27.5",
            "Today_Min_temp": "19.2",
            "Past_24_hrs_Rainfall": "18.0",
            "Todays_Forecast": "Generally cloudy sky with moderate rain",
            "Relative_Humidity_at_0830": "92",
            "Relative_Humidity_at_1730": "81"
        }
    ],
    "district_nowcast": [
        {
            "District_Name": "Bengaluru Urban",
            "State_Name": "Karnataka",
            "Nowcast_Time": "2026-10-02 08:00:00",
            "Warning_Message": "Thunderstorm with light to moderate rain expected during next 3 hours."
        }
    ]
}

def generate_mock_files():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    for endpoint_key, payload in MOCK_DATASETS.items():
        folder_path = os.path.join("data", "raw", endpoint_key)
        os.makedirs(folder_path, exist_ok=True)
        
        file_path = os.path.join(folder_path, f"{endpoint_key}_{timestamp}.json")
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
            
        print(f"[SUCCESS] Mock data created: {file_path}")

if __name__ == "__main__":
    generate_mock_files()
