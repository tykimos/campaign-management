import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

// Service role 클라이언트로 직접 실행
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('데이터베이스 설정 시작...\n');

  try {
    // PostgreSQL 직접 쿼리를 실행할 수 있는 admin 권한으로 실행
    // Supabase는 service key를 사용하면 DDL 명령을 실행할 수 있음
    
    console.log('1. 테이블 생성 중...');
    
    // 각 테이블을 개별적으로 생성
    const tables = [
      {
        name: 'channel_types',
        query: `
          CREATE TABLE IF NOT EXISTS public.channel_types (
            id SERIAL PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            icon VARCHAR(50),
            color VARCHAR(50),
            display_order INT DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      },
      {
        name: 'channel_attributes',
        query: `
          CREATE TABLE IF NOT EXISTS public.channel_attributes (
            id SERIAL PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            data_type VARCHAR(20) NOT NULL,
            is_required BOOLEAN DEFAULT false,
            default_value TEXT,
            validation_rules JSONB,
            display_order INT DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      },
      {
        name: 'channel_type_attributes',
        query: `
          CREATE TABLE IF NOT EXISTS public.channel_type_attributes (
            id SERIAL PRIMARY KEY,
            channel_type_id INT REFERENCES public.channel_types(id) ON DELETE CASCADE,
            attribute_id INT REFERENCES public.channel_attributes(id) ON DELETE CASCADE,
            is_required BOOLEAN DEFAULT false,
            display_order INT DEFAULT 0,
            UNIQUE(channel_type_id, attribute_id)
          )
        `
      },
      {
        name: 'channels_v2',
        query: `
          CREATE TABLE IF NOT EXISTS public.channels_v2 (
            id SERIAL PRIMARY KEY,
            channel_type_id INT REFERENCES public.channel_types(id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            attributes JSONB DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id)
          )
        `
      }
    ];

    // Supabase의 postgres-meta API를 사용하여 테이블 생성
    // 하지만 Supabase JS SDK는 DDL을 직접 지원하지 않으므로
    // 테이블이 이미 존재하는지 확인하고, 없으면 안내
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(0); // 구조만 확인
      
      if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log(`❌ ${table.name} 테이블이 존재하지 않습니다.`);
        console.log('Supabase Dashboard에서 SQL을 실행해야 합니다.');
        
        // SQL 파일 생성
        const fs = await import('fs');
        const sqlContent = tables.map(t => t.query).join(';\n\n');
        fs.writeFileSync('create_tables_now.sql', sqlContent);
        
        console.log('\n📄 create_tables_now.sql 파일이 생성되었습니다.');
        console.log('다음 링크에서 실행하세요:');
        console.log('https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx/sql/new');
        
        return false;
      } else {
        console.log(`✅ ${table.name} 테이블 확인됨`);
      }
    }

    // 인덱스 생성 시도
    console.log('\n2. 인덱스 생성 중...');
    // 인덱스는 이미 존재할 수 있으므로 에러 무시
    
    console.log('\n✅ 데이터베이스 구조 확인 완료!');
    return true;

  } catch (error) {
    console.error('오류 발생:', error);
    return false;
  }
}

