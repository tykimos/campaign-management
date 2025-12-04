import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

const anonSupabase = createClient(supabaseUrl, anonKey);
const serviceSupabase = createClient(supabaseUrl, serviceKey);

async function testUpdate() {
  console.log('Testing UPDATE operation directly...\n');
  
  // Get campaign ID 10
  console.log('1. Testing UPDATE without .select().single()...');
  const { data: updateData1, error: updateError1, count } = await anonSupabase
    .from('campaigns')
    .update({
      updated_at: new Date().toISOString()
    })
    .eq('id', 10);
  
  console.log('Result without select:');
  console.log('  Data:', updateData1);
  console.log('  Error:', updateError1);
  console.log('  Count:', count);
  
  console.log('\n2. Testing UPDATE with .select()...');
  const { data: updateData2, error: updateError2 } = await anonSupabase
    .from('campaigns')
    .update({
      updated_at: new Date().toISOString()
    })
    .eq('id', 10)
    .select();
  
  console.log('Result with select:');
  console.log('  Data:', updateData2);
  console.log('  Error:', updateError2);
  
  console.log('\n3. Testing SELECT after UPDATE...');
  const { data: selectData, error: selectError } = await anonSupabase
    .from('campaigns')
    .select('*')
    .eq('id', 10);
  
  console.log('Select result:');
  console.log('  Data:', selectData);
  console.log('  Error:', selectError);
  
  if (selectData && selectData.length === 0) {
    console.log('\n⚠️  Campaign ID 10 is not visible to anon key!');
    console.log('This could be due to SELECT RLS policies.');
    
    console.log('\n4. Checking with service key...');
    const { data: serviceSelect, error: serviceSelectError } = await serviceSupabase
      .from('campaigns')
      .select('*')
      .eq('id', 10);
    
    console.log('Service key select:');
    console.log('  Data:', serviceSelect);
    console.log('  Error:', serviceSelectError);
  }
  
  console.log('\n5. Testing UPDATE with service key and returning data...');
  const { data: serviceUpdate, error: serviceUpdateError } = await serviceSupabase
    .from('campaigns')
    .update({
      description: 'Updated by service key test',
      updated_at: new Date().toISOString()
    })
    .eq('id', 10)
    .select()
    .single();
  
  console.log('Service key update with select:');
  console.log('  Data:', serviceUpdate);
  console.log('  Error:', serviceUpdateError);
  
  if (serviceUpdate) {
    console.log('\n✅ Service key can update and retrieve the campaign.');
    console.log('The issue is that anon key cannot SELECT the updated row.');
  }
}

testUpdate().catch(console.error);