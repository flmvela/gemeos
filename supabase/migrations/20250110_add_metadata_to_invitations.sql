-- Add metadata column to invitations table for storing profile data
BEGIN;

-- Add metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invitations' 
    AND column_name = 'metadata'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.invitations 
    ADD COLUMN metadata JSONB DEFAULT '{}';
    
    COMMENT ON COLUMN public.invitations.metadata IS 'Stores additional data for the invitation (e.g., teacher profile data)';
  END IF;
END $$;

COMMIT;