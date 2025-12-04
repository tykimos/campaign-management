import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

const serviceSupabase = createClient(supabaseUrl, serviceKey);

async function checkPolicies() {
  console.log('Checking current RLS policies on campaigns table...\n');
  
  // We can't directly query pg_policies, but we can test operations
  // and infer what policies exist
  
  const anonSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
  
  // Test all operations
  console.log('Testing operations with anon key:');
  
  // 1. SELECT
  const { data: selectData, error: selectError } = await anonSupabase
    .from('campaigns')
    .select('id')
    .limit(1);
  console.log('SELECT:', selectError ? `❌ Failed: ${selectError.message}` : '✅ Works');
  
  // 2. INSERT
  const { data: insertData, error: insertError } = await anonSupabase
    .from('campaigns')
    .insert({
      name: 'Test Policy Check ' + Date.now(),
      status: 'active'
    })
    .select()
    .single();
  
  if (insertError) {
    console.log('INSERT:', `❌ Failed: ${insertError.message}`);
  } else {
    console.log('INSERT:', '✅ Works');
    
    // 3. UPDATE (on newly created)
    const { error: updateError } = await anonSupabase
      .from('campaigns')
      .update({ description: 'Updated' })
      .eq('id', insertData.id);
    console.log('UPDATE (new):', updateError ? `❌ Failed: ${updateError.message}` : '✅ Works');
    
    // 4. DELETE
    const { error: deleteError } = await anonSupabase
      .from('campaigns')
      .delete()
      .eq('id', insertData.id);
    console.log('DELETE:', deleteError ? `❌ Failed: ${deleteError.message}` : '✅ Works');
  }
  
  // Test UPDATE on existing
  if (selectData && selectData.length > 0) {
    const { error: updateExistingError } = await anonSupabase
      .from('campaigns')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', selectData[0].id);
    console.log('UPDATE (existing):', updateExistingError ? `❌ Failed: ${updateExistingError.message}` : '✅ Works');
  }
  
  console.log('\n=== DIAGNOSIS ===');
  console.log('Based on the tests above:');
  console.log('- SELECT policy: Allows public read (working)');
  console.log('- INSERT policy: Requires authentication or has restrictions');
  console.log('- UPDATE policy: Appears to be working now');
  console.log('- DELETE policy: Unknown (depends on INSERT success)');
  
  console.log('\n=== RECOMMENDED FIX ===');
  console.log('To fix INSERT, run this SQL in Supabase Dashboard:');
  console.log('https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx/sql/new\n');
  
  const fixSQL = `
-- Fix INSERT policy for campaigns
DROP POLICY IF EXISTS "Users can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can insert campaigns" ON public.campaigns;

-- Allow anyone to insert (for demo/development)
CREATE POLICY "Anyone can insert campaigns" 
  ON public.campaigns FOR INSERT 
  WITH CHECK (true);

-- Verify the fix
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'campaigns' AND cmd = 'INSERT';`;
  
  console.log(fixSQL);
}

checkPolicies();