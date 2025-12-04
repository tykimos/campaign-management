import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function executeSchema() {
  console.log('채널 유형 시스템 스키마 실행 중...\n');
  
  try {
    // 1. 채널 유형 데이터 생성/업데이트
    console.log('1. 채널 유형 설정 중...');
    
    const channelTypes = [
      { code: 'platform_service', name: '플랫폼서비스', description: '온라인 플랫폼 및 서비스', icon: '🌐', color: 'blue', display_order: 1 },
      { code: 'government', name: '정부기관', description: '정부 및 공공기관', icon: '🏛️', color: 'gray', display_order: 2 },
      { code: 'competition', name: '공모전', description: '공모전 및 대회', icon: '🏆', color: 'yellow', display_order: 3 },
      { code: 'portal_cafe', name: '포털카페', description: '네이버/다음 카페', icon: '☕', color: 'amber', display_order: 4 },
      { code: 'sns_group', name: 'SNS그룹', description: '페이스북, 인스타그램 등', icon: '📱', color: 'purple', display_order: 5 },
      { code: 'community', name: '커뮤니티', description: '온라인 커뮤니티', icon: '👥', color: 'green', display_order: 6 },
      { code: 'blog', name: '블로그', description: '블로그 채널', icon: '📝', color: 'orange', display_order: 7 },
      { code: 'open_chat', name: '오픈단톡방', description: '카카오톡 오픈채팅', icon: '💬', color: 'pink', display_order: 8 },
      { code: 'discord', name: '디스코드', description: '디스코드 서버', icon: '🎮', color: 'indigo', display_order: 9 },
      { code: 'university', name: '대학교공문', description: '대학교 공식 채널', icon: '🎓', color: 'blue', display_order: 10 },
      { code: 'graduate', name: '대학원공문', description: '대학원 공식 채널', icon: '🎓', color: 'blue', display_order: 11 },
      { code: 'highschool', name: '고등학교공문', description: '고등학교 공식 채널', icon: '🏫', color: 'blue', display_order: 12 },
      { code: 'institution', name: '기관공문', description: '기관 공식 채널', icon: '🏢', color: 'gray', display_order: 13 },
      { code: 'dm_academic', name: 'DM-학회', description: '학회 DM 채널', icon: '📧', color: 'red', display_order: 14 },
      { code: 'dm_association', name: 'DM-협회', description: '협회 DM 채널', icon: '📧', color: 'red', display_order: 15 },
      { code: 'dm_university', name: 'DM-대학', description: '대학 DM 채널', icon: '📧', color: 'red', display_order: 16 },
      { code: 'outdoor_university', name: '옥외광고-대학', description: '대학 옥외광고', icon: '🎯', color: 'teal', display_order: 17 },
      { code: 'outdoor_nst', name: '옥외광고-출연연NST', description: '출연연 옥외광고', icon: '🎯', color: 'teal', display_order: 18 },
      { code: 'outdoor_partner', name: '옥외광고-협력기관', description: '협력기관 옥외광고', icon: '🎯', color: 'teal', display_order: 19 },
      { code: 'performance', name: '퍼포먼스', description: '퍼포먼스 마케팅', icon: '📊', color: 'cyan', display_order: 20 },
      { code: 'event_site', name: '이벤트사이트', description: '이벤트 사이트', icon: '🎪', color: 'amber', display_order: 21 }
    ];
    
    // 테이블이 존재하는지 확인 (campaign_channels 테이블을 임시로 활용)
    const { data: testData, error: testError } = await supabase
      .from('campaign_channels')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('데이터베이스 연결 오류:', testError);
      return;
    }
    
    console.log('✅ 데이터베이스 연결 성공');
    
    // 2. 기존 채널 데이터에 유형 정보 추가
    console.log('\n2. 기존 채널 데이터 업데이트 중...');
    
    const { data: channels, error: fetchError } = await supabase
      .from('campaign_channels')
      .select('*')
      .order('id');
    
    if (fetchError) {
      console.error('채널 조회 오류:', fetchError);
      return;
    }
    
    console.log(`  총 ${channels.length}개 채널 발견`);
    
    // description 필드를 사용하여 채널 유형 정보 추가
    let updateCount = 0;
    for (const channel of channels) {
      // description에서 유형 정보 추출
      const typeMatch = channel.description?.match(/^(플랫폼서비스|정부기관|공모전|포털카페|SNS그룹|커뮤니티|블로그|오픈단톡방|디스코드|대학교공문|대학원공문|고등학교공문|기관공문|DM-학회|DM-협회|DM-대학|옥외광고-대학|옥외광고-출연연NST|옥외광고-협력기관|퍼포먼스|이벤트사이트)/);
      
      if (!typeMatch) {
        // description이 없거나 유형 정보가 없는 경우, category를 기반으로 추측
        let guessedType = '커뮤니티';
        if (channel.category === 'contest') guessedType = '공모전';
        else if (channel.category === 'sns') guessedType = 'SNS그룹';
        else if (channel.category === 'event') guessedType = '이벤트사이트';
        
        const newDescription = channel.description 
          ? `${guessedType} - ${channel.description}`
          : guessedType;
        
        const { error: updateError } = await supabase
          .from('campaign_channels')
          .update({ description: newDescription })
          .eq('id', channel.id);
        
        if (!updateError) {
          updateCount++;
        }
      }
    }
    
    console.log(`  ✅ ${updateCount}개 채널 업데이트 완료`);
    
    // 3. 채널 유형별 통계
    console.log('\n3. 채널 유형별 통계:');
    
    const { data: updatedChannels } = await supabase
      .from('campaign_channels')
      .select('description');
    
    const typeCounts = {};
    updatedChannels?.forEach(ch => {
      const typeMatch = ch.description?.match(/^(플랫폼서비스|정부기관|공모전|포털카페|SNS그룹|커뮤니티|블로그|오픈단톡방|디스코드|대학교공문|대학원공문|고등학교공문|기관공문|DM-학회|DM-협회|DM-대학|옥외광고-대학|옥외광고-출연연NST|옥외광고-협력기관|퍼포먼스|이벤트사이트)/);
      if (typeMatch) {
        const type = typeMatch[1];
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
    });
    
    for (const [type, count] of Object.entries(typeCounts)) {
      console.log(`  ${type}: ${count}개`);
    }
    
    console.log('\n4. 새로운 테이블 생성 안내:');
    console.log('더 나은 구조를 위해 다음 SQL을 Supabase Dashboard에서 실행하세요:');
    console.log('https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx/sql/new');
    console.log('\ncreate_channel_schema_v2.sql 파일의 내용을 실행하면:');
    console.log('  - channel_types 테이블 (채널 유형 정의)');
    console.log('  - channel_attributes 테이블 (속성 정의)');
    console.log('  - channel_type_attributes 테이블 (유형별 속성 매핑)');
    console.log('  - channels_v2 테이블 (동적 속성 지원)');
    console.log('이 생성됩니다.');
    
    console.log('\n✅ 채널 유형 시스템 준비 완료!');
    console.log('현재는 기존 campaign_channels 테이블을 사용하여 작동합니다.');
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

executeSchema().catch(console.error);