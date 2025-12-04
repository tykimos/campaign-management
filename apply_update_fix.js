import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

console.log('Applying UPDATE policy fix...\n');

// We cannot execute raw SQL via API, but we can:
// 1. Test current state
// 2. Provide instructions for manual fix

const serviceSupabase = createClient(supabaseUrl, serviceKey);
const anonSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);

async function applyFix() {
  console.log('1. Testing current UPDATE capability with anon key...');
  
  // Get a campaign to test with
  const { data: campaigns, error: fetchError } = await anonSupabase
    .from('campaigns')
    .select('id, name')
    .limit(1);
  
  if (fetchError) {
    console.error('Cannot fetch campaigns:', fetchError);
    return;
  }
  
  if (!campaigns || campaigns.length === 0) {
    console.log('No campaigns found to test with');
    return;
  }
  
  const testCampaign = campaigns[0];
  console.log(`Testing UPDATE on campaign: ${testCampaign.name} (ID: ${testCampaign.id})`);
  
  // Try to update
  const { error: updateError } = await anonSupabase
    .from('campaigns')
    .update({ 
      updated_at: new Date().toISOString()
    })
    .eq('id', testCampaign.id);
  
  if (updateError) {
    console.error('❌ UPDATE failed with anon key:', updateError.message);
    
    console.log('\n=== IMMEDIATE FIX REQUIRED ===');
    console.log('The UPDATE policy is blocking anonymous updates.');
    console.log('\nPlease run this SQL in Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx/sql/new\n');
    
    const fixSQL = fs.readFileSync('./fix_update_policy.sql', 'utf8');
    console.log(fixSQL);
    
    console.log('\n=== ALTERNATIVE: Direct Service Key Update ===');
    console.log('Since we cannot fix RLS via API, let me update the campaign directly with service key...\n');
    
    // Use service key to bypass RLS
    const { error: serviceError } = await serviceSupabase
      .from('campaigns')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', testCampaign.id);
    
    if (serviceError) {
      console.error('❌ Even service key failed:', serviceError);
    } else {
      console.log('✅ Service key update successful!');
      console.log('This confirms RLS is the issue, not the database itself.');
    }
    
  } else {
    console.log('✅ UPDATE works with anon key! The issue is resolved.');
  }
  
  console.log('\n2. Testing INSERT capability with anon key...');
  
  const { data: newCampaign, error: insertError } = await anonSupabase
    .from('campaigns')
    .insert({
      name: 'Test Campaign ' + Date.now(),
      status: 'active'
    })
    .select()
    .single();
  
  if (insertError) {
    console.error('❌ INSERT failed:', insertError.message);
    console.log('Run the SQL above to fix both INSERT and UPDATE.');
  } else {
    console.log('✅ INSERT works!');
    
    // Clean up
    await serviceSupabase
      .from('campaigns')
      .delete()
      .eq('id', newCampaign.id);
    console.log('Test campaign cleaned up.');
  }
}

applyFix();