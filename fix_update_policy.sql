-- Fix the UPDATE policy for campaigns table
-- The issue: UPDATE requires auth.uid() IS NOT NULL but we're not using authentication

-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "Users can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Simple campaign update" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can update campaigns" ON public.campaigns;

-- Create a simple UPDATE policy that allows anyone to update campaigns
-- This is for demo/development - in production, you'd want proper authentication
CREATE POLICY "Anyone can update campaigns" 
  ON public.campaigns FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Also fix INSERT policy to be consistent
DROP POLICY IF EXISTS "Users can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert campaigns" ON public.campaigns;

CREATE POLICY "Anyone can insert campaigns" 
  ON public.campaigns FOR INSERT 
  WITH CHECK (true);

-- Fix DELETE policy too
DROP POLICY IF EXISTS "Users can delete campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete campaigns" ON public.campaigns;

CREATE POLICY "Anyone can delete campaigns" 
  ON public.campaigns FOR DELETE 
  USING (true);

-- Notify PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';

-- Check the results
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'campaigns' 
ORDER BY policyname;