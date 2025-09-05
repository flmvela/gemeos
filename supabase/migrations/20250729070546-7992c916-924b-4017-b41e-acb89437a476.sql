-- Create pages table
CREATE TABLE public.pages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    path TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create page_permissions table
CREATE TABLE public.page_permissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(page_id, role)
);

-- Enable RLS on both tables
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pages table
-- Admins can do everything
CREATE POLICY "Admins can manage pages" 
ON public.pages 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- All authenticated users can read pages
CREATE POLICY "All users can read pages" 
ON public.pages 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- RLS Policies for page_permissions table
-- Admins can do everything
CREATE POLICY "Admins can manage page permissions" 
ON public.page_permissions 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'admin'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Other roles can only read active permissions for their role
CREATE POLICY "Users can read their role permissions" 
ON public.page_permissions 
FOR SELECT 
USING (
    is_active = true 
    AND role = (auth.jwt() ->> 'role'::text)
);

-- Create updated_at trigger for page_permissions
CREATE TRIGGER update_page_permissions_updated_at
BEFORE UPDATE ON public.page_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the pages table with current routes
INSERT INTO public.pages (path, description) VALUES
('/teacher/dashboard', 'Teacher Dashboard'),
('/teacher/domain-selection', 'Domain Selection'),
('/teacher/settings/curriculum-setup', 'Curriculum Setup'),
('/teacher/administration', 'Administration Overview'),
('/teacher/administration/domains', 'Domain Management'),
('/admin/page-permissions', 'Page Permissions Management');

-- Set default permissions (all roles can access their respective areas)
INSERT INTO public.page_permissions (page_id, role, is_active)
SELECT 
    p.id,
    unnest(ARRAY['admin', 'teacher']) as role,
    true
FROM public.pages p
WHERE p.path LIKE '/teacher/%';

-- Admin-only access to page permissions
INSERT INTO public.page_permissions (page_id, role, is_active)
SELECT 
    p.id,
    'admin' as role,
    true
FROM public.pages p
WHERE p.path = '/admin/page-permissions';