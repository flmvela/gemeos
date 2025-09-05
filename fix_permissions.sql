-- ============================================================
-- TEMPORARY FIX - DISABLE RLS FOR TESTING
-- ============================================================
-- Apply this in Supabase SQL Editor to fix the immediate 406 errors

-- Temporarily disable RLS on critical tables for testing
ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;  
ALTER TABLE public.user_tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_domains DISABLE ROW LEVEL SECURITY;

-- Ensure all permissions are granted
GRANT ALL ON public.tenants TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT ALL ON public.profiles TO authenticated;  
GRANT ALL ON public.user_tenants TO authenticated;
GRANT ALL ON public.invitations TO authenticated;
GRANT ALL ON public.domains TO authenticated;
GRANT ALL ON public.tenant_domains TO authenticated;

-- Grant select permissions specifically
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO authenticated;