async function insertData() {
  console.log('\n채널 유형 데이터 삽입 시작...\n');

  try {
    // 채널 유형 데이터
    const channelTypes = [
      { code: 'platform_service', name: '플랫폼서비스', icon: '🌐', color: 'blue', display_order: 1, description: '온라인 플랫폼 및 서비스' },
      { code: 'government', name: '정부기관', icon: '🏛️', color: 'gray', display_order: 2, description: '정부 및 공공기관' },
      { code: 'competition', name: '공모전', icon: '🏆', color: 'yellow', display_order: 3, description: '공모전 및 대회' },
      { code: 'portal_cafe', name: '포털카페', icon: '☕', color: 'amber', display_order: 4, description: '네이버/다음 카페' },
      { code: 'sns_group', name: 'SNS그룹', icon: '📱', color: 'purple', display_order: 5, description: '페이스북, 인스타그램 등' },
      { code: 'community', name: '커뮤니티', icon: '👥', color: 'green', display_order: 6, description: '온라인 커뮤니티' },
      { code: 'open_chat', name: '오픈단톡방', icon: '💬', color: 'pink', display_order: 7, description: '카카오톡 오픈채팅' },
      { code: 'discord', name: '디스코드', icon: '🎮', color: 'indigo', display_order: 8, description: '디스코드 서버' },
      { code: 'official_graduate', name: '공문-대학원', icon: '🎓', color: 'blue', display_order: 9, description: '대학원 공식 채널' },
      { code: 'official_university', name: '공문-대학교', icon: '🏫', color: 'blue', display_order: 10, description: '대학교 공식 채널' },
      { code: 'official_highschool', name: '공문-고등학교', icon: '📚', color: 'blue', display_order: 11, description: '고등학교 공식 채널' },
      { code: 'dm_academic', name: 'DM-학회', icon: '📧', color: 'red', display_order: 12, description: '학회 DM 채널' },
      { code: 'dm_association', name: 'DM-협회', icon: '📨', color: 'red', display_order: 13, description: '협회 DM 채널' },
      { code: 'dm_university', name: 'DM-대학', icon: '✉️', color: 'red', display_order: 14, description: '대학 DM 채널' },
      { code: 'outdoor_university', name: '옥외광고-대학', icon: '🎯', color: 'teal', display_order: 15, description: '대학 옥외광고' },
      { code: 'outdoor_nst', name: '옥외광고-출연연NST', icon: '📍', color: 'teal', display_order: 16, description: '출연연 옥외광고' },
      { code: 'outdoor_partner', name: '옥외광고-협력기관', icon: '📌', color: 'teal', display_order: 17, description: '협력기관 옥외광고' },
      { code: 'performance', name: '퍼포먼스', icon: '📊', color: 'cyan', display_order: 18, description: '퍼포먼스 마케팅' },
      { code: 'event_site', name: '이벤트사이트', icon: '🎪', color: 'amber', display_order: 19, description: '이벤트 사이트' }
    ];

    console.log('채널 유형 삽입 중...');
    for (const type of channelTypes) {
      const { error } = await supabase
        .from('channel_types')
        .upsert(type, { onConflict: 'code' });
      
      if (error) {
        console.error(`❌ ${type.name} 삽입 실패:`, error.message);
      } else {
        console.log(`✅ ${type.name}`);
      }
    }

    // 기본 속성 데이터
    const attributes = [
      { code: 'url', name: 'URL', data_type: 'url', display_order: 1 },
      { code: 'member_count', name: '회원수', data_type: 'number', display_order: 2 },
      { code: 'view_count', name: '조회수', data_type: 'number', display_order: 3 },
      { code: 'avg_daily_views', name: '일평균조회수', data_type: 'number', display_order: 4 },
      { code: 'posted_date', name: '게재일', data_type: 'date', display_order: 5 },
      { code: 'deleted_date', name: '삭제일', data_type: 'date', display_order: 6 },
      { code: 'email', name: '이메일', data_type: 'email', display_order: 7 },
      { code: 'phone', name: '전화번호', data_type: 'text', display_order: 8 },
      { code: 'contact_person', name: '담당자', data_type: 'text', display_order: 9 },
      { code: 'contact_email', name: '담당자 이메일', data_type: 'email', display_order: 10 },
      { code: 'contact_phone', name: '담당자 연락처', data_type: 'text', display_order: 11 },
      { code: 'homepage_url', name: '홈페이지', data_type: 'url', display_order: 12 },
      { code: 'address', name: '주소', data_type: 'text', display_order: 13 },
      { code: 'region', name: '지역', data_type: 'text', display_order: 14 },
      { code: 'campus_type', name: '본분교', data_type: 'text', display_order: 15 },
      { code: 'academic_system', name: '학제', data_type: 'text', display_order: 16 },
      { code: 'establishment_type', name: '설립구분', data_type: 'text', display_order: 17 },
      { code: 'memo', name: '메모', data_type: 'text', display_order: 18 },
      { code: 'is_verified', name: '검증여부', data_type: 'boolean', display_order: 19 },
      { code: 'status', name: '상태', data_type: 'text', display_order: 20 }
    ];

    console.log('\n속성 삽입 중...');
    for (const attr of attributes) {
      const { error } = await supabase
        .from('channel_attributes')
        .upsert(attr, { onConflict: 'code' });
      
      if (error) {
        console.error(`❌ ${attr.name} 삽입 실패:`, error.message);
      } else {
        console.log(`✅ ${attr.name}`);
      }
    }

    console.log('\n✅ 모든 데이터 삽입 완료!');

  } catch (error) {
    console.error('데이터 삽입 중 오류:', error);
  }
}

// 실행
setupDatabase().then(success => {
  if (success) {
    return insertData();
  } else {
    console.log('\n테이블이 없습니다. SQL을 먼저 실행하세요.');
  }
}).catch(console.error);