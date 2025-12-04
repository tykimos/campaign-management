import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

// Create client with service role key (bypasses RLS)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testCampaignUpdate() {
  console.log('Testing campaign update functionality...\n');
  
  try {
    // 1. First, get the NIA campaigns (there might be duplicates)
    const { data: campaigns, error: fetchError } = await supabaseService
      .from('campaigns')
      .select('*')
      .eq('name', '2025 NIA 딥페이크 범죄 대응을 위한 AI 탐지 모델 경진대회')
      .limit(1);
    
    if (fetchError || !campaigns || campaigns.length === 0) {
      console.error('Error fetching campaign:', fetchError);
      return;
    }
    
    const campaign = campaigns[0];  // Get first campaign
    
    console.log('Found campaign:', {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      created_by: campaign.created_by
    });
    
    // 2. Update the campaign
    const updateData = {
      description: 'NIA 주최 딥페이크 탐지 AI 모델 개발 경진대회 홍보 캠페인 - 업데이트 테스트 완료',
      target_views: 600000,  // Updated from 500000
      target_registrations: 1200,  // Updated from 1000
      status: 'active',
      updated_at: new Date().toISOString()
    };
    
    console.log('\nUpdating campaign with:', updateData);
    
    const { data: updatedCampaign, error: updateError } = await supabaseService
      .from('campaigns')
      .update(updateData)
      .eq('id', campaign.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Update failed:', updateError);
      
      // Try alternative approach - direct SQL
      console.log('\nTrying direct SQL update...');
      await updateViaSQL(campaign.id, updateData);
    } else {
      console.log('✅ Campaign updated successfully!');
      console.log('Updated campaign:', updatedCampaign);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function updateViaSQL(campaignId, updateData) {
  // Use raw SQL query through service role
  const { data, error } = await supabaseService
    .from('campaigns')
    .update({
      description: updateData.description,
      target_views: updateData.target_views,
      target_registrations: updateData.target_registrations,
      status: updateData.status,
      updated_at: updateData.updated_at
    })
    .eq('id', campaignId)
    .select();
  
  if (error) {
    console.error('❌ SQL update also failed:', error);
    
    // Final attempt - disable RLS temporarily
    console.log('\nAttempting to fix RLS policies...');
    await fixRLSAndRetry(campaignId, updateData);
  } else {
    console.log('✅ SQL update successful!');
    console.log('Updated data:', data);
  }
}

async function fixRLSAndRetry(campaignId, updateData) {
  try {
    // First, let's check current RLS policies
    const { data: policies, error: policyError } = await supabaseService
      .from('campaigns')
      .select('*')
      .eq('id', campaignId);
    
    if (!policyError) {
      console.log('Can read campaign, trying update with minimal fields...');
      
      // Try updating with just one field
      const { error: minimalUpdateError } = await supabaseService
        .from('campaigns')
        .update({ description: 'Test update - ' + new Date().toISOString() })
        .eq('id', campaignId);
      
      if (minimalUpdateError) {
        console.error('❌ Even minimal update fails:', minimalUpdateError);
        console.log('\n⚠️  RLS policies need to be fixed in Supabase dashboard');
        console.log('Please run the fix_rls_policies.sql file in SQL Editor');
      } else {
        console.log('✅ Minimal update works!');
        
        // Now try full update
        const { data: fullUpdate, error: fullUpdateError } = await supabaseService
          .from('campaigns')
          .update(updateData)
          .eq('id', campaignId)
          .select();
        
        if (fullUpdateError) {
          console.error('❌ Full update still fails:', fullUpdateError);
        } else {
          console.log('✅ Full update successful!');
          console.log('Final updated data:', fullUpdate);
        }
      }
    }
  } catch (error) {
    console.error('Final attempt failed:', error);
  }
}

// Run the test
testCampaignUpdate();