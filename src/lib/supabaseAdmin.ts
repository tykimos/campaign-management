import { createClient } from '@supabase/supabase-js';

// Admin client for operations that need to bypass RLS
// WARNING: This should only be used for specific admin operations
// Never expose the service role key to the client side

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For now, we'll use the anon key but with special handling
// In production, you should use a backend API that has the service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

// Helper function to update campaigns with RLS workaround
export async function updateCampaignWithWorkaround(campaignId: number, updateData: any) {
  try {
    // Remove fields that might cause RLS issues
    const cleanData = { ...updateData };
    delete cleanData.created_by;
    delete cleanData.id;
    
    // Add updated_at timestamp
    cleanData.updated_at = new Date().toISOString();
    
    console.log('Attempting to update campaign:', campaignId);
    console.log('Update data:', cleanData);
    
    // First, just do the update without select
    const { error: updateError } = await supabaseAdmin
      .from('campaigns')
      .update(cleanData)
      .eq('id', campaignId);
    
    if (updateError) {
      console.error('Update error:', updateError);
      console.error('Error code:', updateError.code);
      console.error('Error message:', updateError.message);
      console.error('Error details:', updateError.details);
      
      // If RLS error, provide more info
      if (updateError.code === '42501') {
        console.error('This is an RLS policy error. The current user does not have permission to update this campaign.');
        console.error('Possible solutions:');
        console.error('1. Sign in to the application');
        console.error('2. Update RLS policies in Supabase Dashboard');
        console.error('3. Use a backend service with service key');
      }
      
      throw updateError;
    }
    
    // If update succeeded, fetch the updated data separately
    const { data: fetchedData, error: fetchError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (fetchError) {
      console.warn('Could not fetch updated campaign, but update was successful');
      // Don't throw here, update was successful
      return { data: { id: campaignId, ...cleanData }, error: null };
    }
    
    console.log('Update successful:', fetchedData);
    return { data: fetchedData, error: null };
  } catch (error) {
    console.error('Caught error in updateCampaignWithWorkaround:', error);
    return { data: null, error };
  }
}