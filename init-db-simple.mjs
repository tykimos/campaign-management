import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zaivjzyuxyajadfwfbkx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaXZqenl1eHlhamFkZndmYmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzU0ODcsImV4cCI6MjA4MDM1MTQ4N30.oUUulgOnIpnQCcuG7IvzYB0MT_FzPlWzqz2qh3orXPY';

// anon key로 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Supabase 연결 테스트 중...\n');

  try {
    // 채널 유형 테이블 확인
    const { data: channelTypes, error: typesError } = await supabase
      .from('channel_types')
      .select('*')
      .limit(1);

    if (typesError) {
      if (typesError.message.includes('Could not find the table')) {
        console.log('❌ channel_types 테이블이 존재하지 않습니다.');
        console.log('\n해결 방법:');
        console.log('1. Supabase Dashboard 접속: https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx');
        console.log('2. SQL Editor 선택');
        console.log('3. New Query 클릭');
        console.log('4. channel-tables.sql 파일의 내용을 복사하여 붙여넣기');
        console.log('5. Run 버튼 클릭\n');
        
        console.log('또는 아래 링크로 직접 이동:');
        console.log('https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx/sql/new\n');
      } else {
        console.error('오류:', typesError);
      }
      return;
    }

    console.log('✅ channel_types 테이블이 존재합니다.');
    
    // 데이터 개수 확인
    const { count: typeCount } = await supabase
      .from('channel_types')
      .select('*', { count: 'exact', head: true });
    
    const { count: attrCount } = await supabase
      .from('channel_attributes')
      .select('*', { count: 'exact', head: true });
    
    const { count: linkCount } = await supabase
      .from('channel_type_attributes')
      .select('*', { count: 'exact', head: true });

    console.log(`\n현재 데이터 상태:`);
    console.log(`- 채널 유형: ${typeCount || 0}개`);
    console.log(`- 속성: ${attrCount || 0}개`);
    console.log(`- 유형-속성 연결: ${linkCount || 0}개\n`);

    if (typeCount === 0) {
      console.log('데이터가 비어있습니다. 기본 데이터를 삽입하시겠습니까?');
      console.log('node init-db-data.mjs 실행하여 데이터를 삽입할 수 있습니다.');
    }

  } catch (error) {
    console.error('예상치 못한 오류:', error);
  }
}

testConnection();