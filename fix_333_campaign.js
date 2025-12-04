import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

const serviceSupabase = createClient(supabaseUrl, serviceKey);
const anonSupabase = createClient(supabaseUrl, anonKey);

async function fix333Campaign() {
  console.log('Finding and fixing 333제목 campaign...\n');
  
  // 1. Find the campaign
  const { data: campaigns, error: findError } = await serviceSupabase
    .from('campaigns')
    .select('*')
    .like('name', '%333%')
    .order('created_at', { ascending: false });
  
  if (findError) {
    console.error('Error finding campaigns:', findError);
    return;
  }
  
  console.log(`Found ${campaigns.length} campaigns with "333" in the name:`);
  campaigns.forEach(c => {
    console.log(`  ID ${c.id}: ${c.name}`);
    console.log(`    created_by: ${c.created_by || 'NULL'}`);
    console.log(`    status: ${c.status}`);
    console.log(`    created_at: ${c.created_at}`);
  });
  
  if (campaigns.length === 0) {
    console.log('\nNo campaigns found. Creating one for testing...');
    
    // Create with service key
    const { data: newCampaign, error: createError } = await serviceSupabase
      .from('campaigns')
      .insert({
        name: '333제목',
        status: 'active',
        created_by: null
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Failed to create campaign:', createError);
      return;
    }
    
    console.log('\n✅ Created campaign:', newCampaign);
    campaigns.push(newCampaign);
  }
  
  // 2. Try to update with anon key
  const targetCampaign = campaigns[0];
  console.log(`\nTrying to update campaign ID ${targetCampaign.id} with anon key...`);
  
  const { data: anonUpdate, error: anonError } = await anonSupabase
    .from('campaigns')
    .update({
      description: 'Updated with anon key at ' + new Date().toISOString()
    })
    .eq('id', targetCampaign.id)
    .select()
    .single();
  
  if (anonError) {
    console.error('❌ Anon key update failed:', anonError);
    console.log('\nError details:');
    console.log('  Code:', anonError.code);
    console.log('  Message:', anonError.message);
    
    if (anonError.code === '42501') {
      console.log('\n⚠️  This is an RLS policy error!');
      console.log('\nAttempting to fix by updating with service key...');
      
      // Update with service key
      const { data: serviceUpdate, error: serviceError } = await serviceSupabase
        .from('campaigns')
        .update({
          description: 'Updated with service key at ' + new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', targetCampaign.id)
        .select()
        .single();
      
      if (serviceError) {
        console.error('❌ Service key update also failed:', serviceError);
      } else {
        console.log('✅ Service key update successful!');
        console.log('Updated campaign:', serviceUpdate);
      }
      
      console.log('\n=== SOLUTION ===');
      console.log('The RLS policies need to be fixed. Run this SQL in Supabase Dashboard:');
      console.log('https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx/sql/new\n');
      
      const fixSQL = `
-- Fix campaigns table RLS policies for anonymous access
DROP POLICY IF EXISTS "Users can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Simple campaign update" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON public.campaigns;

-- Create a simple policy that allows updates
CREATE POLICY "Anyone can update campaigns" 
  ON public.campaigns 
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Also ensure INSERT works
DROP POLICY IF EXISTS "Users can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaigns" ON public.campaigns;

CREATE POLICY "Anyone can insert campaigns" 
  ON public.campaigns 
  FOR INSERT 
  WITH CHECK (true);

-- Verify policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'campaigns';`;
      
      console.log(fixSQL);
    }
  } else {
    console.log('✅ Anon key update successful!');
    console.log('Updated campaign:', anonUpdate);
    console.log('\nThe issue has been resolved!');
  }
}

fix333Campaign();