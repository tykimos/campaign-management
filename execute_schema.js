import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function executeSchema() {
  console.log('채널 스키마 생성 중...\n');
  
  const sqlStatements = [
    // 1. 채널 유형 테이블
    `CREATE TABLE IF NOT EXISTS public.channel_types (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      icon VARCHAR(50),
      color VARCHAR(50),
      display_order INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    // 2. 속성 정의 테이블
    `CREATE TABLE IF NOT EXISTS public.channel_attributes (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      data_type VARCHAR(20) NOT NULL,
      is_required BOOLEAN DEFAULT false,
      default_value TEXT,
      validation_rules JSONB,
      display_order INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    // 3. 채널 유형별 속성 매핑 테이블
    `CREATE TABLE IF NOT EXISTS public.channel_type_attributes (
      id SERIAL PRIMARY KEY,
      channel_type_id INT REFERENCES public.channel_types(id) ON DELETE CASCADE,
      attribute_id INT REFERENCES public.channel_attributes(id) ON DELETE CASCADE,
      is_required BOOLEAN DEFAULT false,
      display_order INT DEFAULT 0,
      UNIQUE(channel_type_id, attribute_id)
    )`,
    
    // 4. 채널 테이블
    `CREATE TABLE IF NOT EXISTS public.channels_v2 (
      id SERIAL PRIMARY KEY,
      channel_type_id INT REFERENCES public.channel_types(id),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      attributes JSONB DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID REFERENCES auth.users(id)
    )`,
    
    // 5. 인덱스 생성
    `CREATE INDEX IF NOT EXISTS idx_channels_v2_type ON public.channels_v2(channel_type_id)`,
    `CREATE INDEX IF NOT EXISTS idx_channels_v2_attributes ON public.channels_v2 USING GIN(attributes)`
  ];

  for (const sql of sqlStatements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        // RPC가 없으면 직접 실행 시도
        console.log('테이블 생성 중... (RPC 사용 불가, Supabase Dashboard에서 직접 실행 필요)');
        console.log(sql.substring(0, 50) + '...');
      } else {
        console.log('✅ 테이블 생성 성공');
      }
    } catch (err) {
      console.log('⚠️ 테이블 생성은 Supabase Dashboard에서 직접 실행해주세요.');
      console.log('SQL 파일: create_channel_schema_v2.sql');
      break;
    }
  }

  // RLS 정책은 별도로 처리
  console.log('\nRLS 정책 설정...');
  
  try {
    // RLS 활성화
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.channel_types ENABLE ROW LEVEL SECURITY' 
    });
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.channel_attributes ENABLE ROW LEVEL SECURITY' 
    });
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.channel_type_attributes ENABLE ROW LEVEL SECURITY' 
    });
    await supabase.rpc('exec_sql', { 
      sql_query: 'ALTER TABLE public.channels_v2 ENABLE ROW LEVEL SECURITY' 
    });
    
    console.log('✅ RLS 활성화 완료');
  } catch (err) {
    console.log('⚠️ RLS 설정은 Supabase Dashboard에서 직접 실행해주세요.');
  }

  console.log('\n✅ 스키마 생성 시도 완료!');
  console.log('테이블이 없다면 Supabase Dashboard에서 create_channel_schema_v2.sql을 실행하세요.');
}

executeSchema().catch(console.error);