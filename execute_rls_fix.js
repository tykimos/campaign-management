import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

async function executeSQLStatements() {
  console.log('Executing RLS policy fixes directly on Supabase...');
  
  // SQL statements to execute
  const statements = [
    `DROP POLICY IF EXISTS "Users can update own campaigns" ON public.campaigns`,
    `DROP POLICY IF EXISTS "Users can delete own campaigns" ON public.campaigns`,
    
    `CREATE POLICY "Users can update campaigns" 
      ON public.campaigns FOR UPDATE 
      USING (
        (created_by IS NOT NULL AND created_by = auth.uid())
        OR 
        auth.uid() IN (
          SELECT id FROM public.users WHERE role = 'admin'
        )
        OR
        created_by IS NULL
      )`,
    
    `CREATE POLICY "Users can delete campaigns" 
      ON public.campaigns FOR DELETE 
      USING (
        (created_by IS NOT NULL AND created_by = auth.uid())
        OR 
        auth.uid() IN (
          SELECT id FROM public.users WHERE role = 'admin'
        )
        OR
        created_by IS NULL
      )`,
    
    `DROP POLICY IF EXISTS "Users can update own posts" ON public.campaign_posts`,
    `DROP POLICY IF EXISTS "Users can delete own posts" ON public.campaign_posts`,
    
    `CREATE POLICY "Users can update posts" 
      ON public.campaign_posts FOR UPDATE 
      USING (
        (posted_by IS NOT NULL AND posted_by = auth.uid())
        OR 
        auth.uid() IN (
          SELECT id FROM public.users WHERE role = 'admin'
        )
        OR
        posted_by IS NULL
        OR
        EXISTS (
          SELECT 1 FROM public.campaigns 
          WHERE id = campaign_id 
          AND (created_by = auth.uid() OR created_by IS NULL)
        )
      )`,
    
    `CREATE POLICY "Users can delete posts" 
      ON public.campaign_posts FOR DELETE 
      USING (
        (posted_by IS NOT NULL AND posted_by = auth.uid())
        OR 
        auth.uid() IN (
          SELECT id FROM public.users WHERE role = 'admin'
        )
        OR
        posted_by IS NULL
        OR
        EXISTS (
          SELECT 1 FROM public.campaigns 
          WHERE id = campaign_id 
          AND (created_by = auth.uid() OR created_by IS NULL)
        )
      )`,
    
    `DROP POLICY IF EXISTS "Users can view own profile" ON public.users`,
    `DROP POLICY IF EXISTS "Admin can view all users" ON public.users`,
    
    `CREATE POLICY "Users can view profiles" 
      ON public.users FOR SELECT 
      USING (
        auth.uid() = id
        OR
        role = 'admin'
        OR
        auth.uid() IN (
          SELECT id FROM public.users WHERE role = 'admin'
        )
      )`,
    
    `CREATE POLICY "Users can update own profile" 
      ON public.users FOR UPDATE 
      USING (auth.uid() = id)`
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    try {
      console.log('\nExecuting:', statement.substring(0, 50) + '...');
      
      // Execute via Supabase Management API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          query: statement
        })
      });

      if (response.ok) {
        console.log('✅ Success');
        successCount++;
      } else {
        const errorText = await response.text();
        console.log('❌ Failed:', errorText.substring(0, 100));
        errorCount++;
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      errorCount++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Successful statements: ${successCount}`);
  console.log(`Failed statements: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\nSome statements failed. Trying alternative approach...');
    await executeViaSupabaseClient();
  }
}

// Alternative approach using Supabase client
async function executeViaSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  });

  console.log('\n=== Using Supabase Client ===');
  
  try {
    // Test if we can access campaigns without error
    const { data: campaigns, error: testError } = await supabase
      .from('campaigns')
      .select('id, name')
      .limit(1);
    
    if (testError) {
      console.log('Still getting error:', testError);
      console.log('\n⚠️ Please run the fix_rls_policies.sql file manually in Supabase SQL Editor');
    } else {
      console.log('✅ Can access campaigns table');
      
      // Try updating a campaign to test
      if (campaigns && campaigns.length > 0) {
        const { error: updateError } = await supabase
          .from('campaigns')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', campaigns[0].id);
        
        if (updateError) {
          console.log('❌ Update still fails:', updateError);
          console.log('\n⚠️ Please run the fix_rls_policies.sql file manually in Supabase SQL Editor');
        } else {
          console.log('✅ Update works! RLS policies may be partially fixed.');
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the fix
executeSQLStatements().catch(console.error);