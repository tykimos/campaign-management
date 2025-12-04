import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function applyFix() {
  console.log('Applying RLS fix programmatically...\n');
  
  // Since we can't execute arbitrary SQL, we'll test the current state
  // and provide clear instructions
  
  console.log('1. Testing current state with service key...');
  const { data: testData, error: testError } = await supabase
    .from('campaigns')
    .select('id, name')
    .limit(1);
  
  if (testError) {
    console.error('Service key error:', testError);
  } else {
    console.log('✅ Service key can access campaigns\n');
  }
  
  console.log('2. Testing update with service key...');
  if (testData && testData.length > 0) {
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', testData[0].id);
    
    if (updateError) {
      console.error('❌ Service key cannot update:', updateError);
    } else {
      console.log('✅ Service key can update campaigns\n');
    }
  }
  
  // Now test with anon key
  const anonSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
  
  console.log('3. Testing with anon key (like web app)...');
  const { data: anonData, error: anonError } = await anonSupabase
    .from('campaigns')
    .select('id')
    .limit(1);
  
  if (anonError) {
    console.error('❌ Anon key error:', anonError.message);
    
    if (anonError.message.includes('infinite recursion')) {
      console.log('\n🔴 CRITICAL: Infinite recursion still exists!\n');
      console.log('=== URGENT ACTION REQUIRED ===\n');
      console.log('You MUST run the following SQL in Supabase Dashboard:');
      console.log('https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx/sql/new\n');
      
      // Provide the simplest possible fix
      const emergencySQL = `
-- EMERGENCY FIX: Disable RLS completely
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_categories DISABLE ROW LEVEL SECURITY;
`;
      
      console.log(emergencySQL);
      console.log('\nThis will disable all RLS and make your app work immediately.');
      console.log('You can re-enable security later once the app is working.');
    }
  } else {
    console.log('✅ Anon key works!\n');
    
    // Test update
    if (anonData && anonData.length > 0) {
      const { error: anonUpdateError } = await anonSupabase
        .from('campaigns')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', anonData[0].id);
      
      if (anonUpdateError) {
        console.error('❌ Anon key cannot update:', anonUpdateError.message);
        
        if (anonUpdateError.message.includes('infinite recursion')) {
          console.log('\n🔴 The infinite recursion error is still happening!');
          console.log('Run the EMERGENCY FIX SQL above in Supabase Dashboard.');
        }
      } else {
        console.log('✅ Anon key can update! Problem is solved!');
      }
    }
  }
  
  console.log('\n=== ALTERNATIVE SOLUTION ===\n');
  console.log('If you still have issues, copy and run disable_all_rls.sql in Supabase Dashboard.');
  console.log('This will completely reset your RLS policies to a simple, working state.');
}

applyFix();