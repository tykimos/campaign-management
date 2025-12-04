import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Create client with anon key (same as web app)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRLSIssue() {
  console.log('Checking RLS issue with anon key (same as web app)...\n');
  
  try {
    // 1. Sign in as a test user or create one
    console.log('1. Creating/signing in test user...');
    const testEmail = `test${Date.now()}@test.com`;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'Test123456!'
    });
    
    if (authError && authError.message.includes('already registered')) {
      // User exists, sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123'
      });
      
      if (signInError) {
        console.error('Sign in error:', signInError);
        return;
      }
      console.log('Signed in as existing user');
    } else if (authError) {
      console.error('Auth error:', authError);
      return;
    } else {
      console.log('Created new test user');
    }
    
    // 2. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user ID:', user?.id);
    
    // 3. Check if user exists in users table
    console.log('\n2. Checking users table...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user?.id)
      .single();
    
    if (userError) {
      console.log('User not in users table, creating...');
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user?.id,
          email: user?.email,
          name: 'Test User',
          role: 'user'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating user:', createError);
      } else {
        console.log('Created user in users table');
      }
    } else {
      console.log('User exists in users table:', userData);
    }
    
    // 4. Try to fetch campaigns
    console.log('\n3. Fetching campaigns...');
    const { data: campaigns, error: fetchError } = await supabase
      .from('campaigns')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Cannot fetch campaigns:', fetchError);
    } else {
      console.log('✅ Can fetch campaigns:', campaigns?.length, 'found');
    }
    
    // 5. Try to update a campaign
    if (campaigns && campaigns.length > 0) {
      console.log('\n4. Trying to update campaign...');
      const campaign = campaigns[0];
      
      const { data: updated, error: updateError } = await supabase
        .from('campaigns')
        .update({
          description: `Test update by user ${user?.email} at ${new Date().toISOString()}`
        })
        .eq('id', campaign.id)
        .select();
      
      if (updateError) {
        console.error('❌ Update failed:', updateError);
        console.log('\nThis is the error you\'re seeing in the web app!');
        console.log('The issue is:', updateError.message);
      } else {
        console.log('✅ Update successful!');
      }
    }
    
    // 6. Try creating a campaign with the user as creator
    console.log('\n5. Creating a campaign with current user as creator...');
    const { data: newCampaign, error: createError } = await supabase
      .from('campaigns')
      .insert({
        name: 'Test Campaign ' + Date.now(),
        description: 'Created to test RLS',
        status: 'planning',
        target_views: 1000,
        target_registrations: 10,
        created_by: user?.id
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Cannot create campaign:', createError);
    } else {
      console.log('✅ Created campaign:', newCampaign.id);
      
      // Now try to update it
      console.log('\n6. Updating the campaign we just created...');
      const { data: updatedOwn, error: updateOwnError } = await supabase
        .from('campaigns')
        .update({
          description: 'Updated by owner'
        })
        .eq('id', newCampaign.id)
        .select();
      
      if (updateOwnError) {
        console.error('❌ Cannot update own campaign:', updateOwnError);
      } else {
        console.log('✅ Successfully updated own campaign');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    // Sign out
    await supabase.auth.signOut();
    console.log('\n7. Signed out');
  }
}

checkRLSIssue();