
-- 1) AI Training Settings table
CREATE TABLE IF NOT EXISTS public.ai_training_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL CHECK (scope IN ('global','domain','concept')),
  domain_id TEXT REFERENCES public.domains(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES public.concepts(id) ON DELETE CASCADE,

  -- Model/runtime
  model_name TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  region TEXT NOT NULL DEFAULT 'europe-west4',
  temperature DOUBLE PRECISION NOT NULL DEFAULT 0.2,
  top_p DOUBLE PRECISION NOT NULL DEFAULT 0.95,
  max_output_tokens INTEGER NOT NULL DEFAULT 512,
  candidate_count INTEGER NOT NULL DEFAULT 5,

  -- Filtering/tuning
  style_similarity_min DOUBLE PRECISION NOT NULL DEFAULT 0.80,
  duplicate_similarity_max DOUBLE PRECISION NOT NULL DEFAULT 0.92,
  apply_strict_filter BOOLEAN NOT NULL DEFAULT true,
  fallback_to_bootstrap BOOLEAN NOT NULL DEFAULT true,
  enabled BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Scope consistency
  CONSTRAINT ai_train_settings_scope_ck CHECK (
    (scope = 'global' AND domain_id IS NULL AND concept_id IS NULL)
    OR (scope = 'domain' AND domain_id IS NOT NULL AND concept_id IS NULL)
    OR (scope = 'concept' AND concept_id IS NOT NULL)
  )
);

-- 2) RLS
ALTER TABLE public.ai_training_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage everything
DROP POLICY IF EXISTS "Admins can manage ai training settings" ON public.ai_training_settings;
CREATE POLICY "Admins can manage ai training settings"
  ON public.ai_training_settings
  FOR ALL
  USING ((auth.jwt() ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

-- Authenticated users can read
DROP POLICY IF EXISTS "Authenticated can read ai training settings" ON public.ai_training_settings;
CREATE POLICY "Authenticated can read ai training settings"
  ON public.ai_training_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 3) Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS update_ai_training_settings_updated_at ON public.ai_training_settings;
CREATE TRIGGER update_ai_training_settings_updated_at
BEFORE UPDATE ON public.ai_training_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Uniqueness per scope
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='ai_training_settings_unique_global'
  ) THEN
    CREATE UNIQUE INDEX ai_training_settings_unique_global
    ON public.ai_training_settings ((scope))
    WHERE scope = 'global';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='ai_training_settings_unique_domain'
  ) THEN
    CREATE UNIQUE INDEX ai_training_settings_unique_domain
    ON public.ai_training_settings (scope, domain_id)
    WHERE scope = 'domain';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='ai_training_settings_unique_concept'
  ) THEN
    CREATE UNIQUE INDEX ai_training_settings_unique_concept
    ON public.ai_training_settings (scope, concept_id)
    WHERE scope = 'concept';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='ai_training_settings_domain_idx'
  ) THEN
    CREATE INDEX ai_training_settings_domain_idx ON public.ai_training_settings (domain_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='ai_training_settings_concept_idx'
  ) THEN
    CREATE INDEX ai_training_settings_concept_idx ON public.ai_training_settings (concept_id);
  END IF;
END $$;

-- 5) Seed a global defaults row (idempotent)
INSERT INTO public.ai_training_settings (
  scope, model_name, region, temperature, top_p, max_output_tokens, candidate_count,
  style_similarity_min, duplicate_similarity_max, apply_strict_filter, fallback_to_bootstrap, enabled
)
VALUES (
  'global', 'gemini-2.5-flash', 'europe-west4', 0.2, 0.95, 512, 5,
  0.80, 0.92, true, true, true
)
ON CONFLICT ON CONSTRAINT ai_training_settings_unique_global DO NOTHING;

-- 6) Add admin page entry + permissions
INSERT INTO public.pages (path, description)
VALUES ('/admin/ai-training', 'AI Training Settings')
ON CONFLICT (path) DO NOTHING;

INSERT INTO public.page_permissions (page_id, role, is_active)
SELECT p.id, 'admin', true
FROM public.pages p
WHERE p.path = '/admin/ai-training'
ON CONFLICT (page_id, role) DO UPDATE SET is_active = EXCLUDED.is_active;
