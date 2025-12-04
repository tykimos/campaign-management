import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import Papa from 'papaparse';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

// 채널 유형 매핑 (영어로)
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
  
  // 기존 채널 삭제
  console.log('기존 채널 데이터 정리 중...');
  const { error: deleteError } = await supabase
    .from('campaign_channels')
    .delete()
    .gte('id', 0);
  
  if (deleteError) {
    console.log('기존 데이터 삭제 중 오류 (계속 진행):', deleteError.message);
  }
  
  // 채널 데이터 변환 (단순화된 버전)
  const channelsToInsert = [];
  const channelTypeCounts = {};
  
  for (const channel of channels) {
    const channelType = channel.channel_type;
    const channelTypeEng = channelTypeMapping[channelType] || 'other';
    
    if (!channelType) continue;
    
    // 카운트
    channelTypeCounts[channelType] = (channelTypeCounts[channelType] || 0) + 1;
    
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
    
    // 카테고리 매핑 (채널 유형을 카테고리로 변환)
    let category = 'community'; // 기본값
    if (channelTypeEng.includes('competition') || channelTypeEng.includes('contest')) {
      category = 'contest';
    } else if (channelTypeEng.includes('sns') || channelTypeEng.includes('social')) {
      category = 'sns';
    } else if (channelTypeEng.includes('event')) {
      category = 'event';
    } else if (channelTypeEng.includes('community') || channelTypeEng.includes('portal') || 
               channelTypeEng.includes('discord') || channelTypeEng.includes('chat')) {
      category = 'community';
    }
    
    const channelData = {
      name: channel['이름'] || '이름 없음',
      category: category,
      url: channel['주소'] === 'nan' || !channel['주소'] ? null : channel['주소'],
      description: `${channelType} - ${channel['메모'] || ''}`.trim(),
      member_count: parseNumber(channel['회원수']) || parseNumber(channel['인원']) || 0,
      avg_daily_views: parseNumber(channel['조회수']) || 0,
      is_active: true
    };
    
    // 유효한 채널만 추가
    if (channelData.name && channelData.name !== 'nan') {
      channelsToInsert.push(channelData);
    }
  }
  
  console.log('\n채널 유형별 개수:');
  for (const [type, count] of Object.entries(channelTypeCounts)) {
    console.log(`  ${type}: ${count}개`);
  }
  
  console.log(`\n총 ${channelsToInsert.length}개 채널 삽입 시작...`);
  
  // 배치 삽입 (50개씩)
  const batchSize = 50;
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < channelsToInsert.length; i += batchSize) {
    const batch = channelsToInsert.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('campaign_channels')
      .insert(batch)
      .select();
    
    if (error) {
      console.error(`배치 ${Math.floor(i/batchSize) + 1} 삽입 실패:`, error.message);
      errorCount += batch.length;
    } else {
      successCount += data.length;
      process.stdout.write(`\r진행: ${successCount}/${channelsToInsert.length}`);
    }
  }
  
  console.log('\n');
  console.log(`✅ 성공: ${successCount}개`);
  if (errorCount > 0) {
    console.log(`❌ 실패: ${errorCount}개`);
  }
  
  // 통계 확인
  const { data: stats, error: statsError, count } = await supabase
    .from('campaign_channels')
    .select('*', { count: 'exact', head: true });
  
  if (!statsError) {
    console.log(`\n데이터베이스 총 채널 수: ${count}`);
  }
  
  // 카테고리별 통계
  const { data: categoryStats } = await supabase
    .from('campaign_channels')
    .select('category');
  
  if (categoryStats) {
    const categoryCounts = {};
    categoryStats.forEach(ch => {
      categoryCounts[ch.category] = (categoryCounts[ch.category] || 0) + 1;
    });
    
    console.log('\n카테고리별 채널 수:');
    for (const [cat, cnt] of Object.entries(categoryCounts)) {
      console.log(`  ${cat}: ${cnt}개`);
    }
  }
  
  console.log('\n채널 임포트 완료!');
}

importChannels().catch(console.error);