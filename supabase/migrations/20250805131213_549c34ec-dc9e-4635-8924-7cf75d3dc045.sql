-- First, remove the old constraint to avoid conflicts
ALTER TABLE public.concepts DROP CONSTRAINT concepts_status_check;

-- Then, add the new constraint with 'ai_suggested' included
-- Adjust the list if you have other valid statuses
ALTER TABLE public.concepts ADD CONSTRAINT concepts_status_check 
CHECK (status IN ('approved', 'rejected', 'suggested', 'pending', 'ai_suggested'));