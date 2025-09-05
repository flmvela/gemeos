-- Create ai_training_settings table to persist admin AI training configuration
-- Includes proper unique indexes to support upserts for global, domain, and concept scopes

CREATE TABLE IF NOT EXISTS public.ai_training_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('global','domain','concept')),
  domain_id uuid NULL,
  concept_id uuid NULL,

  model_name text NOT NULL DEFAULT 'gemini-2.5-flash',
  region text NOT NULL DEFAULT 'europe-west4',
  temperature double precision NOT NULL DEFAULT 0.2,
  top_p double precision NOT NULL DEFAULT 0.95,
  max_output_tokens integer NOT NULL DEFAULT 512,
  candidate_count integer NOT NULL DEFAULT 5,

  style_similarity_min double precision NOT NULL DEFAULT 0.8,
  duplicate_similarity_max double precision NOT NULL DEFAULT 0.92,
  apply_strict_filter boolean NOT NULL DEFAULT true,
  fallback_to_bootstrap boolean NOT NULL DEFAULT true,
  enabled boolean NOT NULL DEFAULT true,

  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ai_settings_domain ON public.ai_training_settings (domain_id) WHERE scope = 'domain';
CREATE INDEX IF NOT EXISTS idx_ai_settings_concept ON public.ai_training_settings (concept_id) WHERE scope = 'concept';

-- Unique indexes to match the upsert onConflict usage in code
-- Global: only one row with scope='global'
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_settings_global ON public.ai_training_settings (scope) WHERE scope = 'global';
-- Domain: only one row per (scope='domain', domain_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_settings_domain ON public.ai_training_settings (scope, domain_id) WHERE scope = 'domain' AND domain_id IS NOT NULL;
-- Concept: only one row per (scope='concept', concept_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_settings_concept ON public.ai_training_settings (scope, concept_id) WHERE scope = 'concept' AND concept_id IS NOT NULL;

-- Row Level Security
ALTER TABLE public.ai_training_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Restrict full access to admins only using existing helper
DROP POLICY IF EXISTS "ai_settings_select_admin" ON public.ai_training_settings;
CREATE POLICY "ai_settings_select_admin"
  ON public.ai_training_settings
  FOR SELECT
  TO authenticated
  USING (public.test_user_is_admin());

DROP POLICY IF EXISTS "ai_settings_insert_admin" ON public.ai_training_settings;
CREATE POLICY "ai_settings_insert_admin"
  ON public.ai_training_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.test_user_is_admin());

DROP POLICY IF EXISTS "ai_settings_update_admin" ON public.ai_training_settings;
CREATE POLICY "ai_settings_update_admin"
  ON public.ai_training_settings
  FOR UPDATE
  TO authenticated
  USING (public.test_user_is_admin())
  WITH CHECK (public.test_user_is_admin());

DROP POLICY IF EXISTS "ai_settings_delete_admin" ON public.ai_training_settings;
CREATE POLICY "ai_settings_delete_admin"
  ON public.ai_training_settings
  FOR DELETE
  TO authenticated
  USING (public.test_user_is_admin());

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS trg_ai_settings_updated_at ON public.ai_training_settings;
CREATE TRIGGER trg_ai_settings_updated_at
  BEFORE UPDATE ON public.ai_training_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Optional trigger to auto-set created_by on insert when available
CREATE OR REPLACE FUNCTION public.set_created_by_if_null()
RETURNS trigger AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

DROP TRIGGER IF EXISTS trg_ai_settings_created_by ON public.ai_training_settings;
CREATE TRIGGER trg_ai_settings_created_by
  BEFORE INSERT ON public.ai_training_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by_if_null();