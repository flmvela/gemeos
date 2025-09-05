-- Fix function search path security issues by setting explicit search_path
ALTER FUNCTION public.set_user_role(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.set_user_admin_role(text) SET search_path = 'public';
ALTER FUNCTION public.debug_current_user_jwt() SET search_path = 'public';
ALTER FUNCTION public.test_user_is_admin() SET search_path = 'public';