import psycopg2
import os

# Database connection details
DATABASE_URL = "postgresql://postgres.zaivjzyuxyajadfwfbkx:sb_secret_dCVqXqJdhqBENbi0emxrYw_kuSuoNWx@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"

def execute_sql():
    try:
        print("Connecting to Supabase database...")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("Reading SQL file...")
        with open('channel-tables.sql', 'r') as f:
            sql = f.read()
        
        print("Executing SQL...")
        cur.execute(sql)
        conn.commit()
        
        print("✅ Tables created successfully!")
        
        # Verify tables
        tables = ['channel_types', 'channel_attributes', 'channel_type_attributes', 'channels_v2']
        for table in tables:
            cur.execute(f"SELECT COUNT(*) FROM public.{table}")
            count = cur.fetchone()[0]
            print(f"  - {table}: {count} records")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")
        print("\nPlease ensure psycopg2 is installed: pip install psycopg2-binary")

if __name__ == "__main__":
    execute_sql()