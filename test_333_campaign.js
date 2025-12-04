import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const anonSupabase = createClient(supabaseUrl, anonKey);

async function test333Campaign() {
  console.log('Testing 333 campaign creation and update...\n');
  
  // 1. Create campaign with title "333제목"
  console.log('1. Creating campaign with title "333제목"...');
  const { data: newCampaign, error: insertError } = await anonSupabase
    .from('campaigns')
    .insert({
      name: '333제목',
      status: 'active'
    })
    .select()
    .single();
  
  if (insertError) {
    console.error('❌ INSERT failed:', insertError);
    return;
  }
  
  console.log('✅ Campaign created successfully!');
  console.log('Campaign ID:', newCampaign.id);
  console.log('Campaign:', newCampaign);
  
  // 2. Now try to update it
  console.log('\n2. Trying to update the campaign...');
  const { data: updatedCampaign, error: updateError } = await anonSupabase
    .from('campaigns')
    .update({
      name: '333제목 - 수정됨',
      description: '테스트 설명'
    })
    .eq('id', newCampaign.id)
    .select()
    .single();
  
  if (updateError) {
    console.error('❌ UPDATE failed:', updateError);
    console.log('\nFull error details:', JSON.stringify(updateError, null, 2));
    
    // Check what the exact error is
    if (updateError.code === '42501') {
      console.log('\n⚠️  This is an RLS policy violation!');
      console.log('The UPDATE policy is blocking this operation.');
    }
    
    // Try with service key to confirm it's RLS
    console.log('\n3. Testing same update with service key...');
    const serviceSupabase = createClient(supabaseUrl, process.env.SUPABASE_SECRET_KEY);
    
    const { data: serviceUpdate, error: serviceError } = await serviceSupabase
      .from('campaigns')
      .update({
        name: '333제목 - 서비스키로 수정',
        description: '서비스 키 테스트'
      })
      .eq('id', newCampaign.id)
      .select()
      .single();
    
    if (serviceError) {
      console.error('❌ Service key update also failed:', serviceError);
    } else {
      console.log('✅ Service key update works!');
      console.log('Updated campaign:', serviceUpdate);
      console.log('\n🔍 This confirms the issue is with RLS policies for anon key.');
    }
  } else {
    console.log('✅ UPDATE successful!');
    console.log('Updated campaign:', updatedCampaign);
  }
  
  // Check current campaigns to see the state
  console.log('\n4. Checking all campaigns...');
  const { data: allCampaigns, error: fetchError } = await anonSupabase
    .from('campaigns')
    .select('id, name, created_by, updated_at')
    .order('id', { ascending: false })
    .limit(5);
  
  if (!fetchError) {
    console.log('Recent campaigns:');
    allCampaigns.forEach(c => {
      console.log(`  ID ${c.id}: ${c.name} (created_by: ${c.created_by || 'NULL'})`);
    });
  }
}

test333Campaign();