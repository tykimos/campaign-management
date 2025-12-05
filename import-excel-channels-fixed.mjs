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

// Truncate string safely
function truncate(str, maxLength) {
  if (!str) return null;
  const trimmed = str.toString().trim();
  if (trimmed.length <= maxLength) return trimmed;
  
  // If truncating, try to cut at a word boundary
  const truncated = trimmed.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // If there's a space in the last 20 characters, cut there
  if (lastSpace > maxLength - 20) {
    return truncated.substring(0, lastSpace);
  }
  
  return truncated;
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
      existingChannels.map(ch => `${ch.name.substring(0, 490)}|${ch.channel_type_id}`)
    );
    
    console.log(`Found ${existingChannels.length} existing channels\n`);
    
    // Process all channels from all sheets
    const allChannelsToInsert = [];
    let skippedCount = 0;
    let truncatedCount = 0;
    
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
      let sheetTruncatedCount = 0;
      
      for (const row of data) {
        const channelName = 
          row['이름'] || row['이름 '] || row['Name'] || row['채널'] || 
          row['명칭'] || row['제목'] || row['채널명'] || '';
        
        if (!channelName || channelName.toString().trim() === '') {
          continue;
        }
        
        const originalName = channelName.toString().trim();
        const cleanName = truncate(originalName, 490); // Leave room for safety
        
        if (originalName.length > 490) {
          sheetTruncatedCount++;
          truncatedCount++;
          console.log(`  Truncating: "${originalName.substring(0, 50)}..." (${originalName.length} -> ${cleanName.length} chars)`);
        }
        
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
        let memo = row['메모'] || row['비고'] || row['Note'] || row['설명'] || null;
        const registrationDate = parseDate(row['등록일'] || row['등록날짜'] || row['작성일']);
        
        // If name was truncated, add original name to memo
        if (originalName.length > 490) {
          const originalNote = memo ? `${memo}\n` : '';
          memo = `${originalNote}원래 이름: ${originalName}`;
        }
        
        allChannelsToInsert.push({
          channel_type_id: typeId,
          name: cleanName,
          url: truncate(url, 990),
          member_count: memberCount ? parseInt(memberCount) : null,
          email: truncate(email, 250),
          contact_person: truncate(contactPerson, 250),
          contact_phone: truncate(phone, 45),
          memo: truncate(memo, 990),
          registration_date: registrationDate,
          update_date: new Date().toISOString().split('T')[0],
          is_active: true
        });
        
        existingSet.add(key);
        sheetAddCount++;
      }
      
      if (sheetAddCount > 0 || sheetSkipCount > 0) {
        console.log(`  ${sheetName}: ${sheetAddCount} to add, ${sheetSkipCount} already exist${sheetTruncatedCount > 0 ? `, ${sheetTruncatedCount} truncated` : ''}`);
      }
    }
    
    console.log(`\nTotal channels to insert: ${allChannelsToInsert.length}`);
    if (truncatedCount > 0) {
      console.log(`Total names truncated: ${truncatedCount}`);
    }
    
    if (allChannelsToInsert.length > 0) {
      // Insert in batches of 50 (smaller batches for safety)
      const batchSize = 50;
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < allChannelsToInsert.length; i += batchSize) {
        const batch = allChannelsToInsert.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('channels_v2')
          .insert(batch);
        
        if (error) {
          console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error.message);
          
          // Try inserting one by one if batch fails
          console.log('  Trying individual inserts for failed batch...');
          for (const channel of batch) {
            const { error: singleError } = await supabase
              .from('channels_v2')
              .insert([channel]);
            
            if (singleError) {
              console.error(`    Failed: ${channel.name.substring(0, 50)}... - ${singleError.message}`);
              errorCount++;
            } else {
              successCount++;
            }
          }
        } else {
          successCount += batch.length;
          console.log(`Inserted batch ${Math.floor(i/batchSize) + 1} (${batch.length} channels)`);
        }
      }
      
      console.log('\n=== Import Complete ===');
      console.log(`Successfully imported: ${successCount} channels`);
      console.log(`Skipped (already exists): ${skippedCount}`);
      console.log(`Errors: ${errorCount}`);
      if (truncatedCount > 0) {
        console.log(`Names truncated: ${truncatedCount} (original names saved in memo field)`);
      }
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