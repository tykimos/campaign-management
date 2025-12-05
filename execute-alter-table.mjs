import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://zaivjzyuxyajadfwfbkx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaXZqenl1eHlhamFkZndmYmt4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzM3NjQ4NSwiZXhwIjoyMDQ4OTUyNDg1fQ.iXtBMJOQsMp0M9yY5QT8Nz6_MlNqBjOWNvL3saLM3dM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function alterTable() {
  try {
    console.log('Altering table to increase column sizes...\n');
    
    const sql = fs.readFileSync('alter-channel-name-length.sql', 'utf8');
    
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: sql
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try alternative approach using direct query
      console.log('\nTrying alternative approach...');
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('query', {
            query_text: statement.trim()
          });
          
          if (stmtError) {
            console.error('Statement error:', stmtError);
          }
        }
      }
    } else {
      console.log('Table altered successfully!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

alterTable();