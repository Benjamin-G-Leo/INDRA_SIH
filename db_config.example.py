import os
from sqlalchemy import create_engine

DB_USER = "postgres"
DB_PASS = "YOUR_DATABASE_PASSWORD"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "indra_weather"

def get_db_engine():
    db_url = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    return create_engine(db_url)
