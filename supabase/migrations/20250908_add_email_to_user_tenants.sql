-- ============================================================
-- Add email column to user_tenants table
-- This migration adds an email column and populates it with user emails
-- ============================================================

-- 1. Add email column to user_tenants table
ALTER TABLE public.user_tenants 
ADD COLUMN IF NOT EXISTS email text;

-- 2. Update existing records with emails from auth.users
UPDATE public.user_tenants ut
SET email = u.email
FROM auth.users u
WHERE ut.user_id = u.id
AND ut.email IS NULL;

-- 3. Create or replace function to automatically set email on insert/update
CREATE OR REPLACE FUNCTION public.set_user_tenant_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Get email from auth.users table
  SELECT email INTO NEW.email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to automatically populate email
DROP TRIGGER IF EXISTS set_user_tenant_email_trigger ON public.user_tenants;
CREATE TRIGGER set_user_tenant_email_trigger
  BEFORE INSERT OR UPDATE OF user_id ON public.user_tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_tenant_email();

-- 5. Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_tenants_email 
ON public.user_tenants(email);

-- 6. Add index for tenant_id and email combination (useful for lookups)
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_email 
ON public.user_tenants(tenant_id, email);

-- 7. Update RLS policies if needed (optional - depends on your requirements)
-- This allows users to see emails of other users in the same tenant
-- Uncomment if you want this behavior:
/*
CREATE POLICY "Users can view emails in same tenant" ON public.user_tenants
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants 
      WHERE user_id = auth.uid()
    )
  );
*/

-- 8. Add comment to document the column
COMMENT ON COLUMN public.user_tenants.email IS 'User email from auth.users, automatically synced via trigger';