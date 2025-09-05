-- Add the missing page for AI guidance editor
INSERT INTO pages (path, description) 
VALUES ('/admin/domain/:domainId/ai-guidance/:area', 'AI Guidance Editor for specific guidance areas');

-- Grant admin access to the new page
INSERT INTO page_permissions (page_id, role, is_active)
SELECT p.id, 'admin', true
FROM pages p 
WHERE p.path = '/admin/domain/:domainId/ai-guidance/:area';