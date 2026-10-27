import sys
import os
from dotenv import load_dotenv

# Path to backend .env
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src', 'backend'))
env_path = os.path.join(backend_dir, '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"Loaded environment from: {env_path}")
else:
    print(f"Warning: .env not found at {env_path}")

sys.path.insert(0, backend_dir)

from sqlalchemy import text
from app.core.database import SessionLocal, engine

def run_migration():
    migration_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'docs', 'migrations', '001_client_revisions.sql'))
    print(f"Reading migration file: {migration_file}")

    with open(migration_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    print("Connecting to Supabase PostgreSQL database...")
    db = SessionLocal()
    try:
        connection = engine.raw_connection()
        try:
            cursor = connection.cursor()
            cursor.execute(sql_content)
            connection.commit()
            print("[SUCCESS] Migration 001_client_revisions.sql applied successfully to Supabase!")
        finally:
            cursor.close()
            connection.close()

    except Exception as e:
        print(f"[ERROR] Failed to run migration: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
