import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Use anon key like the web app does
const supabase = createClient(supabaseUrl, anonKey);

async function testWebUpdate() {
  console.log('Testing campaign update with anon key (simulating web app)...\n');
  
  try {
    // 1. Try to fetch campaigns (should work with SELECT policy)
    console.log('1. Fetching campaigns...');
    const { data: campaigns, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .limit(2);
    
    if (fetchError) {
      console.error('❌ Cannot fetch campaigns:', fetchError);
      return;
    }
    
    console.log(`✅ Fetched ${campaigns.length} campaigns`);
    campaigns.forEach(c => {
      console.log(`  - ${c.id}: ${c.name} (created_by: ${c.created_by || 'NULL'})`);
    });
    
    // 2. Try to update without authentication (should fail)
    console.log('\n2. Trying to update without authentication...');
    const campaign = campaigns[0];
    
    const { error: updateError1 } = await supabase
      .from('campaigns')
      .update({ 
        description: 'Update attempt without auth'
      })
      .eq('id', campaign.id);
    
    if (updateError1) {
      console.log(`❌ Expected: Cannot update without auth: ${updateError1.message}`);
    } else {
      console.log('⚠️  Unexpected: Update succeeded without auth');
    }
    
    // 3. Sign up/in as a test user
    console.log('\n3. Creating test user...');
    const testEmail = `testuser_${Date.now()}@test.local`;
    const testPassword = 'TestPassword123!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User'
        }
      }
    });
    
    if (signUpError) {
      console.error('Sign up error:', signUpError.message);
      
      // Try with a simpler approach - just test as anonymous
      console.log('\n4. Testing as anonymous/unauthenticated user...');
      testAnonymousUpdate(campaigns[0]);
      return;
    }
    
    console.log('✅ User created/signed in');
    const user = signUpData.user;
    
    // 4. Create user record in users table
    if (user) {
      console.log('\n4. Creating user record...');
      const { error: userCreateError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          name: 'Test User',
          role: 'user'
        });
      
      if (userCreateError && !userCreateError.message.includes('duplicate')) {
        console.log('User record creation error:', userCreateError.message);
      }
    }
    
    // 5. Try to update campaign as authenticated user
    console.log('\n5. Updating campaign as authenticated user...');
    const { data: updateData, error: updateError2 } = await supabase
      .from('campaigns')
      .update({ 
        description: `Updated by ${testEmail} at ${new Date().toISOString()}`
      })
      .eq('id', campaign.id)
      .select();
    
    if (updateError2) {
      console.error('❌ Update failed as authenticated user:', updateError2.message);
      
      if (updateError2.message.includes('infinite recursion')) {
        console.log('\n⚠️  RLS infinite recursion issue still exists!');
        console.log('The fix_users_rls.sql needs to be applied.');
      }
    } else {
      console.log('✅ Update successful as authenticated user!');
      console.log('Updated data:', updateData);
    }
    
    // Clean up
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function testAnonymousUpdate(campaign) {
  // For campaigns with NULL created_by, any authenticated user should be able to update
  console.log(`\nTesting update on campaign with created_by = ${campaign.created_by || 'NULL'}...`);
  
  const { error } = await supabase
    .from('campaigns')
    .update({ 
      description: 'Anonymous update test ' + new Date().toISOString()
    })
    .eq('id', campaign.id);
  
  if (error) {
    console.log('❌ Cannot update:', error.message);
    
    if (error.message.includes('infinite recursion')) {
      console.log('\n🔴 CRITICAL: RLS infinite recursion detected!');
      console.log('This is the exact error happening in the web app.');
      console.log('\nSOLUTION: The fix_users_rls.sql must be applied to the database.');
    }
  } else {
    console.log('✅ Update successful');
  }
}

testWebUpdate();