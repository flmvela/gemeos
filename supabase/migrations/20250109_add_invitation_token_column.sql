-- Add invitation_token and user_id columns to invitations table for teacher invitations
BEGIN;

-- Add invitation_token column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invitations' 
    AND column_name = 'invitation_token'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.invitations 
    ADD COLUMN invitation_token UUID DEFAULT gen_random_uuid();
    
    -- Create unique index on invitation_token
    CREATE UNIQUE INDEX idx_invitations_token ON public.invitations(invitation_token);
  END IF;
END $$;

-- Add user_id column if it doesn't exist (to link invitation to created user)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invitations' 
    AND column_name = 'user_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.invitations 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

COMMIT;