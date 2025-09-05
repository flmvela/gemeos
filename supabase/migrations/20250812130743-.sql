-- Create Design System page and grant admin access if not present
-- Ensure the page record exists
insert into public.pages (path, description, created_at)
select '/admin/design-system', 'Design System page', now()
where not exists (
  select 1 from public.pages where path = '/admin/design-system'
);

-- Ensure admin role has active permission for this page
insert into public.page_permissions (page_id, role, is_active, updated_at)
select p.id, 'admin', true, now()
from public.pages p
where p.path = '/admin/design-system'
  and not exists (
    select 1 from public.page_permissions pp 
    where pp.page_id = p.id and pp.role = 'admin'
  );