import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function updateCategories() {
  console.log('캠페인 카테고리 업데이트 중...\n');
  
  // 먼저 기존 카테고리 확인
  const { data: existingCategories, error: fetchError } = await supabase
    .from('campaign_categories')
    .select('*');
  
  if (fetchError) {
    console.error('기존 카테고리 조회 실패:', fetchError);
    return;
  }
  
  console.log('기존 카테고리:');
  existingCategories?.forEach(cat => {
    console.log(`  - ${cat.name} (ID: ${cat.id})`);
  });
  
  // 먼저 캠페인의 카테고리를 null로 설정
  console.log('\n캠페인 카테고리 연결 해제 중...');
  const { error: unlinkError } = await supabase
    .from('campaigns')
    .update({ category_id: null })
    .gte('id', 0);
  
  if (unlinkError) {
    console.error('캠페인 카테고리 해제 실패:', unlinkError);
    return;
  }
  
  // 기존 카테고리 삭제
  console.log('기존 카테고리 삭제 중...');
  const { error: deleteError } = await supabase
    .from('campaign_categories')
    .delete()
    .gte('id', 0);
  
  if (deleteError) {
    console.error('카테고리 삭제 실패:', deleteError);
    return;
  }
  
  // 새 카테고리 추가
  const categories = [
    {
      id: 'competition',
      name: '경진대회',
      description: 'AI, 데이터분석, 개발 등 각종 경진대회',
      is_active: true,
      display_order: 1
    },
    {
      id: 'seminar',
      name: '세미나',
      description: '기술 세미나, 워크샵, 컨퍼런스 등',
      is_active: true,
      display_order: 2
    },
    {
      id: 'event',
      name: '이벤트',
      description: '채용박람회, 네트워킹, 기타 이벤트',
      is_active: true,
      display_order: 3
    }
  ];
  
  console.log('\n새 카테고리 추가 중...');
  const { data: insertedCategories, error: insertError } = await supabase
    .from('campaign_categories')
    .insert(categories)
    .select();
  
  if (insertError) {
    console.error('카테고리 추가 실패:', insertError);
    return;
  }
  
  console.log('✅ 카테고리 추가 완료:');
  insertedCategories.forEach(cat => {
    console.log(`  ${cat.display_order}. ${cat.name} (ID: ${cat.id})`);
  });
  
  // 기존 캠페인 업데이트
  console.log('\n캠페인 카테고리 설정 중...');
  
  // NIA 딥페이크 경진대회
  const { data: competitions, error: compError } = await supabase
    .from('campaigns')
    .select('id, name')
    .or('name.ilike.%경진대회%,name.ilike.%해커톤%,name.ilike.%competition%');
  
  if (!compError && competitions) {
    for (const campaign of competitions) {
      await supabase
        .from('campaigns')
        .update({ category_id: 'competition' })
        .eq('id', campaign.id);
      console.log(`  ✅ "${campaign.name}" → 경진대회`);
    }
  }
  
  // 세미나 카테고리 (예시)
  const { data: seminars, error: semError } = await supabase
    .from('campaigns')
    .select('id, name')
    .or('name.ilike.%세미나%,name.ilike.%워크샵%,name.ilike.%컨퍼런스%');
  
  if (!semError && seminars) {
    for (const campaign of seminars) {
      await supabase
        .from('campaigns')
        .update({ category_id: 'seminar' })
        .eq('id', campaign.id);
      console.log(`  ✅ "${campaign.name}" → 세미나`);
    }
  }
  
  console.log('\n카테고리 설정 완료!');
  
  // 최종 상태 확인
  const { data: finalCategories } = await supabase
    .from('campaign_categories')
    .select('*, campaigns:campaigns(count)')
    .order('display_order');
  
  console.log('\n최종 카테고리 현황:');
  finalCategories?.forEach(cat => {
    console.log(`  ${cat.name}: ${cat.campaigns?.[0]?.count || 0}개 캠페인`);
  });
}

updateCategories().catch(console.error);