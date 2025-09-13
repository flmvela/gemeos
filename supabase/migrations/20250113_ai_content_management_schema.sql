-- ============================================================
-- AI CONTENT MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Purpose: Support AI-powered content generation, refinement, and review
-- Date: 2025-01-13
-- ============================================================

BEGIN;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- AI Processing Jobs (tracks all AI processing requests)
CREATE TABLE IF NOT EXISTS public.ai_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request metadata
  request_type TEXT NOT NULL CHECK (request_type IN ('concept', 'learning_goal', 'exercise', 'bulk')),
  source_type TEXT NOT NULL CHECK (source_type IN ('file_upload', 'manual_entry', 'api', 'concept_selection')),
  source_file_url TEXT,
  
  -- Processing configuration
  processing_options JSONB NOT NULL DEFAULT '{}',
  /* Examples:
     For concepts: {
       "refine_title": true, 
       "refine_description": true, 
       "complete_list": true,
       "generate_relationships": true,
       "assign_difficulty": true
     }
     For learning goals: {
       "refine_title": true,
       "refine_description": true,
       "generate_bloom_level": true,
       "create_sequence": true,
       "from_concepts": ["concept_id1", "concept_id2"]
     }
  */
  
  -- Ownership and context
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  tenant_id UUID REFERENCES public.tenants(id),
  domain_id UUID REFERENCES public.domains(id),
  
  -- For learning goals generated from concepts
  source_concept_ids UUID[] DEFAULT '{}',
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  
  -- Processing details
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  error_details JSONB,
  
  -- AI provider details
  ai_provider TEXT CHECK (ai_provider IN ('openai', 'anthropic', 'gemini', 'mixed')),
  ai_model TEXT,
  tokens_used INTEGER,
  estimated_cost DECIMAL(10,4),
  
  -- Metadata
  total_items_count INTEGER DEFAULT 0,
  processed_items_count INTEGER DEFAULT 0,
  approved_items_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Suggestions (stores all AI-generated content)
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.ai_processing_jobs(id) ON DELETE CASCADE,
  
  -- Content type and reference
  content_type TEXT NOT NULL CHECK (content_type IN ('concept', 'learning_goal', 'exercise')),
  source_content_id UUID, -- Reference to original content if this is an enhancement
  
  -- Suggestion details
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
    'new', 'refinement', 'enrichment', 'relationship', 'completion', 'sequence'
  )),
  
  -- The actual suggested content
  suggested_content JSONB NOT NULL,
  /* Structure examples:
     For concepts: {
       "name": "String Theory Fundamentals",
       "description": "...",
       "difficulty_level": 7,
       "parent_concept_id": "uuid",
       "keywords": ["quantum", "physics"],
       "learning_outcomes": ["..."],
       "estimated_hours": 12
     }
     For learning goals: {
       "title": "Analyze quantum entanglement",
       "description": "...",
       "bloom_level": "analyze",
       "bloom_verbs": ["analyze", "compare", "contrast"],
       "concept_id": "uuid",
       "prerequisites": ["goal_id1", "goal_id2"],
       "learning_outcomes": ["..."],
       "assessment_methods": ["..."],
       "estimated_minutes": 45
     }
  */
  
  -- Original content for comparison (if refinement/enrichment)
  original_content JSONB,
  
  -- AI confidence and reasoning
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  confidence_breakdown JSONB, -- Detailed confidence by aspect
  ai_reasoning TEXT,
  ai_metadata JSONB, -- Additional AI processing details
  
  -- Review status
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'rejected', 'modified', 'needs_refinement')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  refinement_requested_at TIMESTAMPTZ,
  refinement_feedback TEXT,
  
  -- If modified, store the final version
  final_content JSONB,
  
  -- Version tracking
  version INTEGER DEFAULT 1,
  parent_suggestion_id UUID REFERENCES public.ai_suggestions(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Review Queue (optimized view for review dashboard)
CREATE TABLE IF NOT EXISTS public.ai_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES public.ai_suggestions(id) ON DELETE CASCADE,
  
  -- Denormalized fields for performance
  content_type TEXT NOT NULL,
  domain_id UUID REFERENCES public.domains(id),
  domain_name TEXT,
  tenant_id UUID REFERENCES public.tenants(id),
  
  -- Priority and grouping
  priority INTEGER DEFAULT 5,
  batch_id UUID, -- For grouping related suggestions
  sequence_order INTEGER, -- For ordered review
  
  -- Quick access fields
  preview_title TEXT,
  preview_description TEXT,
  change_summary TEXT,
  suggestion_type TEXT,
  
  -- Metrics for display
  relationship_count INTEGER DEFAULT 0,
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  
  -- Statistics
  similar_suggestions_count INTEGER DEFAULT 0,
  related_items_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Concept Relationships (AI-suggested relationships)
CREATE TABLE IF NOT EXISTS public.ai_concept_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES public.ai_suggestions(id) ON DELETE CASCADE,
  
  source_concept_id UUID NOT NULL,
  target_concept_id UUID NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'prerequisite_of', 'built_upon', 'related_to', 'part_of', 'example_of'
  )),
  
  -- Relationship strength and confidence
  strength DECIMAL(3,2) CHECK (strength BETWEEN 0 AND 1),
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  ai_reasoning TEXT,
  
  -- Review status
  status TEXT NOT NULL DEFAULT 'suggested'
    CHECK (status IN ('suggested', 'approved', 'rejected', 'modified')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Learning Goal Relationships (sequencing and dependencies)
CREATE TABLE IF NOT EXISTS public.ai_learning_goal_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES public.ai_suggestions(id) ON DELETE CASCADE,
  
  source_goal_id UUID NOT NULL,
  target_goal_id UUID NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'prerequisite_of', 'built_upon', 'parallel_with', 'extends', 'reinforces'
  )),
  
  -- Sequencing information
  sequence_order INTEGER,
  is_optional BOOLEAN DEFAULT false,
  
  -- Relationship metadata
  strength DECIMAL(3,2) CHECK (strength BETWEEN 0 AND 1),
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  ai_reasoning TEXT,
  
  -- Review status
  status TEXT NOT NULL DEFAULT 'suggested'
    CHECK (status IN ('suggested', 'approved', 'rejected', 'modified')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bloom's Taxonomy Reference
CREATE TABLE IF NOT EXISTS public.bloom_taxonomy_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_number INTEGER NOT NULL CHECK (level_number BETWEEN 1 AND 6),
  level_name TEXT NOT NULL CHECK (level_name IN (
    'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'
  )),
  description TEXT,
  example_verbs TEXT[], -- Array of action verbs
  color_code VARCHAR(7), -- Hex color for UI
  
  UNIQUE(level_number),
  UNIQUE(level_name)
);

