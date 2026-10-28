"""Thin DB-API wrapper so the same pipeline runs on SQLite (zero setup) or MySQL (pymysql)."""
import sqlite3
from urllib.parse import urlparse, unquote

PK = {"sqlite": "INTEGER PRIMARY KEY AUTOINCREMENT", "mysql": "BIGINT AUTO_INCREMENT PRIMARY KEY"}
BIGTEXT = {"sqlite": "TEXT", "mysql": "LONGTEXT"}
TAIL = {"sqlite": "", "mysql": " ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"}

TABLES = {
"raw_records": """CREATE TABLE IF NOT EXISTS raw_records (
  raw_id {PK}, batch_id VARCHAR(40) NOT NULL, source_type VARCHAR(10) NOT NULL,
  source_record_id VARCHAR(40) NOT NULL, content_hash CHAR(40) NOT NULL, payload {BIGTEXT} NOT NULL,
  ingested_at DATETIME NOT NULL, UNIQUE (content_hash)){TAIL}""",
"imd_clean": """CREATE TABLE IF NOT EXISTS imd_clean (
  record_id VARCHAR(40) PRIMARY KEY, raw_id BIGINT NOT NULL, event_id VARCHAR(20), record_type VARCHAR(12),
  bulletin_no VARCHAR(40), issued_at_utc DATETIME, valid_at_utc DATETIME NOT NULL, lead_time_hours DOUBLE,
  state VARCHAR(40) NOT NULL, district VARCHAR(60), latitude DOUBLE, longitude DOUBLE, geo_precision VARCHAR(20),
  hazard_type VARCHAR(40) NOT NULL, severity VARCHAR(10), temp_max_c DOUBLE, temp_min_c DOUBLE,
  rainfall_mm_24h DOUBLE, wind_speed_kmph DOUBLE, humidity_pct DOUBLE, visibility_m DOUBLE, pressure_hpa DOUBLE,
  snowfall_cm DOUBLE, lightning_strikes_hr DOUBLE, hail_size_mm DOUBLE, river_level_above_danger_m DOUBLE,
  metrics_consistent TINYINT, description TEXT, issuing_centre VARCHAR(30), duplicate_count INT DEFAULT 0,
  qc_flags VARCHAR(255), data_split VARCHAR(5)){TAIL}""",
"public_clean": """CREATE TABLE IF NOT EXISTS public_clean (
  record_id VARCHAR(40) PRIMARY KEY, raw_id BIGINT NOT NULL, event_id VARCHAR(20), source_platform VARCHAR(30),
  source_handle VARCHAR(60), posted_at_utc DATETIME NOT NULL, text_original TEXT, text_clean TEXT,
  language VARCHAR(10), is_repost TINYINT, hashtags VARCHAR(255), state VARCHAR(40), district VARCHAR(60),
  latitude DOUBLE, longitude DOUBLE, geo_precision VARCHAR(20), followers INT, likes INT, shares INT,
  has_media TINYINT, hazard_rule VARCHAR(40), hazard_rule_score DOUBLE, hazard_conf DOUBLE,
  hazard_label VARCHAR(40), spam_score DOUBLE, relevance_score DOUBLE, duplicate_count INT DEFAULT 0,
  corroboration_count INT DEFAULT 0, credibility DOUBLE, qc_flags VARCHAR(255), data_split VARCHAR(5)){TAIL}""",
"rejected_records": """CREATE TABLE IF NOT EXISTS rejected_records (
  id {PK}, raw_id BIGINT, source_type VARCHAR(10), source_record_id VARCHAR(40), stage VARCHAR(20) NOT NULL,
  reason VARCHAR(40) NOT NULL, duplicate_of VARCHAR(40), detail VARCHAR(255), rejected_at DATETIME NOT NULL){TAIL}""",
"pipeline_runs": """CREATE TABLE IF NOT EXISTS pipeline_runs (
  batch_id VARCHAR(40) PRIMARY KEY, started_at DATETIME, finished_at DATETIME, stats {BIGTEXT}){TAIL}""",
}
INDEXES = [
    ("ix_imd_event", "imd_clean", "event_id"), ("ix_imd_hazard", "imd_clean", "hazard_type"),
    ("ix_imd_state_time", "imd_clean", "state, valid_at_utc"), ("ix_imd_split", "imd_clean", "data_split"),
    ("ix_pub_event", "public_clean", "event_id"), ("ix_pub_hazard", "public_clean", "hazard_label"),
    ("ix_pub_state_time", "public_clean", "state, posted_at_utc"), ("ix_pub_split", "public_clean", "data_split"),
    ("ix_rej_reason", "rejected_records", "stage, reason"), ("ix_raw_src", "raw_records", "source_type, source_record_id"),
]


class Database:
    def __init__(self, url):
        u = urlparse(url)
        self.dialect = "mysql" if u.scheme.startswith("mysql") else "sqlite"
        if self.dialect == "sqlite":
            self.conn = sqlite3.connect(url.split("sqlite:///", 1)[1] if "sqlite:///" in url else url)
        else:
            import pymysql  # pip install pymysql
            kw = dict(host=u.hostname or "localhost", port=u.port or 3306, user=unquote(u.username or "root"),
                      password=unquote(u.password or ""), charset="utf8mb4")
            name = u.path.lstrip("/") or "weather_platform"
            boot = pymysql.connect(autocommit=True, **kw)
            with boot.cursor() as c:
                c.execute(f"CREATE DATABASE IF NOT EXISTS `{name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            boot.close()
            self.conn = pymysql.connect(database=name, **kw)

    def _q(self, sql):
        return sql.replace("?", "%s") if self.dialect == "mysql" else sql

    def execute(self, sql, params=()):
        cur = self.conn.cursor(); cur.execute(self._q(sql), params); return cur

    def executemany(self, sql, rows, chunk=1000):
        cur = self.conn.cursor()
        for i in range(0, len(rows), chunk):
            cur.executemany(self._q(sql), rows[i:i + chunk])

    def query(self, sql, params=()):
        cur = self.execute(sql, params); out = cur.fetchall(); cur.close(); return out

    def insert(self, table, cols, rows):
        if rows:
            self.executemany(f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({', '.join('?' * len(cols))})", rows)

    def create_schema(self, reset=False):
        if reset:
            for t in reversed(list(TABLES)): self.execute(f"DROP TABLE IF EXISTS {t}")
        for ddl in TABLES.values():
            self.execute(ddl.format(PK=PK[self.dialect], BIGTEXT=BIGTEXT[self.dialect], TAIL=TAIL[self.dialect]))
        for name, table, cols in INDEXES:
            try: self.execute(f"CREATE INDEX {name} ON {table} ({cols})")
            except Exception: self.conn.rollback() if self.dialect == "mysql" else None  # already exists
        self.conn.commit()

    def commit(self): self.conn.commit()
    def close(self): self.conn.close()
