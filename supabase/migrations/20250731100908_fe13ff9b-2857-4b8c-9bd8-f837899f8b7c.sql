-- Step 1: Remove the old, restrictive constraint from the concepts table
ALTER TABLE public.concepts DROP CONSTRAINT concepts_status_check;

-- Step 2: Add a new, updated constraint that includes 'pending' and 'suggested' as allowed values
ALTER TABLE public.concepts ADD CONSTRAINT concepts_status_check 
CHECK (status IN ('approved', 'rejected', 'pending', 'suggested'));