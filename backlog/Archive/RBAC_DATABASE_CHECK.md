# RBAC Database Status Check

## Quick Database Check Guide

Since you mentioned you previously executed `rbac_foundation.sql`, here's how to check what's missing:

### 1. Check Tables in Supabase Dashboard

Go to your Supabase Dashboard → Table Editor and verify these tables exist:

#### ✅ Required Tables:
- **`user_roles`** - Should have 4 rows: platform_admin, tenant_admin, teacher, student
- **`resources`** - Should have 20+ rows with resources like `page:admin_dashboard`, `api:invite_user`, etc.
- **`role_permissions`** - Should have 40+ rows connecting roles to resources
- **`user_tenants`** - Should already exist (enhanced for RBAC)

### 2. Check Functions in SQL Editor

Run this query in Supabase SQL Editor to test if functions exist:

```sql
-- Test if check_permission function exists
SELECT public.check_permission(
  NULL::uuid,                     -- tenant_id
  'page:admin_dashboard'::text,   -- resource
  'read'::text                    -- action
);
```

**Expected Result**: Should return `true` or `false` (not an error)

### 3. What You Need to Execute

Based on what you find, run these in Supabase SQL Editor (in order):

#### If functions are missing:
```sql
-- Run this file: supabase/migrations/20250906_rbac_functions.sql
```

#### If tables are empty (no roles/resources/permissions):
```sql
-- Run this file: supabase/migrations/20250906_rbac_seed_data.sql  
```

## Quick Status Check

**✅ Foundation Tables**: You said you ran `rbac_foundation.sql` ✓

**❓ Functions**: Run the SQL test above to check

**❓ Seed Data**: Check if `user_roles` table has 4 roles

## Next Steps

1. **If functions missing**: Execute `20250906_rbac_functions.sql`
2. **If data missing**: Execute `20250906_rbac_seed_data.sql`
3. **If everything exists**: We can start testing user roles!

## Test User Assignment

Once tables/functions/data are confirmed, assign a test user to a role:

```sql
-- Make yourself a platform admin (replace 'your-user-id-here')
INSERT INTO public.user_tenants (user_id, tenant_id, role_id, status)
VALUES (
  'your-user-id-here',
  NULL, -- Platform admins don't need tenant
  (SELECT id FROM public.user_roles WHERE name = 'platform_admin'),
  'active'
);
```

---

**Tell me what you find and I'll guide you through the remaining steps!**