-- Add the Learning Concepts page to the pages table
INSERT INTO pages (path, description) 
VALUES ('/admin/domain/:domainId/concepts', 'Learning Concepts Management for Domains');

-- Add admin permission for the new concepts page
INSERT INTO page_permissions (page_id, role, is_active)
SELECT p.id, 'admin', true
FROM pages p 
WHERE p.path = '/admin/domain/:domainId/concepts';