-- Create a function to test what's in the current user's JWT
CREATE OR REPLACE FUNCTION public.debug_current_user_jwt()
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    jwt_role TEXT,
    raw_app_meta_data JSONB,
    raw_user_meta_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid() as user_id,
        (auth.jwt() ->> 'email')::TEXT as user_email,
        (auth.jwt() ->> 'role')::TEXT as jwt_role,
        u.raw_app_meta_data,
        u.raw_user_meta_data
    FROM auth.users u 
    WHERE u.id = auth.uid();
END;
$$;

-- Also create a simpler test function to check if user has admin role
CREATE OR REPLACE FUNCTION public.test_user_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (auth.jwt() ->> 'role'::text) = 'admin'::text;
END;
$$;