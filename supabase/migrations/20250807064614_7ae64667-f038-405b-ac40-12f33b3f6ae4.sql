-- Check current RLS policies on concepts table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'concepts';

-- Create RLS policy to allow admin users to update concepts
CREATE POLICY "Admins can update all concepts" ON public.concepts
FOR UPDATE 
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Also ensure admins can select all concepts 
CREATE POLICY "Admins can view all concepts" ON public.concepts  
FOR SELECT
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);