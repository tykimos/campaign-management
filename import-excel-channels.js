const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');

const SUPABASE_URL = 'https://zaivjzyuxyajadfwfbkx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaXZqenl1eHlhamFkZndmYmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzU0ODcsImV4cCI6MjA4MDM1MTQ4N30.oUUulgOnIpnQCcuG7IvzYB0MT_FzPlWzqz2qh3orXPY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Channel type mapping based on Korean names
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
  '퍼포먼스': 'performance',
  '이벤트사이트': 'event_site'
};

async function getChannelTypeId(typeName) {
  // Get the code from Korean name
  const code = channelTypeMapping[typeName];
  if (!code) {
    console.log(`Unknown channel type: ${typeName}`);
    return null;
  }
  
  // Fetch the channel type from database
  const { data, error } = await supabase
    .from('channel_types')
    .select('id')
    .eq('code', code)
    .single();
  
  if (error) {
    console.error(`Error fetching channel type for ${typeName}:`, error);
    return null;
  }
  
  return data?.id;
}

async function importChannels() {
  try {
    console.log('Reading Excel file...\n');
    
    const workbook = XLSX.readFile('data/2026 NRF AI Co-Scientist Challenge Korea 경진대회 - 홍보 대시보드.xlsx');
    
    // List all sheet names
    console.log('Available sheets:', workbook.SheetNames);
    
    // Process all sheets to find channel data
    let allChannels = [];
    
    for (const sheetName of workbook.SheetNames) {
      console.log(`\nProcessing sheet: "${sheetName}"`);
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      
      if (data.length > 0) {
        console.log(`Found ${data.length} rows`);
        console.log('Column names:', Object.keys(data[0]));
        
        // Show first row as sample
        console.log('Sample row:', data[0]);
        
        allChannels = allChannels.concat(data);
      }
    }
    
    console.log(`\nTotal rows found: ${allChannels.length}\n`);
    
    // Process each row
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const row of allChannels) {
      // Try various field names for channel type
      const channelType = row['채널유형'] || row['유형'] || row['Type'] || row['분류'] || row['구분'];
      
      // Try various field names for channel name
      const channelName = row['채널명'] || row['이름'] || row['Name'] || row['채널'] || row['명칭'] || row['제목'];
      
      // Other fields
      const url = row['URL'] || row['링크'] || row['Link'] || row['주소'] || '';
      const memberCount = row['인원'] || row['회원수'] || row['Members'] || row['참가자'] || 0;
      const contactPerson = row['담당자'] || row['Contact'] || row['연락처명'] || '';
      const email = row['이메일'] || row['Email'] || row['메일'] || '';
      const phone = row['연락처'] || row['전화'] || row['Phone'] || row['전화번호'] || '';
      const memo = row['메모'] || row['비고'] || row['Note'] || row['설명'] || '';
      const registrationDate = row['등록일'] || row['등록날짜'] || row['작성일'] || new Date().toISOString().split('T')[0];
      
      // Check if this row has valid channel data
      if (!channelName || channelName.toString().trim() === '') {
        skippedCount++;
        continue;
      }
      
      // If no channel type specified, skip or use default
      if (!channelType) {
        console.log(`Skipping row - no channel type for: ${channelName}`);
        skippedCount++;
        continue;
      }
      
      // Get channel type ID
      const channelTypeId = await getChannelTypeId(channelType);
      if (!channelTypeId) {
        console.log(`Skipping channel "${channelName}" - unknown type: ${channelType}`);
        errorCount++;
        continue;
      }
      
      // Prepare channel data
      const channelData = {
        channel_type_id: channelTypeId,
        name: channelName.toString().trim(),
        url: url ? url.toString().trim() : null,
        member_count: parseInt(memberCount) || null,
        email: email ? email.toString().trim() : null,
        contact_person: contactPerson ? contactPerson.toString().trim() : null,
        contact_phone: phone ? phone.toString().trim() : null,
        memo: memo ? memo.toString().trim() : null,
        registration_date: registrationDate,
        update_date: new Date().toISOString().split('T')[0],
        is_active: true
      };
      
      // Check if channel already exists
      const { data: existing } = await supabase
        .from('channels_v2')
        .select('id')
        .eq('name', channelData.name)
        .eq('channel_type_id', channelData.channel_type_id)
        .single();
      
      if (existing) {
        console.log(`Channel already exists: ${channelName} (${channelType})`);
        skippedCount++;
        continue;
      }
      
      // Insert channel
      const { error } = await supabase
        .from('channels_v2')
        .insert([channelData]);
      
      if (error) {
        console.error(`Error inserting channel "${channelName}":`, error.message);
        errorCount++;
      } else {
        console.log(`✓ Inserted channel: ${channelName} (${channelType})`);
        successCount++;
      }
    }
    
    console.log('\n=== Import Complete ===');
    console.log(`Successfully imported: ${successCount} channels`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Error reading Excel file:', error);
  }
}

// Run the import
importChannels();