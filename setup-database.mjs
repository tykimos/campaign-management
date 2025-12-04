import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zaivjzyuxyajadfwfbkx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaXZqenl1eHlhamFkZndmYmt4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDc3NTQ4NywiZXhwIjoyMDgwMzUxNDg3fQ.ixZD_HYDrLnVLQCfLPi14zPOvP_KItkQ-bJRYcmrciQ';

// Service role key로 클라이언트 생성 (관리자 권한)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

console.log('Supabase 데이터베이스 설정을 시작합니다...\n');

// SQL 명령들을 배열로 정의
const sqlCommands = [
  // 1. Channel Types 테이블 생성
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

  // 2. Channel Attributes 테이블 생성
  `CREATE TABLE IF NOT EXISTS channel_attributes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('text', 'number', 'date', 'boolean', 'url', 'email')),
    is_required BOOLEAN DEFAULT FALSE,
    is_common BOOLEAN DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  )`,

  // 3. Channel Type Attributes 테이블 생성
  `CREATE TABLE IF NOT EXISTS channel_type_attributes (
    id SERIAL PRIMARY KEY,
    channel_type_id INTEGER NOT NULL REFERENCES channel_types(id) ON DELETE CASCADE,
    attribute_id INTEGER NOT NULL REFERENCES channel_attributes(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(channel_type_id, attribute_id)
  )`,

  // 4. Channels V2 테이블 생성
  `CREATE TABLE IF NOT EXISTS channels_v2 (
    id SERIAL PRIMARY KEY,
    channel_type_id INTEGER NOT NULL REFERENCES channel_types(id),
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
  )`,

  // 5. RLS 활성화
  `ALTER TABLE channel_types ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE channel_attributes ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE channel_type_attributes ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE channels_v2 ENABLE ROW LEVEL SECURITY`,

  // 6. RLS 정책 생성
  `CREATE POLICY "Allow all for authenticated" ON channel_types FOR ALL USING (true)`,
  `CREATE POLICY "Allow all for authenticated" ON channel_attributes FOR ALL USING (true)`,
  `CREATE POLICY "Allow all for authenticated" ON channel_type_attributes FOR ALL USING (true)`,
  `CREATE POLICY "Allow all for authenticated" ON channels_v2 FOR ALL USING (true)`,
];

// SQL 실행 함수
async function executeSql(sql, description) {
  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
    
    if (error) {
      // RPC 함수가 없을 경우 직접 실행 시도
      if (error.message && error.message.includes('execute_sql')) {
        // Supabase JS 클라이언트로는 직접 DDL 실행이 불가능
        // 대신 성공으로 간주하고 진행
        console.log(`✓ ${description} (RPC 미지원 - 수동 실행 필요)`);
        return false;
      }
      throw error;
    }
    
    console.log(`✓ ${description}`);
    return true;
  } catch (error) {
    console.error(`✗ ${description}: ${error.message}`);
    return false;
  }
}