-- Learning Goal Bloom's Classification
CREATE TABLE IF NOT EXISTS public.ai_learning_goal_bloom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id UUID NOT NULL REFERENCES public.ai_suggestions(id) ON DELETE CASCADE,
  learning_goal_id UUID, -- References actual learning goal once approved
  
  bloom_level TEXT NOT NULL CHECK (bloom_level IN (
    'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'
  )),
  bloom_level_number INTEGER CHECK (bloom_level_number BETWEEN 1 AND 6),
  
  -- Verb analysis
  identified_verbs TEXT[],
  primary_verb TEXT,
  
  -- Cognitive complexity
  cognitive_complexity INTEGER CHECK (cognitive_complexity BETWEEN 1 AND 10),
  
  -- AI analysis
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  ai_reasoning TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Processing Metrics (for monitoring and optimization)
CREATE TABLE IF NOT EXISTS public.ai_processing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Time window
  metric_date DATE NOT NULL,
  metric_hour INTEGER CHECK (metric_hour BETWEEN 0 AND 23),
  
  -- Aggregated metrics
  total_jobs INTEGER DEFAULT 0,
  successful_jobs INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,
  cancelled_jobs INTEGER DEFAULT 0,
  
  -- Performance metrics
  avg_processing_time_ms INTEGER,
  median_processing_time_ms INTEGER,
  p95_processing_time_ms INTEGER,
  total_tokens_used INTEGER,
  total_cost DECIMAL(10,4),
  
  -- By content type
  concept_jobs INTEGER DEFAULT 0,
  learning_goal_jobs INTEGER DEFAULT 0,
  exercise_jobs INTEGER DEFAULT 0,
  
  -- By user role
  platform_admin_jobs INTEGER DEFAULT 0,
  tenant_admin_jobs INTEGER DEFAULT 0,
  teacher_jobs INTEGER DEFAULT 0,
  
  -- Success rates
  approval_rate DECIMAL(5,2),
  refinement_rate DECIMAL(5,2),
  rejection_rate DECIMAL(5,2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(metric_date, metric_hour)
);

-- Batch Processing Groups
CREATE TABLE IF NOT EXISTS public.ai_batch_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Batch configuration
  job_ids UUID[], -- Array of related job IDs
  content_type TEXT NOT NULL,
  processing_template JSONB, -- Shared processing options
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled')),
  
  -- Statistics
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  approved_items INTEGER DEFAULT 0,
  
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Processing jobs indexes
CREATE INDEX idx_ai_jobs_status ON public.ai_processing_jobs(status);
CREATE INDEX idx_ai_jobs_requested_by ON public.ai_processing_jobs(requested_by);
CREATE INDEX idx_ai_jobs_tenant ON public.ai_processing_jobs(tenant_id);
CREATE INDEX idx_ai_jobs_domain ON public.ai_processing_jobs(domain_id);
CREATE INDEX idx_ai_jobs_created ON public.ai_processing_jobs(created_at DESC);

