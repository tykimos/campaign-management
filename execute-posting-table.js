import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zaivjzyuxyajadfwfbkx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphaXZqenl1eHlhamFkZndmYmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzU0ODcsImV4cCI6MjA4MDM1MTQ4N30.oUUulgOnIpnQCcuG7IvzYB0MT_FzPlWzqz2qh3orXPY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createPostingTable() {
  console.log('Creating campaign_postings table...\n');
  
  try {
    // First check if table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('campaign_postings')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Table campaign_postings already exists!');
      
      // Get count
      const { count } = await supabase
        .from('campaign_postings')
        .select('*', { count: 'exact', head: true });
      
      console.log(`   Found ${count || 0} records in the table.`);
      return true;
    }
    
    console.log('Table does not exist. Please create it manually in Supabase SQL Editor.');
    console.log('\nSteps to create the table:');
    console.log('1. Go to: https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx/sql/new');
    console.log('2. Copy and paste the SQL from posting-table.sql');
    console.log('3. Click "Run" button');
    console.log('\nSQL to execute:\n');
    
    const sql = `-- Campaign Postings Table
CREATE TABLE IF NOT EXISTS public.campaign_postings (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES public.campaigns(id) ON DELETE CASCADE,
  channel_id INTEGER REFERENCES public.channels_v2(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  result TEXT,
  memo TEXT,
  posted_date DATE,
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, channel_id)
);

ALTER TABLE public.campaign_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for campaign_postings" 
  ON public.campaign_postings 
  FOR ALL 
  USING (true);

CREATE TRIGGER update_campaign_postings_updated_at 
  BEFORE UPDATE ON public.campaign_postings
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_campaign_postings_campaign_id ON public.campaign_postings(campaign_id);
CREATE INDEX idx_campaign_postings_channel_id ON public.campaign_postings(channel_id);
CREATE INDEX idx_campaign_postings_status ON public.campaign_postings(status);`;
    
    console.log(sql);
    
    // Try to open the browser
    console.log('\n\nOpening Supabase SQL Editor in browser...');
    
    return false;
    
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

// Test other tables
async function testTables() {
  console.log('\n\nTesting existing tables:');
  
  const tables = ['campaigns', 'channels_v2', 'channel_types', 'channel_attributes'];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`✅ ${table}: ${count || 0} records`);
    } else {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }
}

async function main() {
  await createPostingTable();
  await testTables();
  
  // Open browser
  const { exec } = await import('child_process');
  exec('open "https://supabase.com/dashboard/project/zaivjzyuxyajadfwfbkx/sql/new"');
}

main();