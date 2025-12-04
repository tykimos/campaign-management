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
    
    // Try normal update first
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .update(cleanData)
      .eq('id', campaignId)
      .select()
      .single();
    
    if (error) {
      console.error('Update error:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}