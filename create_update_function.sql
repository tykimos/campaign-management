-- Create a PostgreSQL function to update campaigns without RLS restrictions
-- This function runs with SECURITY DEFINER, meaning it runs with the permissions
-- of the user who created it (superuser), bypassing RLS

CREATE OR REPLACE FUNCTION public.update_campaign_safe(
  p_campaign_id BIGINT,
  p_name TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_category_id TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_target_views INT DEFAULT NULL,
  p_target_registrations INT DEFAULT NULL,
  p_budget DECIMAL DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Update only the fields that are not NULL
  UPDATE campaigns
  SET 
    name = COALESCE(p_name, name),
    description = CASE WHEN p_description IS NOT NULL THEN p_description ELSE description END,
    category_id = CASE WHEN p_category_id IS NOT NULL THEN p_category_id ELSE category_id END,
    start_date = CASE WHEN p_start_date IS NOT NULL THEN p_start_date ELSE start_date END,
    end_date = CASE WHEN p_end_date IS NOT NULL THEN p_end_date ELSE end_date END,
    target_views = COALESCE(p_target_views, target_views),
    target_registrations = COALESCE(p_target_registrations, target_registrations),
    budget = CASE WHEN p_budget IS NOT NULL THEN p_budget ELSE budget END,
    status = COALESCE(p_status, status),
    updated_at = NOW()
  WHERE id = p_campaign_id
  RETURNING row_to_json(campaigns.*) INTO v_result;
  
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Campaign not found or update failed';
  END IF;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_campaign_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_campaign_safe TO anon;

-- Create similar functions for posts and channels if needed
CREATE OR REPLACE FUNCTION public.update_post_safe(
  p_post_id BIGINT,
  p_post_url TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_posted_date DATE DEFAULT NULL,
  p_view_count INT DEFAULT NULL,
  p_click_count INT DEFAULT NULL,
  p_registration_count INT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  UPDATE campaign_posts
  SET 
    post_url = COALESCE(p_post_url, post_url),
    title = CASE WHEN p_title IS NOT NULL THEN p_title ELSE title END,
    posted_date = COALESCE(p_posted_date, posted_date),
    view_count = COALESCE(p_view_count, view_count),
    click_count = COALESCE(p_click_count, click_count),
    registration_count = COALESCE(p_registration_count, registration_count),
    status = COALESCE(p_status, status),
    updated_at = NOW()
  WHERE id = p_post_id
  RETURNING row_to_json(campaign_posts.*) INTO v_result;
  
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Post not found or update failed';
  END IF;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_post_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_post_safe TO anon;

-- Also create a simple function to check if user can update
CREATE OR REPLACE FUNCTION public.can_user_update_campaign(p_campaign_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For now, allow all authenticated users to update any campaign
  -- You can add more complex logic here later
  RETURN auth.uid() IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_user_update_campaign TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_update_campaign TO anon;