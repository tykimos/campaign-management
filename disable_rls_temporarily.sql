-- Temporarily disable RLS for campaigns table to fix update issues
-- WARNING: This removes all access control - use only for debugging

-- 1. Disable RLS on campaigns table
ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on campaign_posts table
ALTER TABLE public.campaign_posts DISABLE ROW LEVEL SECURITY;

-- 3. Disable RLS on campaign_channels table
ALTER TABLE public.campaign_channels DISABLE ROW LEVEL SECURITY;

-- 4. Keep RLS enabled but fix users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create simple policy for users
CREATE POLICY "Anyone can view users" 
  ON public.users FOR SELECT 
  USING (true);

CREATE POLICY "Users can update themselves" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- Note: To re-enable RLS later, use:
-- ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.campaign_posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.campaign_channels ENABLE ROW LEVEL SECURITY;