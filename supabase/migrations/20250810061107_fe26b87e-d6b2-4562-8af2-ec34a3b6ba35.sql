-- Register Admin AI Training page and admin permission
-- 1) Ensure the page exists
INSERT INTO public.pages (path, description)
SELECT '/admin/ai-training', 'Admin AI Training settings'
WHERE NOT EXISTS (
  SELECT 1 FROM public.pages WHERE path = '/admin/ai-training'
);

-- 2) Grant access to admin role
WITH page_row AS (
  SELECT id FROM public.pages WHERE path = '/admin/ai-training'
)
INSERT INTO public.page_permissions (page_id, role, is_active, updated_at)
SELECT id, 'admin', true, now() FROM page_row
ON CONFLICT (page_id, role)
DO UPDATE SET is_active = EXCLUDED.is_active, updated_at = now();