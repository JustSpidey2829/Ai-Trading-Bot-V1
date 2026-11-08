import os
import psycopg2
from datetime import datetime
import pytz

IST = pytz.timezone("Asia/Kolkata")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://user:password@host/dbname?sslmode=require")

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def init_db():
    try:
        conn = get_db_connection()
        c = conn.cursor()
        c.execute("""
            CREATE TABLE IF NOT EXISTS portfolio (
                id SERIAL PRIMARY KEY,
                starting_capital REAL,
                available_cash REAL,
                realized_pnl REAL,
                daily_pnl REAL,
                daily_lock INTEGER,
                last_reset TEXT
            );
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS trades (
                id SERIAL PRIMARY KEY,
                time TEXT,
                symbol TEXT,
                side TEXT,
                price REAL,
                amount REAL,
                pnl REAL,
                status TEXT
            );
        """)
        c.execute("SELECT COUNT(*) FROM portfolio;")
        if c.fetchone()[0] == 0:
            today = datetime.now(IST).strftime("%Y-%m-%d")
            c.execute("INSERT INTO portfolio (starting_capital, available_cash, realized_pnl, daily_pnl, daily_lock, last_reset) VALUES (%s, %s, %s, %s, %s, %s)",
                      (100000.0, 100000.0, 0.0, 0.0, 0, today))
        conn.commit()
        c.close()
        conn.close()
    except Exception as e:
        print(f"Database Initialization Note (Safe fallback): {e}")