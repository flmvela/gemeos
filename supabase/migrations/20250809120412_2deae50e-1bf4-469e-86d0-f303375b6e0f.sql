-- Add metadata for alignment and provenance on learning goals
ALTER TABLE public.learning_goals
ADD COLUMN IF NOT EXISTS metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb;