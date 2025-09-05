-- Fix other policies that still use the wrong role access method
-- Fix evaluation methods policies
DROP POLICY IF EXISTS "Only admins can delete evaluation methods" ON public.evaluation_methods;
DROP POLICY IF EXISTS "Only admins can insert evaluation methods" ON public.evaluation_methods;
DROP POLICY IF EXISTS "Only admins can update evaluation methods" ON public.evaluation_methods;

CREATE POLICY "Only admins can delete evaluation methods" 
ON public.evaluation_methods 
FOR DELETE 
USING ((auth.jwt() -> 'app_metadata' ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Only admins can insert evaluation methods" 
ON public.evaluation_methods 
FOR INSERT 
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Only admins can update evaluation methods" 
ON public.evaluation_methods 
FOR UPDATE 
USING ((auth.jwt() -> 'app_metadata' ->> 'role'::text) = 'admin'::text);

-- Fix other admin policies
DROP POLICY IF EXISTS "Only admins can delete content formats" ON public.content_formats;
DROP POLICY IF EXISTS "Only admins can insert content formats" ON public.content_formats;
DROP POLICY IF EXISTS "Only admins can update content formats" ON public.content_formats;

CREATE POLICY "Only admins can delete content formats" 
ON public.content_formats 
FOR DELETE 
USING ((auth.jwt() -> 'app_metadata' ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Only admins can insert content formats" 
ON public.content_formats 
FOR INSERT 
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Only admins can update content formats" 
ON public.content_formats 
FOR UPDATE 
USING ((auth.jwt() -> 'app_metadata' ->> 'role'::text) = 'admin'::text);