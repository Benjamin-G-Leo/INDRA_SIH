import pandas as pd
from sqlalchemy import inspect
from db_config import get_db_engine

def inspect_data():
    engine = get_db_engine()
    
    print("\n--- STATION WEATHER TABLE STRUCTURE & DATA ---")
    try:
        # Fetch table column names dynamically
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('station_weather')]
        print(f"Available Columns: {columns}\n")

        # Select all columns safely
        df = pd.read_sql("SELECT * FROM station_weather;", engine)
        if df.empty:
            print("Table 'station_weather' is empty.")
        else:
            print(df.to_string(index=False))
            
    except Exception as e:
        print(f"Error querying table: {e}")

if __name__ == "__main__":
    inspect_data()