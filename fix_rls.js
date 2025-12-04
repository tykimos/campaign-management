import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLSPolicies() {
  console.log('Fixing RLS policies...');
  
  try {
    // Read SQL file
    const sql = fs.readFileSync('./fix_rls_policies.sql', 'utf8');
    
    // Split into individual statements and execute
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.includes('NOTIFY')) continue; // Skip NOTIFY command
      
      console.log('Executing:', statement.substring(0, 50) + '...');
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      }).single();
      
      if (error) {
        console.error('Error executing statement:', error);
        // Try direct execution as alternative
        const { data, error: directError } = await fetch(
          `${supabaseUrl}/rest/v1/rpc/exec_sql`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sql: statement + ';' })
          }
        ).then(r => r.json());
        
        if (directError) {
          console.log('Statement might need manual execution:', statement.substring(0, 50));
        }
      }
    }
    
    console.log('RLS policies fix attempted. Please run the SQL manually in Supabase dashboard for best results.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Alternative: Direct SQL execution approach
async function executeSQLDirectly() {
  console.log('\n=== Direct SQL Execution ===');
  console.log('Please copy and run the following SQL in your Supabase SQL Editor:\n');
  
  const sql = fs.readFileSync('./fix_rls_policies.sql', 'utf8');
  console.log(sql);
  console.log('\n=== End of SQL ===');
}

// Run both approaches
fixRLSPolicies().then(() => {
  executeSQLDirectly();
});