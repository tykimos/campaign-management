import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import Papa from 'papaparse';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

// 채널 유형 매핑
const channelTypeMapping = {
  '플랫폼서비스': 'platform_service',
  '정부기관': 'government',
  '공모전': 'competition',
  '포털카페': 'portal_cafe',
  'SNS그룹': 'sns_group',
  '커뮤니티': 'community',
  '블로그': 'blog',
  '오픈단톡방': 'open_chat',
  '대학교공문': 'university',
  '디스코드': 'discord',
  '대학원공문': 'graduate',
  '고등학교공문': 'highschool',
  '기관공문': 'institution',
  'DM-학회': 'dm_academic',
  'DM-협회': 'dm_association',
  'DM-대학': 'dm_university',
  '옥외광고-대학': 'outdoor_university',
  '옥외광고-출연연NST': 'outdoor_nst',
  '옥외광고-협력기관': 'outdoor_partner',
  '퍼포먼스': 'performance',
  '이벤트사이트': 'event_site'
};

async function importChannels() {
  console.log('채널 데이터 임포트 시작...\n');
  
  // CSV 파일 읽기
  const csvText = readFileSync('all_channels.csv', 'utf-8');
  const { data: channels, errors } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true
  });
  
  if (errors.length > 0) {
    console.error('CSV 파싱 에러:', errors);
    return;
  }
  
  console.log(`총 ${channels.length}개 채널 로드됨\n`);
  
  // 기존 채널 삭제 (선택적)
  console.log('기존 채널 데이터 정리 중...');
  const { error: deleteError } = await supabase
    .from('campaign_channels')
    .delete()
    .gte('id', 0);
  
  if (deleteError) {
    console.error('기존 데이터 삭제 실패:', deleteError);
    // 계속 진행
  }
  
  // 채널 데이터 변환 및 삽입
  const channelsToInsert = [];
  const channelTypeCounts = {};
  
  for (const channel of channels) {
    const channelType = channelTypeMapping[channel.channel_type];
    
    if (!channelType) {
      console.warn(`알 수 없는 채널 유형: ${channel.channel_type}`);
      continue;
    }
    
    // 카운트
    channelTypeCounts[channel.channel_type] = (channelTypeCounts[channel.channel_type] || 0) + 1;
    
    // 날짜 파싱
    const parseDate = (dateStr) => {
      if (!dateStr || dateStr === 'nan' || dateStr === 'NaT') return null;
      
      // "2025. 1. 1." 형식 처리
      if (dateStr.includes('. ')) {
        const parts = dateStr.split('. ').filter(p => p);
        if (parts.length >= 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]);
          const day = parseInt(parts[2]);
          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          }
        }
      }
      
      // "2025-01-01" 형식
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
        return dateStr.substring(0, 10);
      }
      
      return null;
    };
    
    // 숫자 파싱
    const parseNumber = (numStr) => {
      if (!numStr || numStr === 'nan') return null;
      const num = parseFloat(numStr);
      return isNaN(num) ? null : Math.floor(num);
    };
    
    // 동적 속성 수집
    const attributes = {};
    const excludeKeys = ['channel_type', 'row_index', '이름', '주소', '조회수', '회원수', '인원', 
                        '게재일', '등록일', '삭제일', '결과', '메모'];
    
    for (const [key, value] of Object.entries(channel)) {
      if (!excludeKeys.includes(key) && value && value !== 'nan') {
        attributes[key] = value;
      }
    }
    
    const channelData = {
      channel_type: channelType,
      name: channel['이름'] || channel['이름'] || '이름 없음',
      url: channel['주소'] === 'nan' ? null : channel['주소'],
      member_count: parseNumber(channel['회원수']) || parseNumber(channel['인원']),
      view_count: parseNumber(channel['조회수']),
      posted_date: parseDate(channel['게재일']),
      registered_date: parseDate(channel['등록일']),
      deleted_date: parseDate(channel['삭제일']),
      result: channel['결과'] === 'nan' ? null : channel['결과'],
      memo: channel['메모'] === 'nan' ? null : channel['메모'],
      email: channel['이메일 주소'] === 'nan' ? null : channel['이메일 주소'],
      phone: channel['전화번호'] === 'nan' ? null : channel['전화번호'],
      homepage_url: channel['홈페이지 주소'] === 'nan' ? null : channel['홈페이지 주소'],
      attributes: attributes,
      is_active: true
    };
    
    channelsToInsert.push(channelData);
  }
  
  console.log('\n채널 유형별 개수:');
  for (const [type, count] of Object.entries(channelTypeCounts)) {
    console.log(`  ${type}: ${count}개`);
  }
  
  // 배치 삽입 (100개씩)
  console.log(`\n총 ${channelsToInsert.length}개 채널 삽입 시작...`);
  
  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < channelsToInsert.length; i += batchSize) {
    const batch = channelsToInsert.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('campaign_channels')
      .insert(batch);
    
    if (error) {
      console.error(`배치 ${i/batchSize + 1} 삽입 실패:`, error.message);
      errorCount += batch.length;
    } else {
      successCount += batch.length;
      process.stdout.write(`\r진행: ${successCount}/${channelsToInsert.length}`);
    }
  }
  
  console.log('\n');
  console.log(`✅ 성공: ${successCount}개`);
  if (errorCount > 0) {
    console.log(`❌ 실패: ${errorCount}개`);
  }
  
  // 통계 확인
  const { data: stats, error: statsError } = await supabase
    .from('campaign_channels')
    .select('channel_type')
    .select('*', { count: 'exact', head: false });
  
  if (!statsError && stats) {
    console.log(`\n데이터베이스 총 채널 수: ${stats.length}`);
  }
  
  console.log('\n채널 임포트 완료!');
}

importChannels().catch(console.error);