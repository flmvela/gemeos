-- ============================================================
-- CLASS CONCEPTS SYSTEM MIGRATION
-- Purpose: Implement concept-to-class assignments with difficulty tracking
-- Date: 2025-01-11
-- ============================================================

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Concept-Class Assignment Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.class_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  
  -- Assignment metadata
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ordering and grouping
  sequence_order INTEGER NOT NULL DEFAULT 0,
  concept_group TEXT, -- Optional grouping within class (e.g., "Week 1", "Module A")
  
  -- Override difficulty for this specific class-concept pair
  override_difficulty INTEGER CHECK (override_difficulty BETWEEN 1 AND 10),
  
  -- Teaching metadata
  estimated_hours DECIMAL(4,2) DEFAULT 1.0,
  is_mandatory BOOLEAN DEFAULT true,
  is_prerequisite_for_next BOOLEAN DEFAULT false,
  
  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  completed_at TIMESTAMPTZ,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_class_concept UNIQUE (class_id, concept_id)
);

-- Class Difficulty Calculation Cache
CREATE TABLE IF NOT EXISTS public.class_difficulty_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  
  -- Calculated values
  min_difficulty INTEGER NOT NULL,
  max_difficulty INTEGER NOT NULL,
  avg_difficulty DECIMAL(3,2) NOT NULL,
  median_difficulty DECIMAL(3,2) NOT NULL,
  mode_difficulty INTEGER,
  weighted_avg_difficulty DECIMAL(3,2), -- Weighted by estimated_hours
  
  -- Distribution
  difficulty_distribution JSONB NOT NULL DEFAULT '{}', -- {"1": 5, "2": 10, ...}
  concept_count INTEGER NOT NULL DEFAULT 0,
  mandatory_concept_count INTEGER NOT NULL DEFAULT 0,
  
  -- Suggested level based on algorithm (75th percentile)
  suggested_difficulty_level INTEGER CHECK (suggested_difficulty_level BETWEEN 1 AND 10),
  suggested_level_confidence DECIMAL(3,2) CHECK (suggested_level_confidence BETWEEN 0 AND 1),
  
  -- Calculation metadata
  calculation_method TEXT NOT NULL DEFAULT 'percentile_75',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 hour'),
  
  CONSTRAINT unique_class_cache UNIQUE (class_id)
);

-- Concept Change History (Audit Trail)
CREATE TABLE IF NOT EXISTS public.concept_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  
  -- Changed fields snapshot
  name TEXT,
  description TEXT,
  difficulty_level INTEGER,
  metadata JSONB,
  
  -- Change metadata
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'restore')),
  change_reason TEXT,
  
  -- Version tracking
  version_from INTEGER,
  version_to INTEGER,
  
  -- Reference to related changes
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  batch_id UUID -- For bulk operations
);

-- Class-Concept Change History
CREATE TABLE IF NOT EXISTS public.class_concept_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_concept_id UUID NOT NULL,
  class_id UUID NOT NULL,
  concept_id UUID NOT NULL,
  
  -- Action performed
  action TEXT NOT NULL CHECK (action IN ('added', 'removed', 'reordered', 'updated')),
  
  -- Previous and new values for updates
  previous_values JSONB,
  new_values JSONB,
  
  -- Change metadata
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_reason TEXT
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Class-Concepts indexes
CREATE INDEX idx_class_concepts_class ON class_concepts(class_id, sequence_order);
CREATE INDEX idx_class_concepts_concept ON class_concepts(concept_id);
CREATE INDEX idx_class_concepts_status ON class_concepts(status) WHERE status = 'active';
CREATE INDEX idx_class_concepts_mandatory ON class_concepts(class_id, is_mandatory) WHERE is_mandatory = true;

-- Cache indexes
CREATE INDEX idx_class_difficulty_cache_expires ON class_difficulty_cache(expires_at);
CREATE INDEX idx_class_difficulty_cache_suggested ON class_difficulty_cache(suggested_difficulty_level);

