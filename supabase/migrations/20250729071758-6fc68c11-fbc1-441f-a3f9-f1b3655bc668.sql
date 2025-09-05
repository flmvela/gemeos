-- Create a better function to set user role that ensures it's in the JWT
CREATE OR REPLACE FUNCTION public.set_user_admin_role(user_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Find the user by email
    SELECT id, raw_app_meta_data 
    INTO user_record
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_record.id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    -- Update the user's raw_app_meta_data to include the admin role
    UPDATE auth.users 
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
    WHERE id = user_record.id;
    
    RAISE NOTICE 'Admin role set for user: %', user_email;
END;
$$;

-- Set admin role for the admin user (run this after creating the user)
SELECT public.set_user_admin_role('admin@gemeos.ai');