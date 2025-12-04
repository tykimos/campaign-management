import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function insertChannelTypes() {
  console.log('채널 유형 및 속성 삽입 시작...\n');

  try {
    // 먼저 테이블이 있는지 확인
    const { data: testData, error: testError } = await supabase
      .from('channel_types')
      .select('id')
      .limit(1);

    if (testError && testError.message.includes('Could not find the table')) {
      console.error('❌ channel_types 테이블이 없습니다.');
      console.log('\n다음 단계를 수행하세요:');
      console.log('1. Supabase Dashboard로 이동: https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx/sql/new');
      console.log('2. create_channel_schema_v2.sql 파일 내용을 실행');
      console.log('3. 이 스크립트를 다시 실행');
      return;
    }

    // 1. 채널 유형 데이터 정의
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

    // 2. 채널 유형 삽입
    console.log('채널 유형 삽입 중...');
    
    for (const type of channelTypes) {
      const { data, error } = await supabase
        .from('channel_types')
        .select('id')
        .eq('code', type.code)
        .single();

      if (error && error.code === 'PGRST116') {
        // 레코드가 없으면 삽입
        const { error: insertError } = await supabase
          .from('channel_types')
          .insert([type]);
        
        if (insertError) {
          console.error(`❌ ${type.name} 삽입 실패:`, insertError.message);
        } else {
          console.log(`✅ ${type.name} (${type.code}) 추가됨`);
        }
      } else if (data) {
        // 이미 존재하면 업데이트
        const { error: updateError } = await supabase
          .from('channel_types')
          .update({
            name: type.name,
            icon: type.icon,
            color: type.color,
            description: type.description,
            display_order: type.display_order
          })
          .eq('code', type.code);
        
        if (updateError) {
          console.error(`❌ ${type.name} 업데이트 실패:`, updateError.message);
        } else {
          console.log(`✅ ${type.name} (${type.code}) 업데이트됨`);
        }
      }
    }

    // 3. 기본 속성 삽입
    console.log('\n기본 속성 삽입 중...');
    
    const defaultAttributes = [
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

    for (const attr of defaultAttributes) {
      const { data, error } = await supabase
        .from('channel_attributes')
        .select('id')
        .eq('code', attr.code)
        .single();

      if (error && error.code === 'PGRST116') {
        // 레코드가 없으면 삽입
        const { error: insertError } = await supabase
          .from('channel_attributes')
          .insert([attr]);
        
        if (!insertError) {
          console.log(`✅ ${attr.name} 속성 추가됨`);
        }
      } else if (data) {
        console.log(`⏭️ ${attr.name} 속성 이미 존재`);
      }
    }

    // 4. 유형별 기본 속성 매핑
    console.log('\n유형별 속성 매핑 중...');
    
    const typeMappings = {
      'platform_service': ['url', 'member_count', 'view_count', 'posted_date'],
      'government': ['url', 'contact_person', 'contact_email', 'contact_phone'],
      'competition': ['url', 'posted_date', 'deleted_date', 'status'],
      'portal_cafe': ['url', 'member_count', 'view_count'],
      'sns_group': ['url', 'member_count'],
      'community': ['url', 'member_count', 'avg_daily_views'],
      'open_chat': ['url', 'member_count'],
      'discord': ['url', 'member_count'],
      'official_graduate': ['email', 'contact_person', 'contact_phone', 'homepage_url'],
      'official_university': ['email', 'contact_person', 'contact_phone', 'homepage_url', 'region', 'campus_type'],
      'official_highschool': ['email', 'contact_person', 'contact_phone', 'address'],
      'dm_academic': ['email', 'contact_person', 'homepage_url'],
      'dm_association': ['email', 'contact_person', 'homepage_url'],
      'dm_university': ['email', 'contact_person', 'region', 'campus_type'],
      'outdoor_university': ['region', 'campus_type', 'address'],
      'outdoor_nst': ['contact_person', 'address'],
      'outdoor_partner': ['contact_person', 'address'],
      'performance': ['url', 'view_count', 'status'],
      'event_site': ['url', 'posted_date', 'deleted_date']
    };

    for (const [typeCode, attrCodes] of Object.entries(typeMappings)) {
      // 유형 ID 가져오기
      const { data: typeData, error: typeError } = await supabase
        .from('channel_types')
        .select('id')
        .eq('code', typeCode)
        .single();
      
      if (typeError || !typeData) continue;
      
      // 각 속성과 연결
      for (let i = 0; i < attrCodes.length; i++) {
        const attrCode = attrCodes[i];
        
        const { data: attrData, error: attrError } = await supabase
          .from('channel_attributes')
          .select('id')
          .eq('code', attrCode)
          .single();
        
        if (attrError || !attrData) continue;
        
        // 필수 속성 판단 (첫 번째 속성은 필수로 설정)
        const isRequired = i === 0;
        
        // 이미 매핑이 있는지 확인
        const { data: existingMapping, error: checkError } = await supabase
          .from('channel_type_attributes')
          .select('id')
          .eq('channel_type_id', typeData.id)
          .eq('attribute_id', attrData.id)
          .single();
        
        if (!existingMapping) {
          const { error: mapError } = await supabase
            .from('channel_type_attributes')
            .insert({
              channel_type_id: typeData.id,
              attribute_id: attrData.id,
              is_required: isRequired,
              display_order: i + 1
            });
          
          if (mapError) {
            console.error(`매핑 실패 ${typeCode} - ${attrCode}:`, mapError.message);
          }
        }
      }
      
      console.log(`✅ ${typeCode}: ${attrCodes.length}개 속성 매핑`);
    }

    console.log('\n✅ 채널 유형 및 속성 삽입 완료!');
    
    // 통계 출력
    const { count: typeCount } = await supabase
      .from('channel_types')
      .select('*', { count: 'exact', head: true });
    
    const { count: attrCount } = await supabase
      .from('channel_attributes')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 총 ${typeCount}개 채널 유형, ${attrCount}개 속성이 등록되었습니다.`);

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

insertChannelTypes().catch(console.error);