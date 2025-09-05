-- Add admin upload page to pages table and permissions
INSERT INTO public.pages (id, path, description) 
VALUES (gen_random_uuid(), '/admin/upload', 'Admin File Upload Management');

-- Add admin permission for the new upload page
INSERT INTO public.page_permissions (page_id, role, is_active)
SELECT p.id, 'admin', true
FROM public.pages p
WHERE p.path = '/admin/upload';