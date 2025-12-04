import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Checking why INSERT works but UPDATE fails...\n');

// Test with anon key (like web app)
const anonSupabase = createClient(supabaseUrl, anonKey);

async function checkUpdateIssue() {
  console.log('1. Testing SELECT with anon key...');
  const { data: campaigns, error: selectError } = await anonSupabase
    .from('campaigns')
    .select('*')
    .limit(1);
  
  if (selectError) {
    console.error('SELECT failed:', selectError);
    return;
  }
  
  console.log('✅ SELECT works');
  console.log('Campaign:', campaigns[0]);
  
  console.log('\n2. Testing INSERT with anon key...');
  const testName = 'Test Campaign ' + Date.now();
  const { data: insertData, error: insertError } = await anonSupabase
    .from('campaigns')
    .insert({ 
      name: testName,
      status: 'active',
      created_by: null // explicitly null
    })
    .select()
    .single();
  
  if (insertError) {
    console.error('❌ INSERT failed:', insertError);
  } else {
    console.log('✅ INSERT works');
    console.log('New campaign ID:', insertData.id);
    
    console.log('\n3. Testing UPDATE on the newly created campaign...');
    const { error: updateError } = await anonSupabase
      .from('campaigns')
      .update({ 
        description: 'Updated description',
        updated_at: new Date().toISOString()
      })
      .eq('id', insertData.id);
    
    if (updateError) {
      console.error('❌ UPDATE failed:', updateError);
      console.log('Full error details:', JSON.stringify(updateError, null, 2));
      
      // Check if it's an RLS issue
      if (updateError.message && updateError.message.includes('row-level')) {
        console.log('\n⚠️  This is an RLS policy issue!');
        console.log('The UPDATE policy is blocking the operation.');
      }
    } else {
      console.log('✅ UPDATE works on new campaign');
    }
    
    // Clean up test campaign
    const { error: deleteError } = await anonSupabase
      .from('campaigns')
      .delete()
      .eq('id', insertData.id);
    
    if (!deleteError) {
      console.log('✅ Test campaign deleted');
    }
  }
  
  console.log('\n4. Testing UPDATE on existing campaign (ID: 9)...');
  const { error: updateExistingError } = await anonSupabase
    .from('campaigns')
    .update({ 
      updated_at: new Date().toISOString()
    })
    .eq('id', 9);
  
  if (updateExistingError) {
    console.error('❌ UPDATE failed on existing campaign:', updateExistingError);
    console.log('Full error:', JSON.stringify(updateExistingError, null, 2));
  } else {
    console.log('✅ UPDATE works on existing campaign');
  }
  
  // Check with service key to compare
  console.log('\n5. Testing same UPDATE with service key...');
  const serviceSupabase = createClient(supabaseUrl, serviceKey);
  
  const { error: serviceUpdateError } = await serviceSupabase
    .from('campaigns')
    .update({ 
      updated_at: new Date().toISOString()
    })
    .eq('id', 9);
  
  if (serviceUpdateError) {
    console.error('❌ Service key UPDATE failed:', serviceUpdateError);
  } else {
    console.log('✅ Service key UPDATE works');
  }
  
  console.log('\n=== DIAGNOSIS ===');
  console.log('The issue is likely that:');
  console.log('1. INSERT works because the INSERT policy allows it');
  console.log('2. UPDATE fails because the UPDATE policy has a condition that blocks it');
  console.log('3. The UPDATE policy might be checking auth.uid() but anon requests have no auth.uid()');
  console.log('\nLet me check if auth.uid() is null for anon requests...');
  
  // Try to get current user
  const { data: { user } } = await anonSupabase.auth.getUser();
  console.log('Current user:', user ? `Authenticated (${user.id})` : 'Not authenticated (anon)');
  
  if (!user) {
    console.log('\n⚠️  The problem is that UPDATE policies require auth.uid() but anon requests have no user!');
    console.log('This explains why INSERT works (no auth check) but UPDATE fails (requires auth).');
  }
}

checkUpdateIssue();