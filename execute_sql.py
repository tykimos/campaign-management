#!/usr/bin/env python3
import os
import psycopg2
from urllib.parse import urlparse

# Supabase 연결 정보
supabase_url = "https://zaivjzyuxyajadfwfbkx.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaXZqenl1eHlhamFkZndmYmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzU0ODcsImV4cCI6MjA4MDM1MTQ4N30.oUUulgOnIpnQCcuG7IvzYB0MT_FzPlWzqz2qh3orXPY"

# Database URL 구성
# Supabase 프로젝트 ID는 URL에서 추출
project_id = "zaivjzyuxyajadfwfbkx"
db_password = "YHtSE5k7T8fL2dVa"  # Supabase 대시보드에서 확인 필요
db_host = f"db.{project_id}.supabase.co"
db_name = "postgres"
db_user = "postgres"
db_port = "5432"

# PostgreSQL 연결
try:
    conn = psycopg2.connect(
        host=db_host,
        database=db_name,
        user=db_user,
        password=db_password,
        port=db_port
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    print("데이터베이스에 연결되었습니다.")
    
    # SQL 파일 읽기
    with open('channel-tables.sql', 'r', encoding='utf-8') as f:
        sql = f.read()
    
    # SQL 실행
    cur.execute(sql)
    print("SQL이 성공적으로 실행되었습니다.")
    
    # 생성된 테이블 확인
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('channel_types', 'channel_attributes', 'channel_type_attributes', 'channels_v2')
    """)
    
    tables = cur.fetchall()
    print("\n생성된 테이블:")
    for table in tables:
        print(f"  - {table[0]}")
    
    # 채널 유형 데이터 확인
    cur.execute("SELECT COUNT(*) FROM public.channel_types")
    type_count = cur.fetchone()[0]
    print(f"\n채널 유형 개수: {type_count}")
    
    # 속성 데이터 확인
    cur.execute("SELECT COUNT(*) FROM public.channel_attributes")
    attr_count = cur.fetchone()[0]
    print(f"속성 개수: {attr_count}")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"오류 발생: {e}")
    print("\n참고: 데이터베이스 비밀번호는 Supabase 대시보드 > Settings > Database에서 확인할 수 있습니다.")