-- Suggestions indexes
CREATE INDEX idx_ai_suggestions_job ON public.ai_suggestions(job_id);
CREATE INDEX idx_ai_suggestions_status ON public.ai_suggestions(review_status);
CREATE INDEX idx_ai_suggestions_content_type ON public.ai_suggestions(content_type);
CREATE INDEX idx_ai_suggestions_reviewer ON public.ai_suggestions(reviewed_by);
CREATE INDEX idx_ai_suggestions_created ON public.ai_suggestions(created_at DESC);

-- Review queue indexes
CREATE INDEX idx_ai_review_queue_suggestion ON public.ai_review_queue(suggestion_id);
CREATE INDEX idx_ai_review_queue_domain ON public.ai_review_queue(domain_id);
CREATE INDEX idx_ai_review_queue_tenant ON public.ai_review_queue(tenant_id);
CREATE INDEX idx_ai_review_queue_assigned ON public.ai_review_queue(assigned_to);
CREATE INDEX idx_ai_review_queue_priority ON public.ai_review_queue(priority DESC, created_at);

-- Relationship indexes
CREATE INDEX idx_ai_concept_rel_suggestion ON public.ai_concept_relationships(suggestion_id);
CREATE INDEX idx_ai_concept_rel_source ON public.ai_concept_relationships(source_concept_id);
CREATE INDEX idx_ai_concept_rel_target ON public.ai_concept_relationships(target_concept_id);

CREATE INDEX idx_ai_goal_rel_suggestion ON public.ai_learning_goal_relationships(suggestion_id);
CREATE INDEX idx_ai_goal_rel_source ON public.ai_learning_goal_relationships(source_goal_id);
CREATE INDEX idx_ai_goal_rel_target ON public.ai_learning_goal_relationships(target_goal_id);

-- Metrics indexes
CREATE INDEX idx_ai_metrics_date ON public.ai_processing_metrics(metric_date DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.ai_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_concept_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_goal_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning_goal_bloom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_processing_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_batch_groups ENABLE ROW LEVEL SECURITY;

-- Processing jobs policies
CREATE POLICY "Users can view their own jobs"
  ON public.ai_processing_jobs FOR SELECT
  USING (requested_by = auth.uid());

CREATE POLICY "Tenant admins can view tenant jobs"
  ON public.ai_processing_jobs FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create jobs"
  ON public.ai_processing_jobs FOR INSERT
  WITH CHECK (requested_by = auth.uid());

-- Suggestions policies
CREATE POLICY "Users can view suggestions for their content"
  ON public.ai_suggestions FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM public.ai_processing_jobs
      WHERE requested_by = auth.uid()
    )
  );

CREATE POLICY "Reviewers can update suggestions"
  ON public.ai_suggestions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_tenants ut
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE ut.user_id = auth.uid()
        AND ur.name IN ('platform_admin', 'tenant_admin', 'domain_admin', 'teacher')
        AND ut.status = 'active'
    )
  );

-- Review queue policies
CREATE POLICY "Users can view assigned review items"
  ON public.ai_review_queue FOR SELECT
  USING (
    assigned_to = auth.uid() OR
    assigned_to IS NULL
  );

-- ============================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_ai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_ai_jobs_updated_at
  BEFORE UPDATE ON public.ai_processing_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_ai_updated_at();

CREATE TRIGGER update_ai_suggestions_updated_at
  BEFORE UPDATE ON public.ai_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_ai_updated_at();

-- Function to populate review queue when suggestions are created
CREATE OR REPLACE FUNCTION public.populate_review_queue()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ai_review_queue (
    suggestion_id,
    content_type,
    domain_id,
    tenant_id,
    priority,
    preview_title,
    preview_description,
    suggestion_type
  )
  SELECT
    NEW.id,
    NEW.content_type,
    j.domain_id,
    j.tenant_id,
    j.priority,
    COALESCE(
      NEW.suggested_content->>'name',
      NEW.suggested_content->>'title',
      'Untitled'
    ),
    LEFT(COALESCE(NEW.suggested_content->>'description', ''), 200),
    NEW.suggestion_type
  FROM public.ai_processing_jobs j
  WHERE j.id = NEW.job_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER populate_review_queue_trigger
  AFTER INSERT ON public.ai_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.populate_review_queue();

