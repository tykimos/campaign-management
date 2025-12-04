import fs from 'fs/promises';

const projectRef = 'zaivjzyuxyajadfwfbkx';
const supabaseServiceKey = 'sb_secret_dCVqXqJdhqBENbi0emxrYw_kuSuoNWx';

async function executeSQLViaAPI() {
  try {
    console.log('Reading SQL file...');
    const sql = await fs.readFile('./channel-tables.sql', 'utf8');
    
    console.log('Executing SQL via Management API...');
    
    // Use the Supabase Management API to run SQL
    const response = await fetch(`https://${projectRef}.supabase.co/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      console.log('First attempt failed, trying alternate endpoint...');
      
      // Try using the SQL endpoint directly
      const sqlEndpointResponse = await fetch(`https://${projectRef}.supabase.co/rest/v1/sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: sql
        })
      });
      
      if (!sqlEndpointResponse.ok) {
        console.log('SQL endpoint failed, trying database endpoint...');
        
        // Try the database endpoint
        const dbResponse = await fetch(`https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sql: sql
          })
        });
        
        if (!dbResponse.ok) {
          const errorText = await dbResponse.text();
          console.error('Database endpoint failed:', errorText);
          
          // Try Management API v1
          console.log('Trying Management API v1...');
          const mgmtResponse = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/sql`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: sql
            })
          });
          
          if (!mgmtResponse.ok) {
            const mgmtError = await mgmtResponse.text();
            console.error('Management API failed:', mgmtError);
            return false;
          }
          
          const mgmtResult = await mgmtResponse.json();
          console.log('✅ SQL executed via Management API:', mgmtResult);
          return true;
        }
        
        const dbResult = await dbResponse.json();
        console.log('✅ SQL executed via database endpoint:', dbResult);
        return true;
      }
      
      const sqlResult = await sqlEndpointResponse.json();
      console.log('✅ SQL executed via SQL endpoint:', sqlResult);
      return true;
    }
    
    const result = await response.json();
    console.log('✅ SQL executed successfully:', result);
    return true;
    
  } catch (error) {
    console.error('Error executing SQL:', error);
    return false;
  }
}

async function verifyTables() {
  console.log('\nVerifying tables...');
  
  const supabaseUrl = `https://${projectRef}.supabase.co`;
  
  const tables = ['channel_types', 'channel_attributes', 'channel_type_attributes', 'channels_v2'];
  
  for (const table of tables) {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=count`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'count=exact'
      }
    });
    
    if (response.ok) {
      const count = response.headers.get('content-range');
      console.log(`✓ Table ${table} exists (${count})`);
    } else {
      console.log(`✗ Table ${table} not found`);
    }
  }
}

async function main() {
  const success = await executeSQLViaAPI();
  
  if (!success) {
    console.log('\n❌ Automated SQL execution failed.');
    console.log('\n=== MANUAL SETUP REQUIRED ===');
    console.log('Please follow these steps:');
    console.log('\n1. Go to your Supabase dashboard:');
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log('\n2. Copy the contents of ./channel-tables.sql');
    console.log('\n3. Paste into the SQL editor');
    console.log('\n4. Click "Run" to execute the SQL');
    console.log('\n5. Verify tables are created in the Table Editor');
  } else {
    await verifyTables();
  }
}

main();