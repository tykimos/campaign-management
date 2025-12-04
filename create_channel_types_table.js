import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createChannelTypesInDatabase() {
  console.log('채널 유형 테이블 생성 및 데이터 삽입...\n');

  try {
    // 1. 실제 channel_types 테이블에 데이터 삽입
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

    console.log('채널 유형 삽입 중...');

    // 테이블이 있는지 먼저 확인
    const { data: existingTypes, error: fetchError } = await supabase
      .from('channel_types')
      .select('code')
      .limit(1);

    if (fetchError) {
      console.log('⚠️ channel_types 테이블이 없습니다. 기존 테이블에 타입 컬럼 추가를 시도합니다...');
      
      // campaign_channels 테이블에 type 컬럼 추가 시도
      await addTypeColumnToCampaignChannels();
      return;
    }

    // channel_types 테이블에 데이터 삽입
    for (const type of channelTypes) {
      const { data, error } = await supabase
        .from('channel_types')
        .upsert(type, { onConflict: 'code' });

      if (error) {
        console.error(`❌ ${type.name} 삽입 실패:`, error.message);
      } else {
        console.log(`✅ ${type.name}`);
      }
    }

    // 2. 기본 속성 삽입
    console.log('\n기본 속성 삽입 중...');
    
    const attributes = [
      { code: 'url', name: 'URL', data_type: 'url', display_order: 1 },
      { code: 'member_count', name: '회원수', data_type: 'number', display_order: 2 },
      { code: 'view_count', name: '조회수', data_type: 'number', display_order: 3 },
      { code: 'posted_date', name: '게재일', data_type: 'date', display_order: 4 },
      { code: 'email', name: '이메일', data_type: 'email', display_order: 5 },
      { code: 'phone', name: '전화번호', data_type: 'text', display_order: 6 },
      { code: 'contact_person', name: '담당자', data_type: 'text', display_order: 7 },
      { code: 'address', name: '주소', data_type: 'text', display_order: 8 },
      { code: 'memo', name: '메모', data_type: 'text', display_order: 9 }
    ];

    for (const attr of attributes) {
      const { error } = await supabase
        .from('channel_attributes')
        .upsert(attr, { onConflict: 'code' });

      if (error) {
        console.error(`❌ ${attr.name} 속성 삽입 실패:`, error.message);
      } else {
        console.log(`✅ ${attr.name} 속성`);
      }
    }

    console.log('\n✅ 채널 유형 및 속성 생성 완료!');

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

async function addTypeColumnToCampaignChannels() {
  console.log('\ncampaign_channels 테이블에 channel_type 컬럼 추가 시도...');
  
  try {
    // 기존 채널 타입 정보 업데이트 (이모지 제거)
    const typeMapping = {
      '플랫폼서비스': 'platform_service',
      '정부기관': 'government',
      '공모전': 'competition',
      '포털카페': 'portal_cafe',
      'SNS그룹': 'sns_group',
      '커뮤니티': 'community',
      '오픈단톡방': 'open_chat',
      '디스코드': 'discord',
      '공문-대학원': 'official_graduate',
      '공문-대학교': 'official_university',
      '공문-고등학교': 'official_highschool',
      'DM-학회': 'dm_academic',
      'DM-협회': 'dm_association',
      'DM-대학': 'dm_university',
      '옥외광고-대학': 'outdoor_university',
      '옥외광고-출연연NST': 'outdoor_nst',
      '옥외광고-협력기관': 'outdoor_partner',
      '퍼포먼스': 'performance',
      '이벤트사이트': 'event_site'
    };

    const { data: channels, error: fetchError } = await supabase
      .from('campaign_channels')
      .select('*')
      .order('id')
      .limit(100); // 처음 100개만 테스트

    if (fetchError) {
      console.error('채널 조회 실패:', fetchError);
      return;
    }

    console.log(`${channels.length}개 채널 처리 중...`);

    let updateCount = 0;
    for (const channel of channels) {
      let channelType = 'community'; // 기본값
      let typeName = '커뮤니티';

      // description에서 유형 추출 (이모지 제거)
      if (channel.description) {
        for (const [koreanType, code] of Object.entries(typeMapping)) {
          if (channel.description.includes(koreanType)) {
            channelType = code;
            typeName = koreanType;
            break;
          }
        }
      }

      // description을 이모지 없이 업데이트
      const cleanDescription = channel.description 
        ? channel.description.replace(/\[.*?\]/g, '').trim()
        : '';
      
      const newDescription = cleanDescription 
        ? `${typeName} - ${cleanDescription}`
        : typeName;

      // 기존 description과 다르면 업데이트
      if (newDescription !== channel.description) {
        const { error: updateError } = await supabase
          .from('campaign_channels')
          .update({ 
            description: newDescription,
            // channel_type: channelType  // 컬럼이 있으면 설정
          })
          .eq('id', channel.id);

        if (!updateError) {
          updateCount++;
          console.log(`✅ ${channel.name} → ${typeName}`);
        }
      }
    }

    console.log(`\n✅ ${updateCount}개 채널 타입 정보 정리 완료 (이모지 제거)`);

  } catch (error) {
    console.error('채널 업데이트 중 오류:', error);
  }
}

createChannelTypesInDatabase().catch(console.error);