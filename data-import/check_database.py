import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

tables = [
    ("Country", "Countries"),
    ("State", "States"),
    ("District", "Districts"),
    ("SubDistrict", "Sub-Districts"),
    ("Village", "Villages"),
]

print("\n========== DATABASE VERIFICATION ==========")

for table, label in tables:
    cursor.execute(f'SELECT COUNT(*) FROM "{table}"')
    count = cursor.fetchone()[0]
    print(f"{label}: {count}")

cursor.close()
conn.close()

print("\n========== VERIFICATION COMPLETE ==========")