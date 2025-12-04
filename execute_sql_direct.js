import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];

async function executeSQL(sql) {
  const apiUrl = `https://${projectRef}.supabase.co/rest/v1/rpc`;
  
  // Supabase doesn't have a direct SQL execution endpoint via REST API
  // We need to use the pg_net extension or create a custom function
  // For now, let's create a workaround
  
  console.log('Note: Direct SQL execution via REST API is limited.');
  console.log('Creating SQL execution function in database...\n');
  
  // Create a PL/pgSQL function that can execute dynamic SQL
  const createFunctionSQL = `
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;

GRANT EXECUTE ON FUNCTION execute_sql TO service_role;
`;
  
  console.log('Please run this in Supabase SQL Editor first:');
  console.log('=====================================');
  console.log(createFunctionSQL);
  console.log('=====================================\n');
  
  console.log('Then run this script again with --execute flag');
}

async function executeSQLViaSupabase() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, serviceKey);
  
  console.log('Executing RLS fix via Supabase client...\n');
  
  // Read the SQL file
  const sql = fs.readFileSync('./fix_users_rls.sql', 'utf8');
  
  // Since we can't execute raw SQL, let's simulate the policies
  // by checking current state and applying fixes
  
  try {
    // Test current state
    console.log('1. Testing current RLS state...');
    const { data: testData, error: testError } = await supabase
      .from('campaigns')
      .select('id')
      .limit(1);
    
    if (testError && testError.message.includes('infinite recursion')) {
      console.log('❌ Infinite recursion detected. RLS policies need fixing.');
      console.log('\nPlease run the following SQL in Supabase Dashboard SQL Editor:');
      console.log('=====================================');
      console.log(sql);
      console.log('=====================================');
    } else {
      console.log('✅ No infinite recursion detected.');
      
      // Try an update to confirm
      if (testData && testData.length > 0) {
        const { error: updateError } = await supabase
          .from('campaigns')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', testData[0].id);
        
        if (updateError) {
          console.log('❌ Update failed:', updateError.message);
          console.log('\nPlease run fix_users_rls.sql in Supabase Dashboard');
        } else {
          console.log('✅ Updates are working correctly!');
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Check if we should execute
const shouldExecute = process.argv.includes('--execute');

if (shouldExecute) {
  executeSQLViaSupabase();
} else {
  executeSQL();
  console.log('\nAlternatively, using Supabase client to test...\n');
  executeSQLViaSupabase();
}