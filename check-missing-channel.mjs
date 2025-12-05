import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';

const SUPABASE_URL = 'https://zaivjzyuxyajadfwfbkx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaXZqenl1eHlhamFkZndmYmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzU0ODcsImV4cCI6MjA4MDM1MTQ4N30.oUUulgOnIpnQCcuG7IvzYB0MT_FzPlWzqz2qh3orXPY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkMissingChannel() {
  const workbook = XLSX.readFile('data/2026 NRF AI Co-Scientist Challenge Korea 경진대회 - 홍보 대시보드.xlsx');
  
  // Check portal cafe sheet for "인사이드"
  const sheet = workbook.Sheets['포털카페'];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  for (const row of data) {
    const name = row['이름'] || row['이름 '] || '';
    if (name && name.includes('인사이드')) {
      console.log('Found channel:');
      console.log('  Name:', name);
      console.log('  Length:', name.length);
      console.log('  URL:', row['주소'] || 'N/A');
      console.log('  Full row:', row);
      
      // Try to insert with truncated name
      const { data: channelType } = await supabase
        .from('channel_types')
        .select('id')
        .eq('code', 'portal_cafe')
        .single();
      
      if (channelType) {
        const truncatedName = name.substring(0, 490);
        console.log('\nTrying to insert with truncated name (490 chars)...');
        
        const { error } = await supabase
          .from('channels_v2')
          .insert({
            channel_type_id: channelType.id,
            name: truncatedName,
            url: row['주소'] ? row['주소'].substring(0, 990) : null,
            memo: `원래 이름 (${name.length}자): ${name}`,
            registration_date: new Date().toISOString().split('T')[0],
            update_date: new Date().toISOString().split('T')[0],
            is_active: true
          });
        
        if (error) {
          console.error('Insert failed:', error);
        } else {
          console.log('Successfully inserted!');
        }
      }
    }
  }
}

checkMissingChannel();