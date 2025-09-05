-- Fix the RLS policies to correctly access the role from app_metadata
-- Drop existing policies that use the wrong role access method
DROP POLICY IF EXISTS "Admins can manage pages" ON public.pages;
DROP POLICY IF EXISTS "Admins can manage page permissions" ON public.page_permissions;

-- Create correct policies that access role from app_metadata
CREATE POLICY "Admins can manage pages" 
ON public.pages 
FOR ALL 
USING ((auth.jwt() -> 'app_metadata' ->> 'role'::text) = 'admin'::text)
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Admins can manage page permissions" 
ON public.page_permissions 
FOR ALL 
USING ((auth.jwt() -> 'app_metadata' ->> 'role'::text) = 'admin'::text)
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role'::text) = 'admin'::text);

-- Also update the user permissions policy to use app_metadata
DROP POLICY IF EXISTS "Users can read their role permissions" ON public.page_permissions;

CREATE POLICY "Users can read their role permissions" 
ON public.page_permissions 
FOR SELECT 
USING (
    is_active = true 
    AND role = (auth.jwt() -> 'app_metadata' ->> 'role'::text)
);

-- Update other policies that reference role access
UPDATE pg_policy SET policyqual = replace(
    policyqual::text, 
    '(auth.jwt() ->> ''role''::text)', 
    '(auth.jwt() -> ''app_metadata'' ->> ''role''::text)'
)::pg_node_tree
WHERE schemaname = 'public' 
AND policyqual::text LIKE '%(auth.jwt() ->> ''role''::text)%';