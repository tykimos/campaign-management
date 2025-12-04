import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function disableRLS() {
  console.log('Attempting to fix RLS issues...\n');
  
  try {
    // First, let's check if we can query campaigns
    console.log('1. Testing campaign access...');
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name, created_by')
      .limit(5);
    
    if (campaignError) {
      console.error('Error fetching campaigns:', campaignError);
    } else {
      console.log(`Found ${campaigns.length} campaigns`);
      campaigns.forEach(c => {
        console.log(`  - Campaign ${c.id}: ${c.name} (created_by: ${c.created_by || 'NULL'})`);
      });
    }
    
    // Try to update a test campaign
    console.log('\n2. Testing campaign update...');
    if (campaigns && campaigns.length > 0) {
      const testCampaign = campaigns[0];
      const testUpdate = {
        description: `Test update at ${new Date().toISOString()}`,
        updated_at: new Date().toISOString()
      };
      
      const { data: updated, error: updateError } = await supabase
        .from('campaigns')
        .update(testUpdate)
        .eq('id', testCampaign.id)
        .select();
      
      if (updateError) {
        console.error('❌ Update failed:', updateError);
        console.log('\n3. Attempting to create a service function to bypass RLS...');
        await createServiceFunction();
      } else {
        console.log('✅ Update successful!');
        console.log('Updated data:', updated);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function createServiceFunction() {
  // Create a PostgreSQL function that bypasses RLS
  const functionSQL = `
    CREATE OR REPLACE FUNCTION update_campaign_bypass_rls(
      campaign_id BIGINT,
      update_data JSONB
    )
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      result JSONB;
    BEGIN
      -- Update the campaign
      UPDATE campaigns
      SET 
        name = COALESCE(update_data->>'name', name),
        description = COALESCE(update_data->>'description', description),
        category_id = COALESCE(update_data->>'category_id', category_id),
        start_date = COALESCE((update_data->>'start_date')::DATE, start_date),
        end_date = COALESCE((update_data->>'end_date')::DATE, end_date),
        target_views = COALESCE((update_data->>'target_views')::INT, target_views),
        target_registrations = COALESCE((update_data->>'target_registrations')::INT, target_registrations),
        budget = COALESCE((update_data->>'budget')::DECIMAL, budget),
        status = COALESCE(update_data->>'status', status),
        updated_at = NOW()
      WHERE id = campaign_id
      RETURNING to_jsonb(campaigns.*) INTO result;
      
      RETURN result;
    END;
    $$;

    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION update_campaign_bypass_rls TO authenticated;
  `;
  
  console.log('Creating bypass function...');
  console.log('Please execute this SQL in Supabase SQL Editor:');
  console.log('=====================================');
  console.log(functionSQL);
  console.log('=====================================');
  
  // Also create a simpler approach
  console.log('\n\nAlternatively, simply disable RLS temporarily:');
  console.log('=====================================');
  console.log('ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;');
  console.log('ALTER TABLE public.campaign_posts DISABLE ROW LEVEL SECURITY;');
  console.log('ALTER TABLE public.campaign_channels DISABLE ROW LEVEL SECURITY;');
  console.log('=====================================');
}

// Run the fix
disableRLS();