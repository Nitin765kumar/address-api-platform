import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise RuntimeError("DATABASE_URL is not set in .env")

try:
    connection = psycopg2.connect(database_url)

    with connection.cursor() as cursor:
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]

    print("Database connection successful!")
    print(f"PostgreSQL version: {version}")

    connection.close()

except Exception as error:
    print("Database connection failed!")
    print(error)