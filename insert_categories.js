import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function insertCategories() {
  console.log('캠페인 카테고리 추가 중...\n');
  
  const categories = [
    {
      name: '경진대회',
      description: 'AI, 데이터분석, 개발 등 각종 경진대회',
      is_active: true,
      display_order: 1
    },
    {
      name: '세미나',
      description: '기술 세미나, 워크샵, 컨퍼런스 등',
      is_active: true,
      display_order: 2
    },
    {
      name: '이벤트',
      description: '채용박람회, 네트워킹, 기타 이벤트',
      is_active: true,
      display_order: 3
    }
  ];
  
  // 먼저 기존 카테고리 확인
  const { data: existingCategories, error: fetchError } = await supabase
    .from('campaign_categories')
    .select('*');
  
  if (fetchError) {
    console.error('기존 카테고리 조회 실패:', fetchError);
    return;
  }
  
  console.log('기존 카테고리:', existingCategories?.length || 0, '개\n');
  
  // 기존 카테고리 삭제 (깨끗하게 시작)
  if (existingCategories && existingCategories.length > 0) {
    const { error: deleteError } = await supabase
      .from('campaign_categories')
      .delete()
      .gte('id', 0);
    
    if (deleteError) {
      console.error('기존 카테고리 삭제 실패:', deleteError);
      return;
    }
    console.log('기존 카테고리 삭제 완료\n');
  }
  
  // 새 카테고리 추가
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
  
  // 기존 캠페인 업데이트 (NIA 딥페이크 경진대회를 경진대회 카테고리로)
  const competitionCategory = insertedCategories.find(c => c.name === '경진대회');
  if (competitionCategory) {
    const { data: campaigns, error: campaignFetchError } = await supabase
      .from('campaigns')
      .select('id, name')
      .like('name', '%경진대회%');
    
    if (!campaignFetchError && campaigns && campaigns.length > 0) {
      console.log('\n경진대회 카테고리로 캠페인 업데이트 중...');
      
      for (const campaign of campaigns) {
        const { error: updateError } = await supabase
          .from('campaigns')
          .update({ category_id: competitionCategory.id })
          .eq('id', campaign.id);
        
        if (!updateError) {
          console.log(`  ✅ "${campaign.name}" 업데이트 완료`);
        }
      }
    }
  }
  
  console.log('\n카테고리 설정 완료!');
}

insertCategories().catch(console.error);