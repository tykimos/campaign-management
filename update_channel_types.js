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

async function updateChannelTypes() {
  console.log('채널 타입 업데이트 시작...\n');
  
  // CSV 파일 읽기
  const csvText = readFileSync('all_channels.csv', 'utf-8');
  const { data: channels } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true
  });
  
  console.log(`총 ${channels.length}개 채널 로드됨\n`);
  
  // 채널 유형별로 그룹화
  const channelsByType = {};
  channels.forEach(ch => {
    const type = ch.channel_type;
    if (!channelsByType[type]) {
      channelsByType[type] = [];
    }
    channelsByType[type].push(ch['이름']);
  });
  
  // 각 유형별로 업데이트
  let totalUpdated = 0;
  
  for (const [korType, engType] of Object.entries(channelTypeMapping)) {
    const channelNames = channelsByType[korType];
    if (!channelNames || channelNames.length === 0) continue;
    
    console.log(`${korType} (${engType}): ${channelNames.length}개 업데이트 중...`);
    
    // 배치 업데이트
    for (let i = 0; i < channelNames.length; i += 50) {
      const batch = channelNames.slice(i, i + 50).filter(name => name && name !== 'nan');
      
      const { data, error } = await supabase
        .from('campaign_channels')
        .update({ 
          channel_type: engType,
          category: null  // category 필드 제거
        })
        .in('name', batch);
      
      if (error) {
        console.error(`  에러:`, error.message);
      } else {
        totalUpdated += batch.length;
        process.stdout.write(`\r  진행: ${Math.min(i + 50, channelNames.length)}/${channelNames.length}`);
      }
    }
    console.log('');
  }
  
  console.log(`\n✅ 총 ${totalUpdated}개 채널 유형 업데이트 완료`);
  
  // 통계 확인
  const { data: stats } = await supabase
    .from('campaign_channels')
    .select('channel_type');
  
  if (stats) {
    const typeCounts = {};
    stats.forEach(ch => {
      typeCounts[ch.channel_type] = (typeCounts[ch.channel_type] || 0) + 1;
    });
    
    console.log('\n최종 채널 유형별 개수:');
    for (const [type, count] of Object.entries(typeCounts)) {
      const korName = Object.entries(channelTypeMapping).find(([k, v]) => v === type)?.[0];
      console.log(`  ${korName || type}: ${count}개`);
    }
  }
}

updateChannelTypes().catch(console.error);