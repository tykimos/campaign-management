import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Create client with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAnonymousAccess() {
  console.log('Testing RLS with anonymous access (no auth)...\n');
  
  try {
    // 1. Try to fetch campaigns without authentication
    console.log('1. Fetching campaigns without authentication...');
    const { data: campaigns, error: fetchError } = await supabase
      .from('campaigns')
      .select('id, name, created_by')
      .limit(3);
    
    if (fetchError) {
      console.error('❌ Cannot fetch campaigns:', fetchError);
      console.log('\nThis means SELECT policy requires authentication or has issues');
    } else {
      console.log('✅ Can fetch campaigns without auth:', campaigns?.length, 'found');
      if (campaigns && campaigns.length > 0) {
        campaigns.forEach(c => {
          console.log(`  - Campaign ${c.id}: created_by = ${c.created_by || 'NULL'}`);
        });
      }
    }
    
    // 2. Try to update without authentication
    if (campaigns && campaigns.length > 0) {
      console.log('\n2. Trying to update without authentication...');
      const campaign = campaigns[0];
      
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ 
          description: 'Anonymous update attempt',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaign.id);
      
      if (updateError) {
        console.log('❌ Expected: Cannot update without auth:', updateError.message);
      } else {
        console.log('⚠️  Unexpected: Update succeeded without auth!');
      }
    }
    
    // 3. Check users table access
    console.log('\n3. Checking users table access...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Cannot access users table:', usersError.message);
      console.log('This is causing the "infinite recursion" error!');
      console.log('The campaigns UPDATE policy checks users table, but users table has restrictive policies');
    } else {
      console.log('✅ Can access users table');
    }
    
    // 4. Sign in anonymously and try again
    console.log('\n4. Signing in anonymously...');
    const { data: anonAuth, error: anonError } = await supabase.auth.signInAnonymously();
    
    if (anonError) {
      console.log('Anonymous sign-in not enabled or error:', anonError.message);
    } else {
      console.log('Signed in anonymously');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Anonymous user ID:', user?.id);
      
      // Try update as anonymous user
      if (campaigns && campaigns.length > 0) {
        console.log('\n5. Trying to update as anonymous user...');
        const campaign = campaigns[0];
        
        const { error: anonUpdateError } = await supabase
          .from('campaigns')
          .update({ 
            description: 'Anonymous authenticated update',
            updated_at: new Date().toISOString()
          })
          .eq('id', campaign.id);
        
        if (anonUpdateError) {
          console.log('❌ Cannot update as anonymous:', anonUpdateError.message);
        } else {
          console.log('✅ Update succeeded as anonymous user');
        }
      }
      
      await supabase.auth.signOut();
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Now test the actual RLS issue
async function diagnoseRLSProblem() {
  console.log('\n\n=== DIAGNOSIS ===\n');
  console.log('The "infinite recursion" error happens because:');
  console.log('1. Campaigns UPDATE policy checks if user is admin');
  console.log('2. To check admin, it queries the users table');
  console.log('3. Users table SELECT policy also checks if user is admin');
  console.log('4. This creates an infinite loop!\n');
  
  console.log('SOLUTION:');
  console.log('Fix the users table SELECT policy to not recursively check admin status');
  console.log('OR');
  console.log('Simplify the campaigns UPDATE policy to not check users table\n');
  
  console.log('Here\'s the corrected SQL for users table:');
  console.log('=====================================');
  console.log(`
-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;

-- Create non-recursive policy
CREATE POLICY "Users can view own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

-- Allow everyone to check if someone is admin (for RLS checks)
CREATE POLICY "Anyone can check admin status" 
  ON public.users FOR SELECT
  USING (role = 'admin')
  WITH CHECK (false);
  `);
  console.log('=====================================');
}

testAnonymousAccess().then(() => diagnoseRLSProblem());