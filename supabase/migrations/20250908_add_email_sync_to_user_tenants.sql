-- ============================================================
-- Enhanced email column addition for user_tenants table
-- Adds email column with automatic synchronization
-- ============================================================

BEGIN;

-- 1. Add email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_tenants' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.user_tenants ADD COLUMN email text;
  END IF;
END $$;

-- 2. Update all existing records with current emails
UPDATE public.user_tenants ut
SET email = u.email
FROM auth.users u
WHERE ut.user_id = u.id
AND (ut.email IS NULL OR ut.email != u.email);

-- 3. Function to sync email from auth.users
CREATE OR REPLACE FUNCTION public.sync_user_tenant_email()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT or UPDATE, get the latest email from auth.users
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    SELECT email INTO NEW.email
    FROM auth.users
    WHERE id = NEW.user_id;
    
    -- If user not found, prevent the operation
    IF NEW.email IS NULL THEN
      RAISE EXCEPTION 'User % not found in auth.users', NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_user_tenant_email_trigger ON public.user_tenants;

-- 5. Create trigger for automatic email sync
CREATE TRIGGER sync_user_tenant_email_trigger
  BEFORE INSERT OR UPDATE OF user_id ON public.user_tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_tenant_email();

-- 6. Function to handle auth.users email updates
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
  -- When email changes in auth.users, update all related user_tenants records
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.user_tenants
    SET email = NEW.email
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger on auth.users to propagate email changes
-- Note: This requires proper permissions. If it fails, you may need to run as superuser
DO $$ 
BEGIN
  -- Check if we can create trigger on auth.users
  IF EXISTS (
    SELECT 1 FROM pg_namespace WHERE nspname = 'auth'
  ) THEN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS propagate_email_changes ON auth.users;
    
    -- Create new trigger
    CREATE TRIGGER propagate_email_changes
      AFTER UPDATE OF email ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_user_email_update();
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create trigger on auth.users - insufficient privileges. Email sync will work for new records only.';
END $$;

-- 8. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_tenants_email 
  ON public.user_tenants(email);

CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_email 
  ON public.user_tenants(tenant_id, email);

CREATE INDEX IF NOT EXISTS idx_user_tenants_user_tenant 
  ON public.user_tenants(user_id, tenant_id);

-- 9. Add constraints to ensure data integrity
-- Make email not null after populating existing records
ALTER TABLE public.user_tenants 
  ALTER COLUMN email SET NOT NULL;

-- 10. Add check constraint to validate email format (optional)
ALTER TABLE public.user_tenants 
  ADD CONSTRAINT check_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 11. Document the column
COMMENT ON COLUMN public.user_tenants.email IS 'User email automatically synced from auth.users via trigger';

-- 12. Create a view for easier querying (optional)
CREATE OR REPLACE VIEW public.user_tenants_with_details AS
SELECT 
  ut.*,
  u.email_confirmed_at,
  u.last_sign_in_at,
  u.created_at as user_created_at,
  t.name as tenant_name,
  t.slug as tenant_slug,
  r.name as role_name,
  r.display_name as role_display_name
FROM public.user_tenants ut
JOIN auth.users u ON ut.user_id = u.id
JOIN public.tenants t ON ut.tenant_id = t.id
JOIN public.user_roles r ON ut.role_id = r.id;

-- Grant appropriate permissions on the view
GRANT SELECT ON public.user_tenants_with_details TO authenticated;

COMMIT;

-- Verification query to check the migration worked
-- Run this separately to verify:
/*
SELECT 
  ut.id,
  ut.user_id,
  ut.tenant_id,
  ut.email,
  u.email as auth_email,
  ut.email = u.email as emails_match
FROM public.user_tenants ut
JOIN auth.users u ON ut.user_id = u.id
LIMIT 10;
*/