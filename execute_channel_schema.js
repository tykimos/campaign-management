import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function executeChannelSchema() {
  console.log('채널 스키마 업데이트 실행 중...\n');
  
  try {
    // 1. 채널 유형 테이블 생성 (이미 없는 경우)
    console.log('1. 채널 유형 테이블 확인 중...');
    
    // 테이블이 이미 있는지 확인
    const { data: existingTypes, error: checkError } = await supabase
      .from('campaign_channel_types')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') {
      console.log('   채널 유형 테이블이 없습니다. SQL로 생성 필요.');
      console.log('\n=== Supabase Dashboard에서 실행해야 할 SQL ===');
      console.log('https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx/sql/new\n');
      
      const createTableSQL = `
-- 채널 유형 테이블 생성
CREATE TABLE IF NOT EXISTS public.campaign_channel_types (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    display_order INT DEFAULT 0,
    icon VARCHAR(50),
    attributes_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- campaign_channels 테이블에 새 컬럼 추가
ALTER TABLE public.campaign_channels 
ADD COLUMN IF NOT EXISTS channel_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS member_count INT,
ADD COLUMN IF NOT EXISTS view_count INT,
ADD COLUMN IF NOT EXISTS posted_date DATE,
ADD COLUMN IF NOT EXISTS registered_date DATE,
ADD COLUMN IF NOT EXISTS deleted_date DATE,
ADD COLUMN IF NOT EXISTS result TEXT,
ADD COLUMN IF NOT EXISTS memo TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS homepage_url TEXT;

-- RLS 정책 설정
ALTER TABLE public.campaign_channel_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read channel types" 
    ON public.campaign_channel_types FOR SELECT USING (true);

CREATE POLICY "Public insert channel types" 
    ON public.campaign_channel_types FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update channel types" 
    ON public.campaign_channel_types FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Public delete channel types" 
    ON public.campaign_channel_types FOR DELETE USING (true);`;
      
      console.log(createTableSQL);
      return;
    }
    
    console.log('   채널 유형 테이블이 이미 존재합니다.');
    
    // 2. 채널 유형 데이터 삽입 또는 업데이트
    console.log('\n2. 채널 유형 데이터 설정 중...');
    
    const channelTypes = [
      { id: 'platform_service', name: '플랫폼서비스', display_order: 1, icon: '🌐' },
      { id: 'government', name: '정부기관', display_order: 2, icon: '🏛️' },
      { id: 'competition', name: '공모전', display_order: 3, icon: '🏆' },
      { id: 'portal_cafe', name: '포털카페', display_order: 4, icon: '☕' },
      { id: 'sns_group', name: 'SNS그룹', display_order: 5, icon: '📱' },
      { id: 'community', name: '커뮤니티', display_order: 6, icon: '👥' },
      { id: 'blog', name: '블로그', display_order: 7, icon: '📝' },
      { id: 'open_chat', name: '오픈단톡방', display_order: 8, icon: '💬' },
      { id: 'discord', name: '디스코드', display_order: 9, icon: '🎮' },
      { id: 'university', name: '대학교공문', display_order: 10, icon: '🎓' },
      { id: 'graduate', name: '대학원공문', display_order: 11, icon: '🎓' },
      { id: 'highschool', name: '고등학교공문', display_order: 12, icon: '🏫' },
      { id: 'institution', name: '기관공문', display_order: 13, icon: '🏢' },
      { id: 'dm_academic', name: 'DM-학회', display_order: 14, icon: '📧' },
      { id: 'dm_association', name: 'DM-협회', display_order: 15, icon: '📧' },
      { id: 'dm_university', name: 'DM-대학', display_order: 16, icon: '📧' },
      { id: 'outdoor_university', name: '옥외광고-대학', display_order: 17, icon: '🎯' },
      { id: 'outdoor_nst', name: '옥외광고-출연연NST', display_order: 18, icon: '🎯' },
      { id: 'outdoor_partner', name: '옥외광고-협력기관', display_order: 19, icon: '🎯' },
      { id: 'performance', name: '퍼포먼스', display_order: 20, icon: '📊' },
      { id: 'event_site', name: '이벤트사이트', display_order: 21, icon: '🎪' }
    ];
    
    // 기존 유형 삭제
    const { error: deleteError } = await supabase
      .from('campaign_channel_types')
      .delete()
      .gte('display_order', 0);
    
    if (deleteError) {
      console.log('   기존 데이터 삭제 중 오류 (계속 진행):', deleteError.message);
    }
    
    // 새 유형 삽입
    const { data: insertedTypes, error: insertError } = await supabase
      .from('campaign_channel_types')
      .insert(channelTypes)
      .select();
    
    if (insertError) {
      console.error('채널 유형 삽입 실패:', insertError);
      return;
    }
    
    console.log(`   ✅ ${insertedTypes.length}개 채널 유형 설정 완료`);
    
    // 3. campaign_channels 테이블 컬럼 확인
    console.log('\n3. campaign_channels 테이블 구조 확인 중...');
    
    // 테스트 삽입으로 컬럼 존재 여부 확인
    const testChannel = {
      name: 'TEST_CHANNEL_' + Date.now(),
      channel_type: 'platform_service',
      attributes: {},
      is_active: true
    };
    
    const { data: testData, error: testError } = await supabase
      .from('campaign_channels')
      .insert([testChannel])
      .select()
      .single();
    
    if (testError) {
      if (testError.message.includes('attributes')) {
        console.log('   ❌ attributes 컬럼이 없습니다. SQL로 추가 필요.');
        console.log('\nSupabase Dashboard에서 위의 ALTER TABLE 구문을 실행해주세요.');
      } else {
        console.log('   테스트 삽입 오류:', testError.message);
      }
    } else {
      console.log('   ✅ campaign_channels 테이블 준비 완료');
      
      // 테스트 데이터 삭제
      await supabase
        .from('campaign_channels')
        .delete()
        .eq('id', testData.id);
    }
    
    console.log('\n채널 스키마 설정 완료!');
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

executeChannelSchema().catch(console.error);