import { createClient } from '@supabase/supabase-js';
import pkg from 'xlsx';
const { readFile } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function insertChannelTypes() {
  console.log('채널 유형 및 속성 삽입 시작...\n');

  try {
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

    // 2. 채널 유형 삽입 (upsert)
    console.log('채널 유형 삽입 중...');
    for (const type of channelTypes) {
      const { data, error } = await supabase
        .from('channel_types')
        .upsert(type, { onConflict: 'code' });
      
      if (error) {
        console.error(`유형 ${type.name} 삽입 실패:`, error.message);
      } else {
        console.log(`✅ ${type.name} (${type.code})`);
      }
    }

    // 3. Excel 파일 읽기
    const filePath = './data/2026 NRF AI Co-Scientist Challenge Korea 경진대회 - 홍보 대시보드.xlsx';
    
    if (!fs.existsSync(filePath)) {
      console.log('\n⚠️ Excel 파일을 찾을 수 없습니다. 기본 속성만 설정합니다.');
      await insertDefaultAttributes();
      return;
    }

    console.log('\nExcel 파일 읽기...');
    const workbook = readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    console.log(`발견된 시트: ${sheetNames.join(', ')}`);

    // 4. 시트별 속성 분석
    const attributeSet = new Set();
    const typeAttributeMap = {};

    sheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      
      if (data.length > 0) {
        // 첫 번째 행의 컬럼을 속성으로 추출
        const columns = Object.keys(data[0]);
        
        // 시트명을 채널 유형과 매핑
        let typeCode = null;
        if (sheetName.includes('플랫폼서비스')) typeCode = 'platform_service';
        else if (sheetName.includes('정부기관')) typeCode = 'government';
        else if (sheetName.includes('공모전')) typeCode = 'competition';
        else if (sheetName.includes('포털카페')) typeCode = 'portal_cafe';
        else if (sheetName.includes('SNS그룹')) typeCode = 'sns_group';
        else if (sheetName.includes('커뮤니티')) typeCode = 'community';
        else if (sheetName.includes('오픈단톡방')) typeCode = 'open_chat';
        else if (sheetName.includes('디스코드')) typeCode = 'discord';
        else if (sheetName.includes('공문-대학원')) typeCode = 'official_graduate';
        else if (sheetName.includes('공문-대학교')) typeCode = 'official_university';
        else if (sheetName.includes('공문-고등학교')) typeCode = 'official_highschool';
        else if (sheetName.includes('DM-학회')) typeCode = 'dm_academic';
        else if (sheetName.includes('DM-협회')) typeCode = 'dm_association';
        else if (sheetName.includes('DM-대학')) typeCode = 'dm_university';
        else if (sheetName.includes('옥외광고-대학')) typeCode = 'outdoor_university';
        else if (sheetName.includes('옥외광고-출연연')) typeCode = 'outdoor_nst';
        else if (sheetName.includes('옥외광고-협력기관')) typeCode = 'outdoor_partner';
        else if (sheetName.includes('퍼포먼스')) typeCode = 'performance';
        else if (sheetName.includes('이벤트사이트')) typeCode = 'event_site';

        if (typeCode) {
          typeAttributeMap[typeCode] = columns;
          columns.forEach(col => attributeSet.add(col));
        }

        console.log(`시트 ${sheetName}: ${columns.length}개 속성`);
      }
    });

    // 5. 속성 정의 생성
    const attributeDefinitions = [];
    for (const attr of attributeSet) {
      const code = attr.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      
      // 데이터 타입 추정
      let dataType = 'text';
      if (attr.includes('날짜') || attr.includes('일자') || attr.includes('Date')) {
        dataType = 'date';
      } else if (attr.includes('수') || attr.includes('Count') || attr.includes('회원')) {
        dataType = 'number';
      } else if (attr.includes('URL') || attr.includes('링크')) {
        dataType = 'url';
      } else if (attr.includes('이메일') || attr.includes('Email')) {
        dataType = 'email';
      } else if (attr.includes('여부') || attr.includes('확인')) {
        dataType = 'boolean';
      }

      attributeDefinitions.push({
        code: code,
        name: attr,
        data_type: dataType,
        display_order: attributeDefinitions.length + 1
      });
    }

    // 6. 속성 삽입
    console.log('\n속성 삽입 중...');
    for (const attr of attributeDefinitions) {
      const { data, error } = await supabase
        .from('channel_attributes')
        .upsert(attr, { onConflict: 'code' });
      
      if (error) {
        console.error(`속성 ${attr.name} 삽입 실패:`, error.message);
      } else {
        console.log(`✅ ${attr.name} (${attr.data_type})`);
      }
    }

    // 7. 채널 유형별 속성 매핑
    console.log('\n채널 유형별 속성 매핑 중...');
    
    for (const [typeCode, attributes] of Object.entries(typeAttributeMap)) {
      // 유형 ID 가져오기
      const { data: typeData, error: typeError } = await supabase
        .from('channel_types')
        .select('id')
        .eq('code', typeCode)
        .single();
      
      if (typeError || !typeData) continue;
      
      // 각 속성과 연결
      for (const attrName of attributes) {
        const attrCode = attrName.toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
        
        const { data: attrData, error: attrError } = await supabase
          .from('channel_attributes')
          .select('id')
          .eq('code', attrCode)
          .single();
        
        if (attrError || !attrData) continue;
        
        // 필수 속성 판단 (이름, URL 등은 필수로 설정)
        const isRequired = attrName.includes('이름') || 
                          attrName.includes('Name') || 
                          attrName.includes('URL') ||
                          attrName === '채널명';
        
        const { error: mapError } = await supabase
          .from('channel_type_attributes')
          .upsert({
            channel_type_id: typeData.id,
            attribute_id: attrData.id,
            is_required: isRequired,
            display_order: attributes.indexOf(attrName) + 1
          }, { 
            onConflict: 'channel_type_id,attribute_id' 
          });
        
        if (mapError) {
          console.error(`매핑 실패 ${typeCode} - ${attrName}:`, mapError.message);
        }
      }
      
      console.log(`✅ ${typeCode}: ${attributes.length}개 속성 매핑`);
    }

    console.log('\n✅ 채널 유형 및 속성 삽입 완료!');

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

async function insertDefaultAttributes() {
  console.log('\n기본 속성 삽입 중...');
  
  const defaultAttributes = [
    { code: 'url', name: 'URL', data_type: 'url', display_order: 1 },
    { code: 'member_count', name: '회원수', data_type: 'number', display_order: 2 },
    { code: 'view_count', name: '조회수', data_type: 'number', display_order: 3 },
    { code: 'posted_date', name: '게재일', data_type: 'date', display_order: 4 },
    { code: 'email', name: '이메일', data_type: 'email', display_order: 5 },
    { code: 'phone', name: '전화번호', data_type: 'text', display_order: 6 },
    { code: 'contact_person', name: '담당자', data_type: 'text', display_order: 7 },
    { code: 'address', name: '주소', data_type: 'text', display_order: 8 },
    { code: 'memo', name: '메모', data_type: 'text', display_order: 9 },
    { code: 'is_verified', name: '검증여부', data_type: 'boolean', display_order: 10 }
  ];

  for (const attr of defaultAttributes) {
    const { error } = await supabase
      .from('channel_attributes')
      .upsert(attr, { onConflict: 'code' });
    
    if (!error) {
      console.log(`✅ ${attr.name}`);
    }
  }
}

insertChannelTypes().catch(console.error);