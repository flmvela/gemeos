-- Add Add Examples page and grant admin access
-- 1) Insert page if it does not exist
INSERT INTO public.pages (path, description)
SELECT '/admin/domain/:domainId/ai-guidance/:area/examples/new', 'Add Examples for learning goals (concept selection, manual or bulk upload)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.pages WHERE path = '/admin/domain/:domainId/ai-guidance/:area/examples/new'
);

-- 2) Grant admin permission if not exists
WITH p AS (
  SELECT id FROM public.pages WHERE path = '/admin/domain/:domainId/ai-guidance/:area/examples/new'
)
INSERT INTO public.page_permissions (page_id, role, is_active)
SELECT p.id, 'admin', true
FROM p
WHERE NOT EXISTS (
  SELECT 1 FROM public.page_permissions WHERE page_id = p.id AND role = 'admin'
);
