import json
import os
import glob
import pandas as pd

def process_city_forecast():
    # Look for raw files in the city_forecast directory
    raw_files = glob.glob(os.path.join("data", "raw", "city_forecast*", "*.json"))
    
    if not raw_files:
        print("[INFO] No city forecast JSON files found in data/raw/")
        return

    cleaned_records = []

    for file in raw_files:
        try:
            with open(file, "r", encoding="utf-8") as f:
                content = json.load(f)
                
            records = content if isinstance(content, list) else [content]

            for record in records:
                cleaned_records.append({
                    "station_code": record.get("Station_Code", "N/A"),
                    "station_name": record.get("Station_Name", "Unknown"),
                    "date": record.get("Date"),
                    "max_temp": record.get("Today_Max_temp"),
                    "min_temp": record.get("Today_Min_temp"),
                    "rainfall_24h": record.get("Past_24_hrs_Rainfall", 0.0),
                    "forecast": record.get("Todays_Forecast", "N/A"),
                    "humidity_0830": record.get("Relative_Humidity_at_0830"),
                    "humidity_1730": record.get("Relative_Humidity_at_1730")
                })
        except Exception as e:
            print(f"[ERROR] Failed parsing {file}: {e}")

    if cleaned_records:
        df = pd.DataFrame(cleaned_records)
        
        # Convert numeric columns safely
        numeric_cols = ["max_temp", "min_temp", "rainfall_24h", "humidity_0830", "humidity_1730"]
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

        output_dir = os.path.join("data", "clean")
        os.makedirs(output_dir, exist_ok=True)
        
        output_csv = os.path.join(output_dir, "city_forecast_clean.csv")
        df.to_csv(output_csv, index=False)
        
        print(f"[SUCCESS] Cleaned {len(df)} records -> Saved to {output_csv}\n")
        print("--- Cleaned Data Preview ---")
        print(df.to_string(index=False))

if __name__ == "__main__":
    process_city_forecast()
