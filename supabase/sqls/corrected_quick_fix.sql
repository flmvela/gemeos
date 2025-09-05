-- ============================================================
-- CORRECTED QUICK FIX - DISABLE RLS FOR TESTING
-- ============================================================
-- Apply this in Supabase SQL Editor to fix the 406 errors
-- Based on actual table structures discovered

-- Temporarily disable RLS on critical tables for testing
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;  
ALTER TABLE public.user_tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_domains DISABLE ROW LEVEL SECURITY;

-- Also disable on profiles if it exists with RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Ensure all permissions are granted to authenticated users
GRANT ALL ON public.tenants TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.profiles TO authenticated;  
GRANT ALL ON public.user_tenants TO authenticated;
GRANT ALL ON public.invitations TO authenticated;
GRANT ALL ON public.domains TO authenticated;
GRANT ALL ON public.tenant_domains TO authenticated;

-- Grant comprehensive permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant usage on sequences (needed for INSERTs with auto-generated IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on all functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Verify the changes
SELECT 
    schemaname,
    tablename, 
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tenants', 'user_roles', 'user_tenants', 'invitations', 'domains', 'tenant_domains', 'profiles')
ORDER BY tablename;