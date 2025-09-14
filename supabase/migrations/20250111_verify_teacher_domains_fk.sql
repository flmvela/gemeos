-- Verify and recreate foreign key constraint for teacher_domains
-- This ensures the relationship is properly established

BEGIN;

-- Check if the foreign key constraint exists and recreate it
ALTER TABLE public.teacher_domains 
  DROP CONSTRAINT IF EXISTS teacher_domains_domain_id_fkey;

ALTER TABLE public.teacher_domains
  ADD CONSTRAINT teacher_domains_domain_id_fkey 
  FOREIGN KEY (domain_id) 
  REFERENCES public.domains(id) 
  ON DELETE CASCADE;

-- Add comment to clarify the relationship
COMMENT ON CONSTRAINT teacher_domains_domain_id_fkey ON public.teacher_domains 
  IS 'Foreign key linking teacher_domains to domains table';

-- Verify the constraint was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'teacher_domains_domain_id_fkey' 
    AND table_name = 'teacher_domains'
  ) THEN
    RAISE EXCEPTION 'Foreign key constraint was not created successfully';
  END IF;
END $$;

COMMIT;