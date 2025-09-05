-- Add the feedback settings page to the pages table
INSERT INTO public.pages (path, description) 
VALUES ('/admin/settings/feedback', 'AI Feedback Settings Management');

-- Get the page ID and add admin permission
INSERT INTO public.page_permissions (page_id, role, is_active)
SELECT p.id, 'admin', true
FROM public.pages p
WHERE p.path = '/admin/settings/feedback';