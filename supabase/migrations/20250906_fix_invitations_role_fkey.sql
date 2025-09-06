-- Fix invitations table foreign key constraint to reference user_roles instead of roles
-- This migration fixes the foreign key constraint mismatch that causes 409 errors

-- Drop the existing foreign key constraint
ALTER TABLE public.invitations 
DROP CONSTRAINT IF EXISTS invitations_role_id_fkey;

-- Add the new foreign key constraint referencing user_roles
ALTER TABLE public.invitations 
ADD CONSTRAINT invitations_role_id_fkey 
FOREIGN KEY (role_id) REFERENCES public.user_roles(id) ON DELETE RESTRICT;