-- Fix RLS policies for campaigns table
-- This script fixes the infinite recursion issue when updating campaigns

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can update own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete own campaigns" ON public.campaigns;

-- Create new update policy that handles NULL created_by
CREATE POLICY "Users can update campaigns" 
  ON public.campaigns FOR UPDATE 
  USING (
    -- Allow if user created the campaign (and created_by is not null)
    (created_by IS NOT NULL AND created_by = auth.uid())
    OR 
    -- Allow if user is admin (simplified check without recursion)
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
    OR
    -- Allow if created_by is NULL (for imported data)
    created_by IS NULL
  );

-- Create new delete policy that handles NULL created_by
CREATE POLICY "Users can delete campaigns" 
  ON public.campaigns FOR DELETE 
  USING (
    -- Allow if user created the campaign (and created_by is not null)
    (created_by IS NOT NULL AND created_by = auth.uid())
    OR 
    -- Allow if user is admin (simplified check without recursion)
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
    OR
    -- Allow if created_by is NULL (for imported data)
    created_by IS NULL
  );

-- Also fix the posts table policies
DROP POLICY IF EXISTS "Users can update own posts" ON public.campaign_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.campaign_posts;

-- Create new update policy for posts
CREATE POLICY "Users can update posts" 
  ON public.campaign_posts FOR UPDATE 
  USING (
    -- Allow if user posted it (and posted_by is not null)
    (posted_by IS NOT NULL AND posted_by = auth.uid())
    OR 
    -- Allow if user is admin
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
    OR
    -- Allow if posted_by is NULL (for imported data)
    posted_by IS NULL
    OR
    -- Allow if user created the campaign
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id 
      AND (created_by = auth.uid() OR created_by IS NULL)
    )
  );

-- Create new delete policy for posts
CREATE POLICY "Users can delete posts" 
  ON public.campaign_posts FOR DELETE 
  USING (
    -- Allow if user posted it (and posted_by is not null)
    (posted_by IS NOT NULL AND posted_by = auth.uid())
    OR 
    -- Allow if user is admin
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
    OR
    -- Allow if posted_by is NULL (for imported data)
    posted_by IS NULL
    OR
    -- Allow if user created the campaign
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE id = campaign_id 
      AND (created_by = auth.uid() OR created_by IS NULL)
    )
  );

-- Also simplify the users table policies to avoid recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;

-- Create simplified users policies
CREATE POLICY "Users can view profiles" 
  ON public.users FOR SELECT 
  USING (
    -- Users can see their own profile
    auth.uid() = id
    OR
    -- Anyone can see admin users (for UI purposes)
    role = 'admin'
    OR
    -- Admins can see all users (without recursion)
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';