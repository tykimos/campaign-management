import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const anonSupabase = createClient(supabaseUrl, anonKey);

async function verifyFix() {
  console.log('Verifying the fix for campaign update...\n');
  
  // Find campaign with ID 10 or create a new one
  const { data: campaigns, error: selectError } = await anonSupabase
    .from('campaigns')
    .select('*')
    .eq('id', 10);
  
  if (selectError) {
    console.error('Error selecting campaign:', selectError);
    return;
  }
  
  if (!campaigns || campaigns.length === 0) {
    console.log('Campaign ID 10 not found.');
    return;
  }
  
  const campaign = campaigns[0];
  console.log('Found campaign:', campaign);
  
  // Test the workaround approach
  console.log('\nTesting workaround approach (UPDATE then SELECT separately)...');
  
  // Step 1: Update without select
  const updateTime = new Date().toISOString();
  const { error: updateError } = await anonSupabase
    .from('campaigns')
    .update({
      description: `Updated via workaround at ${updateTime}`,
      updated_at: updateTime
    })
    .eq('id', 10);
  
  if (updateError) {
    console.error('❌ Update failed:', updateError);
    return;
  }
  
  console.log('✅ Update executed successfully (no error)');
  
  // Step 2: Fetch the updated data
  const { data: updatedCampaign, error: fetchError } = await anonSupabase
    .from('campaigns')
    .select('*')
    .eq('id', 10)
    .single();
  
  if (fetchError) {
    console.error('❌ Failed to fetch updated campaign:', fetchError);
  } else {
    console.log('✅ Successfully fetched updated campaign:');
    console.log('  Name:', updatedCampaign.name);
    console.log('  Description:', updatedCampaign.description);
    console.log('  Updated at:', updatedCampaign.updated_at);
    
    if (updatedCampaign.description && updatedCampaign.description.includes(updateTime)) {
      console.log('\n🎉 SUCCESS! The update was applied and retrieved correctly.');
      console.log('The workaround is working - UPDATE then SELECT separately.');
    } else {
      console.log('\n⚠️  Update may not have been applied correctly.');
    }
  }
}

verifyFix().catch(console.error);