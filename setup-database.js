import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const supabaseUrl = 'https://zaivjzyuxyajadfwfbkx.supabase.co';
const supabaseKey = 'sb_secret_dCVqXqJdhqBENbi0emxrYw_kuSuoNWx';

async function setupDatabase() {
  try {
    console.log('Setting up database...');
    
    // Read SQL file
    const sql = await fs.readFile('./channel-tables.sql', 'utf8');
    
    // Execute SQL directly using the management API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      console.log('Using alternative method to execute SQL...');
      
      // Alternative: Try executing via pg endpoint
      const pgResponse = await fetch(`${supabaseUrl}/pg`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
      });
      
      if (!pgResponse.ok) {
        console.error('Failed to execute SQL via pg endpoint');
        const errorText = await pgResponse.text();
        console.error('Error:', errorText);
        
        // Create client for testing
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test if tables exist
        const { data: types, error: typesError } = await supabase
          .from('channel_types')
          .select('*')
          .limit(1);
          
        if (typesError) {
          console.error('Tables do not exist. Please run the SQL manually in Supabase dashboard.');
          console.log('\nSQL file location: ./channel-tables.sql');
          console.log('\nInstructions:');
          console.log('1. Go to https://ygjbztqxtmqkkjhkkpfp.supabase.co');
          console.log('2. Navigate to SQL Editor');
          console.log('3. Copy and paste the contents of channel-tables.sql');
          console.log('4. Execute the SQL');
        } else {
          console.log('Tables already exist!');
          console.log('Found channel_types table');
        }
        
        return;
      }
      
      const result = await pgResponse.json();
      console.log('SQL executed via pg endpoint:', result);
    } else {
      const result = await response.json();
      console.log('SQL executed successfully:', result);
    }
    
    // Verify tables were created
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: types, error: typesError } = await supabase
      .from('channel_types')
      .select('count');
    
    const { data: attributes, error: attrsError } = await supabase
      .from('channel_attributes')
      .select('count');
    
    const { data: typeAttrs, error: typeAttrsError } = await supabase
      .from('channel_type_attributes')
      .select('count');
    
    if (!typesError && !attrsError && !typeAttrsError) {
      console.log('✅ Database setup completed successfully!');
      console.log('- channel_types table created');
      console.log('- channel_attributes table created');
      console.log('- channel_type_attributes table created');
      console.log('- Default data inserted');
    } else {
      console.error('Error verifying tables:', { typesError, attrsError, typeAttrsError });
    }
    
  } catch (error) {
    console.error('Error setting up database:', error);
    
    // Provide manual instructions
    console.log('\n=== MANUAL SETUP REQUIRED ===');
    console.log('The automatic setup failed. Please follow these steps:');
    console.log('\n1. Go to your Supabase dashboard:');
    console.log('   https://supabase.com/dashboard/project/ygjbztqxtmqkkjhkkpfp');
    console.log('\n2. Navigate to the SQL Editor');
    console.log('\n3. Copy the contents of ./channel-tables.sql');
    console.log('\n4. Paste and execute the SQL in the editor');
    console.log('\n5. Verify the tables were created in the Table Editor');
  }
}

setupDatabase();