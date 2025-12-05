import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import fs from 'fs';

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
  '옥외광고-기관': 'outdoor_partner', // 옥외광고-기관 maps to outdoor_partner
  '퍼포먼스': 'performance',
  '이벤트사이트': 'event_site',
  '블로그': 'community' // Blog can map to community
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

// Parse date in various formats
function parseDate(dateValue) {
  if (!dateValue) return new Date().toISOString().split('T')[0];
  
  // If it's a number (Excel serial date)
  if (typeof dateValue === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
    return date.toISOString().split('T')[0];
  }
  
  // If it's a string like "2025. 1. 1."
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
    
    // List all sheet names
    console.log('Available sheets:', workbook.SheetNames);
    
    // Process each sheet (each sheet represents a channel type)
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const sheetName of workbook.SheetNames) {
      // Skip the dashboard sheet
      if (sheetName === '대시보드') {
        continue;
      }
      
      // Get channel type ID from sheet name
      const channelTypeId = await getChannelTypeId(sheetName);
      if (!channelTypeId) {
        console.log(`\nSkipping sheet "${sheetName}" - not a valid channel type`);
        continue;
      }
      
      console.log(`\n=== Processing ${sheetName} ===`);
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      
      if (data.length === 0) {
        console.log(`No data in sheet`);
        continue;
      }
      
      console.log(`Found ${data.length} channels`);
      
      for (const row of data) {
        // Try various field names for channel name (trimmed keys)
        const channelName = 
          row['이름'] || row['이름 '] || row['Name'] || row['채널'] || 
          row['명칭'] || row['제목'] || row['채널명'] || '';
        
        // Skip if no channel name
        if (!channelName || channelName.toString().trim() === '') {
          continue;
        }
        
        // Other fields
        const url = row['주소'] || row['URL'] || row['링크'] || row['Link'] || null;
        const memberCount = row['회원수'] || row['인원'] || row['Members'] || row['참가자'] || null;
        const contactPerson = row['담당자'] || row['Contact'] || row['연락처명'] || row['언론/과학문화 담당'] || null;
        const email = row['이메일'] || row['Email'] || row['메일'] || row['이메일 주소'] || null;
        const phone = row['연락처'] || row['전화'] || row['Phone'] || row['전화번호'] || row['대표전화'] || row['담당연락처'] || null;
        const memo = row['메모'] || row['비고'] || row['Note'] || row['설명'] || null;
        const registrationDate = parseDate(row['등록일'] || row['등록날짜'] || row['작성일']);
        const viewCount = row['조회수'] || null;
        const result = row['결과'] || null;
        
        // Prepare channel data
        const channelData = {
          channel_type_id: channelTypeId,
          name: channelName.toString().trim(),
          url: url ? url.toString().trim() : null,
          member_count: memberCount ? parseInt(memberCount) : null,
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
          console.log(`  Already exists: ${channelName}`);
          skippedCount++;
          continue;
        }
        
        // Insert channel
        const { error } = await supabase
          .from('channels_v2')
          .insert([channelData]);
        
        if (error) {
          console.error(`  Error inserting "${channelName}":`, error.message);
          errorCount++;
        } else {
          console.log(`  ✓ Imported: ${channelName}`);
          successCount++;
        }
      }
    }
    
    console.log('\n=== Import Complete ===');
    console.log(`Successfully imported: ${successCount} channels`);
    console.log(`Skipped (already exists): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Error reading Excel file:', error);
  }
}

// Run the import
importChannels();