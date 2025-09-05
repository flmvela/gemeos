-- Create trigger to update difficulty levels when parent_concept_id changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_concepts_difficulty_on_parent_change'
  ) THEN
    CREATE TRIGGER trg_update_concepts_difficulty_on_parent_change
    BEFORE UPDATE ON public.concepts
    FOR EACH ROW
    WHEN (OLD.parent_concept_id IS DISTINCT FROM NEW.parent_concept_id)
    EXECUTE FUNCTION public.update_concept_difficulty_levels();
  END IF;
END $$;