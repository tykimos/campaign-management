import fetch from 'node-fetch';
import fs from 'fs';

// Supabase 프로젝트 정보
const PROJECT_REF = 'zaivjzyuxyajadfwfbkx';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaXZqenl1eHlhamFkZndmYmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzU0ODcsImV4cCI6MjA4MDM1MTQ4N30.oUUulgOnIpnQCcuG7IvzYB0MT_FzPlWzqz2qh3orXPY';

async function executeSQLViaHTTP() {
  console.log('Supabase HTTP API를 통한 SQL 실행 시작...\n');

  // SQL 파일 읽기
  const sql = fs.readFileSync('channel-tables.sql', 'utf8');
  
  // SQL을 개별 명령으로 분리
  const commands = sql
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

  // 각 테이블 생성 SQL을 별도로 실행
  const tableCreations = [
    // 1. channel_types 테이블
    `CREATE TABLE IF NOT EXISTS channel_types (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      icon VARCHAR(10),
      color VARCHAR(20),
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    // 2. channel_attributes 테이블
    `CREATE TABLE IF NOT EXISTS channel_attributes (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      data_type VARCHAR(20) NOT NULL,
      is_required BOOLEAN DEFAULT FALSE,
      is_common BOOLEAN DEFAULT TRUE,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    // 3. channel_type_attributes 테이블
    `CREATE TABLE IF NOT EXISTS channel_type_attributes (
      id SERIAL PRIMARY KEY,
      channel_type_id INTEGER NOT NULL,
      attribute_id INTEGER NOT NULL,
      is_required BOOLEAN DEFAULT FALSE,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(channel_type_id, attribute_id)
    )`,
    
    // 4. channels_v2 테이블
    `CREATE TABLE IF NOT EXISTS channels_v2 (
      id SERIAL PRIMARY KEY,
      channel_type_id INTEGER NOT NULL,
      name VARCHAR(255) NOT NULL,
      url VARCHAR(500),
      member_count INTEGER,
      email VARCHAR(255),
      contact_person VARCHAR(100),
      contact_phone VARCHAR(50),
      main_phone VARCHAR(50),
      address TEXT,
      memo TEXT,
      registration_date DATE,
      update_date DATE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`
  ];

  // Edge Function을 통한 SQL 실행 (만약 설정되어 있다면)
  const EDGE_FUNCTION_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/exec-sql`;
  
  try {
    // Edge Function 시도
    console.log('Edge Function을 통한 SQL 실행 시도...');
    
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        sql: tableCreations[0] 
      })
    });

    const result = await response.text();
    console.log('응답:', result);
    
    if (response.ok) {
      console.log('✅ Edge Function을 통한 SQL 실행 성공');
      return;
    }
  } catch (error) {
    console.log('Edge Function 사용 불가:', error.message);
  }

  // PostgREST를 통한 RPC 호출 시도
  console.log('\nPostgREST RPC를 통한 실행 시도...');
  
  const RPC_URL = `https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql`;
  
  try {
    const response = await fetch(RPC_URL, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ 
        query: tableCreations[0] 
      })
    });

    const result = await response.text();
    console.log('RPC 응답:', result);
    
    if (response.ok) {
      console.log('✅ RPC를 통한 SQL 실행 성공');
      return;
    }
  } catch (error) {
    console.log('RPC 사용 불가:', error.message);
  }

  // 직접 테이블 생성 시도 (REST API를 통한 INSERT로 테이블 자동 생성)
  console.log('\n대안: REST API를 통한 데이터 삽입으로 테이블 자동 생성 시도...');
  console.log('참고: Supabase는 보안상 REST API를 통한 DDL을 직접 지원하지 않습니다.');
  console.log('\n해결 방법:');
  console.log('1. Supabase Dashboard SQL Editor 사용 (권장)');
  console.log('2. Supabase CLI 사용 (로컬 개발)');
  console.log('3. Database 연결 문자열을 통한 직접 연결 (비밀번호 필요)');
  console.log('\n다음 중 하나를 선택하세요:');
  console.log('- 브라우저에서 직접 실행: https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx/sql/new');
  console.log('- Supabase CLI 설치 후 실행: npx supabase db push');
}

executeSQLViaHTTP();