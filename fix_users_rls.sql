-- Fix the infinite recursion in users table RLS policies
-- The problem: campaigns UPDATE policy checks users table for admin status,
-- but users SELECT policy also tries to check admin status, creating a loop

-- Step 1: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update themselves" ON public.users;
DROP POLICY IF EXISTS "Anyone can view users" ON public.users;

-- Step 2: Create simple, non-recursive policies for users table
-- Allow users to see their own profile
CREATE POLICY "Users can view own profile" 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

-- Allow checking if a user is admin (needed for other tables' RLS)
-- This policy allows reading ONLY the admin role users
CREATE POLICY "Anyone can check admin users" 
  ON public.users FOR SELECT
  USING (role = 'admin');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- Allow users to insert themselves (for signup)
CREATE POLICY "Users can insert themselves" 
  ON public.users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Step 3: Fix campaigns table policies to avoid recursion
DROP POLICY IF EXISTS "Users can update own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete campaigns" ON public.campaigns;

-- Simplified update policy - user can update if they created it OR if created_by is NULL
CREATE POLICY "Users can update campaigns" 
  ON public.campaigns FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() 
      OR created_by IS NULL
      -- Check admin status without recursion
      OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
        LIMIT 1
      )
    )
  );

-- Simplified delete policy
CREATE POLICY "Users can delete campaigns" 
  ON public.campaigns FOR DELETE 
  USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() 
      OR created_by IS NULL
      -- Check admin status without recursion
      OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
        LIMIT 1
      )
    )
  );

-- Step 4: Fix campaign_posts policies similarly
DROP POLICY IF EXISTS "Users can update own posts" ON public.campaign_posts;
DROP POLICY IF EXISTS "Users can update posts" ON public.campaign_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.campaign_posts;
DROP POLICY IF EXISTS "Users can delete posts" ON public.campaign_posts;

CREATE POLICY "Users can update posts" 
  ON public.campaign_posts FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL AND (
      posted_by = auth.uid() 
      OR posted_by IS NULL
      OR EXISTS (
        SELECT 1 FROM public.campaigns 
        WHERE campaigns.id = campaign_posts.campaign_id 
        AND (campaigns.created_by = auth.uid() OR campaigns.created_by IS NULL)
      )
      OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
        LIMIT 1
      )
    )
  );

CREATE POLICY "Users can delete posts" 
  ON public.campaign_posts FOR DELETE 
  USING (
    auth.uid() IS NOT NULL AND (
      posted_by = auth.uid() 
      OR posted_by IS NULL
      OR EXISTS (
        SELECT 1 FROM public.campaigns 
        WHERE campaigns.id = campaign_posts.campaign_id 
        AND (campaigns.created_by = auth.uid() OR campaigns.created_by IS NULL)
      )
      OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
        LIMIT 1
      )
    )
  );

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';