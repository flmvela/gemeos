-- Update function to avoid self-updating the same tuple in BEFORE trigger
CREATE OR REPLACE FUNCTION public.update_concept_difficulty_levels()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_parent_level int;
BEGIN
  -- If the parent_concept_id has not changed, do nothing
  IF NEW.parent_concept_id IS NOT DISTINCT FROM OLD.parent_concept_id THEN
    RETURN NEW;
  END IF;

  -- Get the level of the new parent
  IF NEW.parent_concept_id IS NULL THEN
    new_parent_level := -1; -- Set to -1 so the new level becomes 0
  ELSE
    SELECT difficulty_level INTO new_parent_level FROM public.concepts WHERE id = NEW.parent_concept_id;
  END IF;

  -- Set the moved concept's own level directly on NEW (safe in BEFORE trigger)
  NEW.difficulty_level := new_parent_level + 1;

  -- Update only the descendants (exclude the moved node itself) to avoid self-update conflict
  WITH RECURSIVE concept_hierarchy AS (
    SELECT id, parent_concept_id, NEW.difficulty_level + 1 AS new_level
    FROM public.concepts
    WHERE parent_concept_id = NEW.id

    UNION ALL

    SELECT c.id, c.parent_concept_id, ch.new_level + 1
    FROM public.concepts c
    JOIN concept_hierarchy ch ON c.parent_concept_id = ch.id
  )
  UPDATE public.concepts c
  SET difficulty_level = ch.new_level
  FROM concept_hierarchy ch
  WHERE c.id = ch.id;

  RETURN NEW;
END;
$$;