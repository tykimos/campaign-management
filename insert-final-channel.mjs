import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zaivjzyuxyajadfwfbkx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaXZqenl1eHlhamFkZndmYmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzU0ODcsImV4cCI6MjA4MDM1MTQ4N30.oUUulgOnIpnQCcuG7IvzYB0MT_FzPlWzqz2qh3orXPY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertFinalChannel() {
  console.log('Inserting the final missing channel...');
  
  const { data: channelType } = await supabase
    .from('channel_types')
    .select('id')
    .eq('code', 'portal_cafe')
    .single();
  
  if (!channelType) {
    console.error('Channel type not found');
    return;
  }
  
  const longUrl = 'https://cafe.naver.com/allcontests?iframe_url=%2FArticleRead.nhn%3Fclubid%3D26847419%26articleid%3D46155%26art%3DaW50ZXJuYWwtY2FmZS13ZWItc2VjdGlvbi1zZWFyY2gtbGlzdA.eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjYWZlVHlwZSI6IkNBRkVfVVJMIiwiYXJ0aWNsZUlkIjo0NjE1NSwiY2FmZVVybCI6ImFsbGNvbnRlc3RzIiwiaXNzdWVkQXQiOjE3NTMxNjY1NTA0MDN9.RcTpmV7lDxQxwF1SygEZnl9_PhS6rTi9OXRCMOXqwEA%26query%3D%25EB%2584%25A4%25ED%258A%25B8%25EC%259B%258C%25ED%2581%25AC%2520%25EC%25A7%2580%25EB%258A%25A5%25ED%2599%2594%2520%25EC%259D%25B8%25EA%25B3%25B5%25EC%25A7%2580%25EB%258A%25A5%2520%25ED%2595%25B4%25EC%25BB%25A4%25ED%2586%25A4';
  
  // Keep the base URL only
  const shortUrl = 'https://cafe.naver.com/allcontests';
  
  const channelData = {
    channel_type_id: channelType.id,
    name: '인사이드(inside)',
    url: shortUrl,
    member_count: 2568,
    memo: `원래 URL: ${longUrl}`,
    registration_date: '2025-09-01',
    update_date: new Date().toISOString().split('T')[0],
    is_active: true
  };
  
  console.log('Inserting with data:', {
    ...channelData,
    memo: channelData.memo.substring(0, 50) + '...'
  });
  
  const { error } = await supabase
    .from('channels_v2')
    .insert(channelData);
  
  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('✓ Successfully inserted the final channel!');
  }
  
  // Check total count
  const { count } = await supabase
    .from('channels_v2')
    .select('id', { count: 'exact' });
  
  console.log(`\nTotal channels in database: ${count}`);
}

insertFinalChannel();