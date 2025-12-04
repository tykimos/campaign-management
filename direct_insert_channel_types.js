import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// anon key를 사용하여 접속
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertChannelTypesToExistingTable() {
  console.log('기존 campaign_channels 테이블에 채널 유형 정보 추가...\n');

  try {
    // 채널 유형 매핑
    const typeMapping = {
      '플랫폼서비스': { icon: '🌐', order: 1 },
      '정부기관': { icon: '🏛️', order: 2 },
      '공모전': { icon: '🏆', order: 3 },
      '포털카페': { icon: '☕', order: 4 },
      'SNS그룹': { icon: '📱', order: 5 },
      '커뮤니티': { icon: '👥', order: 6 },
      '오픈단톡방': { icon: '💬', order: 7 },
      '디스코드': { icon: '🎮', order: 8 },
      '공문-대학원': { icon: '🎓', order: 9 },
      '공문-대학교': { icon: '🏫', order: 10 },
      '공문-고등학교': { icon: '📚', order: 11 },
      'DM-학회': { icon: '📧', order: 12 },
      'DM-협회': { icon: '📨', order: 13 },
      'DM-대학': { icon: '✉️', order: 14 },
      '옥외광고-대학': { icon: '🎯', order: 15 },
      '옥외광고-출연연NST': { icon: '📍', order: 16 },
      '옥외광고-협력기관': { icon: '📌', order: 17 },
      '퍼포먼스': { icon: '📊', order: 18 },
      '이벤트사이트': { icon: '🎪', order: 19 }
    };

    // 기존 채널들 가져오기
    const { data: channels, error: fetchError } = await supabase
      .from('campaign_channels')
      .select('*')
      .order('id');

    if (fetchError) {
      console.error('채널 조회 오류:', fetchError);
      return;
    }

    console.log(`총 ${channels.length}개 채널 발견`);

    // 각 채널의 description 업데이트
    let updateCount = 0;
    for (const channel of channels) {
      // description에서 유형 추출
      let channelType = null;
      let typeIcon = '📁';
      
      // description 첫 부분에서 유형 찾기
      for (const [typeName, typeInfo] of Object.entries(typeMapping)) {
        if (channel.description && channel.description.includes(typeName)) {
          channelType = typeName;
          typeIcon = typeInfo.icon;
          break;
        }
      }

      // category 기반 유형 추측
      if (!channelType) {
        if (channel.category === 'contest') {
          channelType = '공모전';
          typeIcon = '🏆';
        } else if (channel.category === 'sns') {
          channelType = 'SNS그룹';
          typeIcon = '📱';
        } else if (channel.category === 'community') {
          channelType = '커뮤니티';
          typeIcon = '👥';
        } else if (channel.name && channel.name.includes('카페')) {
          channelType = '포털카페';
          typeIcon = '☕';
        } else if (channel.name && channel.name.includes('대학')) {
          channelType = '공문-대학교';
          typeIcon = '🏫';
        } else if (channel.url && channel.url.includes('discord')) {
          channelType = '디스코드';
          typeIcon = '🎮';
        } else if (channel.url && channel.url.includes('open.kakao')) {
          channelType = '오픈단톡방';
          typeIcon = '💬';
        } else {
          channelType = '플랫폼서비스';
          typeIcon = '🌐';
        }
      }

      // description 업데이트
      const newDescription = channel.description 
        ? `[${typeIcon} ${channelType}] ${channel.description.replace(/^\[.*?\]\s*/, '').replace(new RegExp(`^${channelType}\\s*-?\\s*`), '')}`
        : `[${typeIcon} ${channelType}]`;

      if (newDescription !== channel.description) {
        const { error: updateError } = await supabase
          .from('campaign_channels')
          .update({ description: newDescription })
          .eq('id', channel.id);

        if (!updateError) {
          updateCount++;
          console.log(`✅ ${channel.name} → ${channelType}`);
        } else {
          console.error(`❌ ${channel.name} 업데이트 실패:`, updateError.message);
        }
      }
    }

    console.log(`\n✅ 완료: ${updateCount}개 채널 유형 정보 업데이트`);

    // 통계 출력
    console.log('\n📊 채널 유형별 통계:');
    const { data: updatedChannels } = await supabase
      .from('campaign_channels')
      .select('description');

    const stats = {};
    updatedChannels?.forEach(ch => {
      const match = ch.description?.match(/\[(.*?)\s+(.*?)\]/);
      if (match) {
        const type = match[2];
        stats[type] = (stats[type] || 0) + 1;
      }
    });

    for (const [type, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
      const icon = typeMapping[type]?.icon || '📁';
      console.log(`${icon} ${type}: ${count}개`);
    }

  } catch (error) {
    console.error('오류 발생:', error);
  }
}

insertChannelTypesToExistingTable().catch(console.error);