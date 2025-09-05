-- Function to set user role in JWT claims
CREATE OR REPLACE FUNCTION public.set_user_role(user_id UUID, role_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user's raw_app_meta_data to include the role
  UPDATE auth.users 
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', role_name)
  WHERE id = user_id;
END;
$$;

-- After creating the user admin@gemeos.ai in the dashboard, 
-- you can run this to set their role to admin:
-- SELECT public.set_user_role('USER_ID_HERE', 'admin');