-- History indexes
CREATE INDEX idx_concept_history_concept ON concept_history(concept_id, changed_at DESC);
CREATE INDEX idx_concept_history_batch ON concept_history(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_class_concept_history_class ON class_concept_history(class_id, changed_at DESC);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to calculate class difficulty from assigned concepts
CREATE OR REPLACE FUNCTION calculate_class_difficulty(p_class_id UUID)
RETURNS TABLE (
  min_difficulty INTEGER,
  max_difficulty INTEGER,
  avg_difficulty NUMERIC,
  median_difficulty NUMERIC,
  percentile_75 NUMERIC,
  concept_count INTEGER,
  suggested_level INTEGER,
  confidence NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_difficulties INTEGER[];
  v_count INTEGER;
  v_spread INTEGER;
  v_confidence NUMERIC;
BEGIN
  -- Get all active concept difficulties for the class
  SELECT array_agg(
    COALESCE(cc.override_difficulty, c.difficulty_level) ORDER BY COALESCE(cc.override_difficulty, c.difficulty_level)
  ) INTO v_difficulties
  FROM class_concepts cc
  JOIN concepts c ON cc.concept_id = c.id
  WHERE cc.class_id = p_class_id
    AND cc.status = 'active'
    AND c.difficulty_level IS NOT NULL;

  -- Handle empty or null array
  IF v_difficulties IS NULL OR array_length(v_difficulties, 1) = 0 THEN
    RETURN QUERY SELECT 
      NULL::INTEGER, NULL::INTEGER, NULL::NUMERIC, NULL::NUMERIC, 
      NULL::NUMERIC, 0::INTEGER, NULL::INTEGER, 0::NUMERIC;
    RETURN;
  END IF;

  v_count := array_length(v_difficulties, 1);

  -- Calculate spread for confidence
  v_spread := v_difficulties[v_count] - v_difficulties[1];
  
  -- Calculate confidence (decreases with spread)
  -- Perfect confidence (1.0) when all same level, decreases with spread
  v_confidence := GREATEST(0, 1 - (v_spread::NUMERIC / 10.0));

  RETURN QUERY
  SELECT
    v_difficulties[1] as min_difficulty,
    v_difficulties[v_count] as max_difficulty,
    (SELECT AVG(val::NUMERIC) FROM unnest(v_difficulties) val) as avg_difficulty,
    v_difficulties[GREATEST(1, v_count / 2)] as median_difficulty,
    v_difficulties[GREATEST(1, (v_count * 3) / 4)] as percentile_75,
    v_count as concept_count,
    v_difficulties[GREATEST(1, (v_count * 3) / 4)] as suggested_level, -- Using 75th percentile
    ROUND(v_confidence, 2) as confidence;
END;
$$;

-- Function to update class difficulty cache
CREATE OR REPLACE FUNCTION update_class_difficulty_cache(p_class_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_calc RECORD;
  v_distribution JSONB;
BEGIN
  -- Calculate difficulty stats
  SELECT * INTO v_calc FROM calculate_class_difficulty(p_class_id);
  
  -- If no concepts, delete cache entry
  IF v_calc.concept_count = 0 THEN
    DELETE FROM class_difficulty_cache WHERE class_id = p_class_id;
    RETURN;
  END IF;

  -- Calculate distribution
  SELECT jsonb_object_agg(
    difficulty::TEXT, 
    count
  ) INTO v_distribution
  FROM (
    SELECT 
      COALESCE(cc.override_difficulty, c.difficulty_level) as difficulty,
      COUNT(*) as count
    FROM class_concepts cc
    JOIN concepts c ON cc.concept_id = c.id
    WHERE cc.class_id = p_class_id
      AND cc.status = 'active'
      AND c.difficulty_level IS NOT NULL
    GROUP BY COALESCE(cc.override_difficulty, c.difficulty_level)
  ) dist;

  -- Upsert cache entry
  INSERT INTO class_difficulty_cache (
    class_id,
    min_difficulty,
    max_difficulty,
    avg_difficulty,
    median_difficulty,
    difficulty_distribution,
    concept_count,
    mandatory_concept_count,
    suggested_difficulty_level,
    suggested_level_confidence,
    calculated_at,
    expires_at
  ) VALUES (
    p_class_id,
    v_calc.min_difficulty,
    v_calc.max_difficulty,
    v_calc.avg_difficulty,
    v_calc.median_difficulty,
    COALESCE(v_distribution, '{}'::JSONB),
    v_calc.concept_count,
    (SELECT COUNT(*) FROM class_concepts WHERE class_id = p_class_id AND status = 'active' AND is_mandatory = true),
    v_calc.suggested_level,
    v_calc.confidence,
    now(),
    now() + INTERVAL '1 hour'
  )
  ON CONFLICT (class_id) DO UPDATE SET
    min_difficulty = EXCLUDED.min_difficulty,
    max_difficulty = EXCLUDED.max_difficulty,
    avg_difficulty = EXCLUDED.avg_difficulty,
    median_difficulty = EXCLUDED.median_difficulty,
    difficulty_distribution = EXCLUDED.difficulty_distribution,
    concept_count = EXCLUDED.concept_count,
    mandatory_concept_count = EXCLUDED.mandatory_concept_count,
    suggested_difficulty_level = EXCLUDED.suggested_difficulty_level,
    suggested_level_confidence = EXCLUDED.suggested_level_confidence,
    calculated_at = EXCLUDED.calculated_at,
    expires_at = EXCLUDED.expires_at;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_class_concepts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_class_concepts_updated_at
  BEFORE UPDATE ON class_concepts
  FOR EACH ROW
  EXECUTE FUNCTION update_class_concepts_updated_at();

-- Trigger to log concept changes
CREATE OR REPLACE FUNCTION log_concept_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Only log if difficulty changed
    IF OLD.difficulty_level IS DISTINCT FROM NEW.difficulty_level THEN
      INSERT INTO concept_history (
        concept_id,
        name,
        description,
        difficulty_level,
        changed_by,
        change_type,
        version_from,
        version_to
      ) VALUES (
        NEW.id,
        NEW.name,
        NEW.description,
        NEW.difficulty_level,
        auth.uid(),
        'update',
        OLD.version,
        NEW.version
      );
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO concept_history (
      concept_id,
      name,
      description,
      difficulty_level,
      changed_by,
      change_type,
      version_to
    ) VALUES (
      NEW.id,
      NEW.name,
      NEW.description,
      NEW.difficulty_level,
      auth.uid(),
      'create',
      NEW.version
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_concept_history
  AFTER INSERT OR UPDATE ON concepts
  FOR EACH ROW
  EXECUTE FUNCTION log_concept_change();

-- Trigger to log class-concept changes
CREATE OR REPLACE FUNCTION log_class_concept_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO class_concept_history (
      class_concept_id,
      class_id,
      concept_id,
      action,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.class_id,
      NEW.concept_id,
      'added',
      NEW.assigned_by
    );
    -- Update difficulty cache
    PERFORM update_class_difficulty_cache(NEW.class_id);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO class_concept_history (
      class_concept_id,
      class_id,
      concept_id,
      action,
      changed_by
    ) VALUES (
      OLD.id,
      OLD.class_id,
      OLD.concept_id,
      'removed',
      auth.uid()
    );
    -- Update difficulty cache
    PERFORM update_class_difficulty_cache(OLD.class_id);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log significant changes
    IF OLD.sequence_order != NEW.sequence_order OR
       OLD.override_difficulty IS DISTINCT FROM NEW.override_difficulty OR
       OLD.status != NEW.status THEN
      INSERT INTO class_concept_history (
        class_concept_id,
        class_id,
        concept_id,
        action,
        previous_values,
        new_values,
        changed_by
      ) VALUES (
        NEW.id,
        NEW.class_id,
        NEW.concept_id,
        'updated',
        jsonb_build_object(
          'sequence_order', OLD.sequence_order,
          'override_difficulty', OLD.override_difficulty,
          'status', OLD.status
        ),
        jsonb_build_object(
          'sequence_order', NEW.sequence_order,
          'override_difficulty', NEW.override_difficulty,
          'status', NEW.status
        ),
        auth.uid()
      );
      -- Update difficulty cache if relevant fields changed
      IF OLD.override_difficulty IS DISTINCT FROM NEW.override_difficulty OR
         OLD.status != NEW.status THEN
        PERFORM update_class_difficulty_cache(NEW.class_id);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_class_concept_history
  AFTER INSERT OR UPDATE OR DELETE ON class_concepts
  FOR EACH ROW
  EXECUTE FUNCTION log_class_concept_change();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE class_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_difficulty_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_concept_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_concepts
CREATE POLICY class_concepts_tenant_isolation ON class_concepts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      JOIN user_tenants ut ON c.tenant_id = ut.tenant_id
      WHERE c.id = class_concepts.class_id
        AND ut.user_id = auth.uid()
        AND ut.status = 'active'
    )
  );

-- RLS Policies for class_difficulty_cache (read-only for most users)
CREATE POLICY class_difficulty_cache_read ON class_difficulty_cache
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      JOIN user_tenants ut ON c.tenant_id = ut.tenant_id
      WHERE c.id = class_difficulty_cache.class_id
        AND ut.user_id = auth.uid()
        AND ut.status = 'active'
    )
  );