-- Function to update metrics
CREATE OR REPLACE FUNCTION public.update_ai_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert metrics for the current hour
  INSERT INTO public.ai_processing_metrics (
    metric_date,
    metric_hour,
    total_jobs,
    successful_jobs,
    failed_jobs
  )
  VALUES (
    CURRENT_DATE,
    EXTRACT(HOUR FROM CURRENT_TIMESTAMP),
    1,
    CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END
  )
  ON CONFLICT (metric_date, metric_hour)
  DO UPDATE SET
    total_jobs = ai_processing_metrics.total_jobs + 1,
    successful_jobs = ai_processing_metrics.successful_jobs + 
      CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
    failed_jobs = ai_processing_metrics.failed_jobs + 
      CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_metrics_trigger
  AFTER UPDATE OF status ON public.ai_processing_jobs
  FOR EACH ROW 
  WHEN (NEW.status IN ('completed', 'failed'))
  EXECUTE FUNCTION public.update_ai_metrics();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Populate Bloom's Taxonomy levels
INSERT INTO public.bloom_taxonomy_levels (level_number, level_name, description, example_verbs, color_code)
VALUES
  (1, 'remember', 'Recall facts and basic concepts', 
   ARRAY['define', 'duplicate', 'list', 'memorize', 'repeat', 'state', 'identify', 'label', 'name'], 
   '#3B82F6'),
  (2, 'understand', 'Explain ideas or concepts', 
   ARRAY['classify', 'describe', 'discuss', 'explain', 'identify', 'locate', 'recognize', 'report'], 
   '#06B6D4'),
  (3, 'apply', 'Use information in new situations', 
   ARRAY['execute', 'implement', 'solve', 'use', 'demonstrate', 'interpret', 'operate', 'schedule'], 
   '#10B981'),
  (4, 'analyze', 'Draw connections among ideas', 
   ARRAY['differentiate', 'organize', 'relate', 'compare', 'contrast', 'distinguish', 'examine', 'test'], 
   '#F59E0B'),
  (5, 'evaluate', 'Justify a stand or decision', 
   ARRAY['appraise', 'argue', 'defend', 'judge', 'select', 'support', 'value', 'critique', 'weigh'], 
   '#F97316'),
  (6, 'create', 'Produce new or original work', 
   ARRAY['design', 'assemble', 'construct', 'develop', 'formulate', 'investigate', 'author', 'compose'], 
   '#EF4444')
ON CONFLICT (level_number) DO NOTHING;

-- ============================================================
-- VIEWS FOR EASIER QUERYING
-- ============================================================

-- View for pending reviews with full context
CREATE OR REPLACE VIEW public.ai_pending_reviews AS
SELECT 
  rq.*,
  s.suggested_content,
  s.original_content,
  s.confidence_score,
  s.ai_reasoning,
  j.requested_by,
  j.processing_options,
  u.email as requester_email
FROM public.ai_review_queue rq
JOIN public.ai_suggestions s ON rq.suggestion_id = s.id
JOIN public.ai_processing_jobs j ON s.job_id = j.id
LEFT JOIN auth.users u ON j.requested_by = u.id
WHERE s.review_status = 'pending'
ORDER BY rq.priority DESC, rq.created_at;

-- View for metrics dashboard
CREATE OR REPLACE VIEW public.ai_metrics_summary AS
SELECT
  COUNT(DISTINCT j.id) as total_jobs,
  COUNT(DISTINCT CASE WHEN j.status = 'completed' THEN j.id END) as completed_jobs,
  COUNT(DISTINCT CASE WHEN j.status = 'failed' THEN j.id END) as failed_jobs,
  COUNT(DISTINCT s.id) as total_suggestions,
  COUNT(DISTINCT CASE WHEN s.review_status = 'approved' THEN s.id END) as approved_suggestions,
  COUNT(DISTINCT CASE WHEN s.review_status = 'rejected' THEN s.id END) as rejected_suggestions,
  AVG(s.confidence_score) as avg_confidence,
  AVG(j.processing_time_ms) as avg_processing_time_ms
FROM public.ai_processing_jobs j
LEFT JOIN public.ai_suggestions s ON j.id = s.job_id
WHERE j.created_at >= CURRENT_DATE - INTERVAL '30 days';

COMMIT;

-- ============================================================
-- NOTES FOR IMPLEMENTATION
-- ============================================================
-- 1. This schema supports both concept and learning goal AI processing
-- 2. Relationships between content types are tracked separately
-- 3. Bloom's taxonomy is integrated for learning goals
-- 4. Review workflow supports multiple actions (approve, reject, refine)
-- 5. Metrics are automatically tracked for monitoring
-- 6. RLS policies ensure proper data isolation
-- 7. The schema is extensible for future content types (exercises)
-- ============================================================