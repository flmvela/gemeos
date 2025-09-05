-- Register Concept Detail Page and grant admin access
-- 1) Ensure the page record exists
insert into public.pages (path, description)
values ('/admin/domain/:domainSlug/concepts/:conceptId', 'Concept detail management page')
on conflict (path) do update set description = excluded.description;

-- 2) Grant admin role permission to access the page (idempotent)
insert into public.page_permissions (page_id, role, is_active)
select p.id, 'admin', true
from public.pages p
where p.path = '/admin/domain/:domainSlug/concepts/:conceptId'
and not exists (
  select 1 from public.page_permissions pp
  where pp.page_id = p.id and pp.role = 'admin'
);
