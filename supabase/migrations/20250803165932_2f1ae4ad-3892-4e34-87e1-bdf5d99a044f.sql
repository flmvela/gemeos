-- Add the AI Guidance page to the pages table
INSERT INTO public.pages (path, description) 
VALUES ('/admin/domain/:domainId/ai-guidance', 'AI Guidance Management for Domains');

-- Get the page ID for the new AI Guidance page
WITH new_page AS (
  SELECT id FROM public.pages WHERE path = '/admin/domain/:domainId/ai-guidance'
)
-- Add admin permission for the AI Guidance page
INSERT INTO public.page_permissions (page_id, role, is_active, updated_at)
SELECT 
  new_page.id,
  'admin',
  true,
  now()
FROM new_page;