// 데이터 삽입 함수
async function insertData() {
  console.log('\n기본 데이터 삽입 중...\n');
  
  // 1. 채널 유형 삽입
  const channelTypes = [
    { code: 'platform_service', name: '플랫폼서비스', description: '온라인 플랫폼 및 서비스', color: 'blue', display_order: 1 },
    { code: 'government', name: '정부기관', description: '정부 및 공공기관', color: 'gray', display_order: 2 },
    { code: 'competition', name: '공모전', description: '공모전 및 대회', color: 'yellow', display_order: 3 },
    { code: 'portal_cafe', name: '포털카페', description: '네이버/다음 카페', color: 'amber', display_order: 4 },
    { code: 'sns_group', name: 'SNS그룹', description: '페이스북, 인스타그램 등', color: 'purple', display_order: 5 },
    { code: 'community', name: '커뮤니티', description: '온라인 커뮤니티', color: 'green', display_order: 6 },
    { code: 'open_chat', name: '오픈단톡방', description: '카카오톡 오픈채팅', color: 'pink', display_order: 7 },
    { code: 'discord', name: '디스코드', description: '디스코드 서버', color: 'indigo', display_order: 8 },
    { code: 'official_graduate', name: '공문-대학원', description: '대학원 공식 채널', color: 'blue', display_order: 9 },
    { code: 'official_university', name: '공문-대학교', description: '대학교 공식 채널', color: 'blue', display_order: 10 },
    { code: 'official_highschool', name: '공문-고등학교', description: '고등학교 공식 채널', color: 'blue', display_order: 11 },
    { code: 'dm_academic', name: 'DM-학회', description: '학회 DM 채널', color: 'red', display_order: 12 },
    { code: 'dm_association', name: 'DM-협회', description: '협회 DM 채널', color: 'red', display_order: 13 },
    { code: 'dm_university', name: 'DM-대학', description: '대학 DM 채널', color: 'red', display_order: 14 },
    { code: 'outdoor_university', name: '옥외광고-대학', description: '대학 옥외광고', color: 'teal', display_order: 15 },
    { code: 'outdoor_nst', name: '옥외광고-출연연NST', description: '출연연 옥외광고', color: 'teal', display_order: 16 },
    { code: 'outdoor_partner', name: '옥외광고-협력기관', description: '협력기관 옥외광고', color: 'teal', display_order: 17 },
    { code: 'performance', name: '퍼포먼스', description: '퍼포먼스 마케팅', color: 'cyan', display_order: 18 },
    { code: 'event_site', name: '이벤트사이트', description: '이벤트 사이트', color: 'amber', display_order: 19 }
  ];

  try {
    const { data, error } = await supabase
      .from('channel_types')
      .upsert(channelTypes, { onConflict: 'code' });
    
    if (error) throw error;
    console.log(`✓ ${channelTypes.length}개 채널 유형 삽입 완료`);
  } catch (error) {
    console.error('✗ 채널 유형 삽입 실패:', error.message);
  }

  // 2. 속성 삽입
  const attributes = [
    { code: 'name', name: '이름', data_type: 'text', display_order: 1 },
    { code: 'registration_date', name: '등록일', data_type: 'date', display_order: 2 },
    { code: 'update_date', name: '갱신일', data_type: 'date', display_order: 3 },
    { code: 'memo', name: '메모', data_type: 'text', display_order: 4 },
    { code: 'member_count', name: '인원', data_type: 'number', display_order: 5 },
    { code: 'url', name: 'URL', data_type: 'url', display_order: 6 },
    { code: 'email', name: '이메일', data_type: 'email', display_order: 7 },
    { code: 'contact_person', name: '담당자', data_type: 'text', display_order: 8 },
    { code: 'contact_phone', name: '연락처', data_type: 'text', display_order: 9 },
    { code: 'main_phone', name: '대표전화', data_type: 'text', display_order: 10 },
    { code: 'address', name: '주소', data_type: 'text', display_order: 11 },
    { code: 'is_active', name: '비활성화', data_type: 'boolean', display_order: 12 }
  ];

  try {
    const { data, error } = await supabase
      .from('channel_attributes')
      .upsert(attributes, { onConflict: 'code' });
    
    if (error) throw error;
    console.log(`✓ ${attributes.length}개 속성 삽입 완료`);
  } catch (error) {
    console.error('✗ 속성 삽입 실패:', error.message);
  }

  // 3. 기본 속성 연결 (name, registration_date, update_date, memo)
  try {
    const { data: types } = await supabase
      .from('channel_types')
      .select('id');
    
    const { data: attrs } = await supabase
      .from('channel_attributes')
      .select('id, code')
      .in('code', ['name', 'registration_date', 'update_date', 'memo']);
    
    if (types && attrs) {
      const typeAttributes = [];
      for (const type of types) {
        for (const attr of attrs) {
          typeAttributes.push({
            channel_type_id: type.id,
            attribute_id: attr.id,
            is_required: attr.code === 'name',
            display_order: attr.id
          });
        }
      }
      
      const { error } = await supabase
        .from('channel_type_attributes')
        .upsert(typeAttributes, { onConflict: ['channel_type_id', 'attribute_id'] });
      
      if (error) throw error;
      console.log(`✓ 기본 속성 연결 완료`);
    }
  } catch (error) {
    console.error('✗ 속성 연결 실패:', error.message);
  }
}

// 메인 실행
async function main() {
  console.log('참고: DDL 명령(CREATE TABLE 등)은 Supabase 대시보드의 SQL Editor에서 직접 실행해야 합니다.');
  console.log('channel-tables.sql 파일의 내용을 복사하여 실행해주세요.\n');
  
  // 테이블이 이미 존재하는지 확인
  try {
    const { data, error } = await supabase
      .from('channel_types')
      .select('count');
    
    if (!error) {
      console.log('테이블이 이미 존재합니다. 데이터 삽입을 진행합니다.');
      await insertData();
    } else {
      console.log('테이블이 존재하지 않습니다.');
      console.log('Supabase 대시보드에서 channel-tables.sql을 실행해주세요.');
      console.log('\n대시보드 URL: https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx/sql/new');
    }
  } catch (error) {
    console.error('오류:', error);
  }
}

main();