-- RLS Policies for concept_history (audit trail - read only)
CREATE POLICY concept_history_read ON concept_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM concepts c
      JOIN domains d ON c.domain_id = d.id
      JOIN user_tenants ut ON d.tenant_id = ut.tenant_id
      WHERE c.id = concept_history.concept_id
        AND ut.user_id = auth.uid()
        AND ut.status = 'active'
    )
  );

-- RLS Policies for class_concept_history (audit trail - read only)
CREATE POLICY class_concept_history_read ON class_concept_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      JOIN user_tenants ut ON c.tenant_id = ut.tenant_id
      WHERE c.id = class_concept_history.class_id
        AND ut.user_id = auth.uid()
        AND ut.status = 'active'
    )
  );

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================

-- Add some test difficulty distributions if concepts exist
DO $$
DECLARE
  v_class_id UUID;
  v_concept_ids UUID[];
BEGIN
  -- Only run if we have classes and concepts
  SELECT id INTO v_class_id FROM classes LIMIT 1;
  
  IF v_class_id IS NOT NULL THEN
    -- Get some concepts
    SELECT array_agg(id) INTO v_concept_ids 
    FROM concepts 
    WHERE difficulty_level IS NOT NULL
    LIMIT 5;
    
    IF v_concept_ids IS NOT NULL AND array_length(v_concept_ids, 1) > 0 THEN
      -- Assign concepts to the class with varying difficulties
      FOR i IN 1..array_length(v_concept_ids, 1) LOOP
        INSERT INTO class_concepts (
          class_id,
          concept_id,
          assigned_by,
          sequence_order,
          estimated_hours,
          is_mandatory
        ) VALUES (
          v_class_id,
          v_concept_ids[i],
          auth.uid(),
          i,
          1.5 + (i * 0.5), -- Varying hours
          i <= 3 -- First 3 are mandatory
        ) ON CONFLICT DO NOTHING;
      END LOOP;
      
      -- Calculate difficulty for this class
      PERFORM update_class_difficulty_cache(v_class_id);
    END IF;
  END IF;
END $$;

-- ============================================================
-- GRANTS
-- ============================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON class_concepts TO authenticated;
GRANT SELECT ON class_difficulty_cache TO authenticated;
GRANT SELECT ON concept_history TO authenticated;
GRANT SELECT ON class_concept_history TO authenticated;

-- Grant usage on functions
GRANT EXECUTE ON FUNCTION calculate_class_difficulty TO authenticated;
GRANT EXECUTE ON FUNCTION update_class_difficulty_cache TO authenticated;

COMMENT ON TABLE class_concepts IS 'Junction table linking concepts to classes with teaching metadata';
COMMENT ON TABLE class_difficulty_cache IS 'Cached difficulty calculations for classes to improve performance';
COMMENT ON TABLE concept_history IS 'Audit trail for concept changes';
COMMENT ON TABLE class_concept_history IS 'Audit trail for class-concept assignment changes';
COMMENT ON FUNCTION calculate_class_difficulty IS 'Calculates difficulty statistics for a class based on assigned concepts';
COMMENT ON FUNCTION update_class_difficulty_cache IS 'Updates the cached difficulty calculations for a class';