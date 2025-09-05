-- Add display_order column to concepts table for manual ordering
ALTER TABLE public.concepts 
ADD COLUMN display_order integer;