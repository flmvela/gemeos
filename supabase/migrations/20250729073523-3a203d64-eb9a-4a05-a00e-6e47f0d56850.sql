-- Fix page permissions RLS policies to use correct role path
DROP POLICY IF EXISTS "Admins can manage page permissions" ON public.page_permissions;
DROP POLICY IF EXISTS "Users can read their role permissions" ON public.page_permissions;

-- Create corrected policies using app_metadata role path
CREATE POLICY "Admins can manage page permissions" 
ON public.page_permissions 
FOR ALL 
USING ((auth.jwt() -> 'app_metadata' ->> 'role'::text) = 'admin'::text)
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Users can read their role permissions" 
ON public.page_permissions 
FOR SELECT 
USING ((is_active = true) AND (role = (auth.jwt() -> 'app_metadata' ->> 'role'::text)));