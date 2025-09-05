BEGIN;

-- 1) Enum for the 3 supported relationship kinds
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'relationship_kind'
  ) THEN
    CREATE TYPE relationship_kind AS ENUM ('prerequisite_of', 'builds_on', 'related_to');
  END IF;
END$$;

-- 2) Ensure the new column exists on concept_relationships
ALTER TABLE public.concept_relationships
  ADD COLUMN IF NOT EXISTS relationship_kind relationship_kind;

-- 3) Backfill relationship_kind from any legacy text column (relationship_type)
--    and set a default where missing
UPDATE public.concept_relationships
SET relationship_kind = CASE
  WHEN relationship_type = 'is_prerequisite_for' THEN 'prerequisite_of'::relationship_kind
  WHEN relationship_type = 'is_related_to'        THEN 'related_to'::relationship_kind
  WHEN relationship_type = 'contrasts_with'       THEN 'related_to'::relationship_kind
  WHEN relationship_type = 'is_a_practical_application_of' THEN 'related_to'::relationship_kind
  ELSE 'related_to'::relationship_kind
END
WHERE relationship_kind IS NULL;

-- 4) Make the column NOT NULL now that it is populated
ALTER TABLE public.concept_relationships
  ALTER COLUMN relationship_kind SET NOT NULL;

-- 5) Prevent self-relationships (A cannot relate to A)
-- Drop constraint if exists, then add it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ck_concept_rel_no_self'
  ) THEN
    ALTER TABLE public.concept_relationships DROP CONSTRAINT ck_concept_rel_no_self;
  END IF;
END$$;

ALTER TABLE public.concept_relationships
  ADD CONSTRAINT ck_concept_rel_no_self
  CHECK (concept_a_id <> concept_b_id);

-- 6) Uniqueness: one directional relationship per (domain, A, B, kind)
DROP INDEX IF EXISTS ux_concept_rel_domain_a_b_kind;
CREATE UNIQUE INDEX ux_concept_rel_domain_a_b_kind
  ON public.concept_relationships (domain_id, concept_a_id, concept_b_id, relationship_kind);

-- (Optional) If you have an old unique constraint, remove it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conname = 'concept_relationships_concept_a_id_concept_b_id_relationshi_key'
  ) THEN
    ALTER TABLE public.concept_relationships
      DROP CONSTRAINT concept_relationships_concept_a_id_concept_b_id_relationshi_key;
  END IF;
END$$;

-- 7) Helpful lookup indexes (safe to re-run)
CREATE INDEX IF NOT EXISTS idx_concept_rel_a ON public.concept_relationships (concept_a_id);
CREATE INDEX IF NOT EXISTS idx_concept_rel_b ON public.concept_relationships (concept_b_id);
CREATE INDEX IF NOT EXISTS idx_concept_rel_domain ON public.concept_relationships (domain_id);
CREATE INDEX IF NOT EXISTS idx_concept_rel_kind ON public.concept_relationships (relationship_kind);

COMMIT;