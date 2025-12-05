import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';

const SUPABASE_URL = 'https://zaivjzyuxyajadfwfbkx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaXZqenl1eHlhamFkZndmYmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzU0ODcsImV4cCI6MjA4MDM1MTQ4N30.oUUulgOnIpnQCcuG7IvzYB0MT_FzPlWzqz2qh3orXPY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Channel type mapping based on Korean names (sheet names)
const channelTypeMapping = {
  '플랫폼서비스': 'platform_service',
  '정부기관': 'government',
  '공모전': 'competition',
  '포털카페': 'portal_cafe',
  'SNS그룹': 'sns_group',
  '커뮤니티': 'community',
  '오픈단톡방': 'open_chat',
  '디스코드': 'discord',
  '공문-대학원': 'official_graduate',
  '공문-대학교': 'official_university',
  '공문-고등학교': 'official_highschool',
  'DM-학회': 'dm_academic',
  'DM-협회': 'dm_association',
  'DM-대학': 'dm_university',
  '옥외광고-대학': 'outdoor_university',
  '옥외광고-출연연NST': 'outdoor_nst',
  '옥외광고-협력기관': 'outdoor_partner',
  '옥외광고-기관': 'outdoor_partner',
  '퍼포먼스': 'performance',
  '이벤트사이트': 'event_site',
  '블로그': 'community'
};

// Parse date in various formats
function parseDate(dateValue) {
  if (!dateValue) return new Date().toISOString().split('T')[0];
  
  if (typeof dateValue === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
    return date.toISOString().split('T')[0];
  }
  
  if (typeof dateValue === 'string') {
    const cleaned = dateValue.replace(/\./g, '-').replace(/-$/, '').trim();
    try {
      const date = new Date(cleaned);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {
      // Fall through
    }
  }
  
  return new Date().toISOString().split('T')[0];
}

async function importChannels() {
  try {
    console.log('Reading Excel file...\n');
    
    const workbook = XLSX.readFile('data/2026 NRF AI Co-Scientist Challenge Korea 경진대회 - 홍보 대시보드.xlsx');
    
    // First, get all channel types from database
    const { data: channelTypes } = await supabase
      .from('channel_types')
      .select('id, code');
    
    const typeIdMap = {};
    for (const type of channelTypes) {
      typeIdMap[type.code] = type.id;
    }
    
    // Get all existing channels to check for duplicates
    const { data: existingChannels } = await supabase
      .from('channels_v2')
      .select('name, channel_type_id');
    
    const existingSet = new Set(
      existingChannels.map(ch => `${ch.name}|${ch.channel_type_id}`)
    );
    
    console.log(`Found ${existingChannels.length} existing channels\n`);
    
    // Process all channels from all sheets
    const allChannelsToInsert = [];
    let skippedCount = 0;
    
    for (const sheetName of workbook.SheetNames) {
      // Skip dashboard and unmapped sheets
      if (sheetName === '대시보드' || !channelTypeMapping[sheetName]) {
        continue;
      }
      
      const typeCode = channelTypeMapping[sheetName];
      const typeId = typeIdMap[typeCode];
      
      if (!typeId) {
        console.log(`Skipping sheet "${sheetName}" - type not in database`);
        continue;
      }
      
      console.log(`Processing ${sheetName}...`);
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      
      let sheetAddCount = 0;
      let sheetSkipCount = 0;
      
      for (const row of data) {
        const channelName = 
          row['이름'] || row['이름 '] || row['Name'] || row['채널'] || 
          row['명칭'] || row['제목'] || row['채널명'] || '';
        
        if (!channelName || channelName.toString().trim() === '') {
          continue;
        }
        
        const cleanName = channelName.toString().trim().substring(0, 500); // Truncate to 500 chars
        const key = `${cleanName}|${typeId}`;
        
        if (existingSet.has(key)) {
          sheetSkipCount++;
          skippedCount++;
          continue;
        }
        
        const url = row['주소'] || row['URL'] || row['링크'] || row['Link'] || null;
        const memberCount = row['회원수'] || row['인원'] || row['Members'] || row['참가자'] || null;
        const contactPerson = row['담당자'] || row['Contact'] || row['연락처명'] || row['언론/과학문화 담당'] || null;
        const email = row['이메일'] || row['Email'] || row['메일'] || row['이메일 주소'] || null;
        const phone = row['연락처'] || row['전화'] || row['Phone'] || row['전화번호'] || row['대표전화'] || row['담당연락처'] || null;
        const memo = row['메모'] || row['비고'] || row['Note'] || row['설명'] || null;
        const registrationDate = parseDate(row['등록일'] || row['등록날짜'] || row['작성일']);
        
        allChannelsToInsert.push({
          channel_type_id: typeId,
          name: cleanName,
          url: url ? url.toString().trim().substring(0, 1000) : null,
          member_count: memberCount ? parseInt(memberCount) : null,
          email: email ? email.toString().trim().substring(0, 255) : null,
          contact_person: contactPerson ? contactPerson.toString().trim().substring(0, 255) : null,
          contact_phone: phone ? phone.toString().trim().substring(0, 50) : null,
          memo: memo ? memo.toString().trim().substring(0, 1000) : null,
          registration_date: registrationDate,
          update_date: new Date().toISOString().split('T')[0],
          is_active: true
        });
        
        existingSet.add(key);
        sheetAddCount++;
      }
      
      console.log(`  ${sheetName}: ${sheetAddCount} to add, ${sheetSkipCount} already exist`);
    }
    
    console.log(`\nTotal channels to insert: ${allChannelsToInsert.length}`);
    
    if (allChannelsToInsert.length > 0) {
      // Insert in batches of 100
      const batchSize = 100;
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < allChannelsToInsert.length; i += batchSize) {
        const batch = allChannelsToInsert.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('channels_v2')
          .insert(batch);
        
        if (error) {
          console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error.message);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
          console.log(`Inserted batch ${Math.floor(i/batchSize) + 1} (${batch.length} channels)`);
        }
      }
      
      console.log('\n=== Import Complete ===');
      console.log(`Successfully imported: ${successCount} channels`);
      console.log(`Skipped (already exists): ${skippedCount}`);
      console.log(`Errors: ${errorCount}`);
    } else {
      console.log('\n=== Import Complete ===');
      console.log('No new channels to import');
      console.log(`Skipped (already exists): ${skippedCount}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the import
importChannels();