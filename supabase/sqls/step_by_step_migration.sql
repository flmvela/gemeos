-- ============================================================
-- STEP-BY-STEP CLASS CREATION MIGRATION
-- Run each step individually to identify any issues
-- ============================================================

-- STEP 1: Check current domains table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'domains' AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 2: Verify domains table has records
SELECT id, name FROM public.domains LIMIT 5;

-- STEP 3: Create difficulty_level_labels table (without foreign key first)
CREATE TABLE IF NOT EXISTS public.difficulty_level_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL,
    level_name VARCHAR(100) NOT NULL,
    level_order INTEGER NOT NULL,
    description TEXT,
    color_code VARCHAR(7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(domain_id, level_name),
    UNIQUE(domain_id, level_order)
);

-- STEP 4: Add foreign key constraint after table creation
ALTER TABLE public.difficulty_level_labels 
ADD CONSTRAINT fk_difficulty_level_labels_domain_id 
FOREIGN KEY (domain_id) REFERENCES public.domains(id) ON DELETE CASCADE;

-- STEP 5: Create indexes for difficulty_level_labels
CREATE INDEX IF NOT EXISTS idx_difficulty_level_labels_domain_id ON public.difficulty_level_labels(domain_id);
CREATE INDEX IF NOT EXISTS idx_difficulty_level_labels_level_order ON public.difficulty_level_labels(domain_id, level_order);

-- STEP 6: Create trigger for difficulty_level_labels (check if function exists first)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_difficulty_level_labels_updated_at 
        BEFORE UPDATE ON public.difficulty_level_labels
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ELSE
        RAISE NOTICE 'update_updated_at_column function does not exist, skipping trigger creation';
    END IF;
END $$;

-- STEP 7: Insert sample domains (ensure they exist)
INSERT INTO public.domains (name, description, icon_name, is_active)
VALUES 
    ('Mathematics', 'Mathematical concepts and problem solving', 'calculator', TRUE),
    ('Science', 'Natural sciences including physics, chemistry, and biology', 'flask', TRUE),
    ('Language Arts', 'Reading, writing, and communication skills', 'book', TRUE)
ON CONFLICT (name) DO NOTHING;

-- STEP 8: Verify domains were inserted
SELECT id, name FROM public.domains WHERE name IN ('Mathematics', 'Science', 'Language Arts');

-- STEP 9: Insert difficulty levels for Mathematics
INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
SELECT d.id, 'Beginner', 1, 'Basic arithmetic and number concepts', '#22c55e'
FROM public.domains d WHERE d.name = 'Mathematics'
ON CONFLICT (domain_id, level_name) DO NOTHING;

INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
SELECT d.id, 'Intermediate', 2, 'Algebra and geometry fundamentals', '#3b82f6'
FROM public.domains d WHERE d.name = 'Mathematics'
ON CONFLICT (domain_id, level_name) DO NOTHING;

INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
SELECT d.id, 'Advanced', 3, 'Calculus and advanced topics', '#ef4444'
FROM public.domains d WHERE d.name = 'Mathematics'
ON CONFLICT (domain_id, level_name) DO NOTHING;

INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
SELECT d.id, 'Expert', 4, 'University-level mathematics', '#8b5cf6'
FROM public.domains d WHERE d.name = 'Mathematics'
ON CONFLICT (domain_id, level_name) DO NOTHING;

-- STEP 10: Insert difficulty levels for Science
INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
SELECT d.id, 'Elementary', 1, 'Basic scientific concepts', '#22c55e'
FROM public.domains d WHERE d.name = 'Science'
ON CONFLICT (domain_id, level_name) DO NOTHING;

INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
SELECT d.id, 'Middle School', 2, 'Chemistry and physics basics', '#3b82f6'
FROM public.domains d WHERE d.name = 'Science'
ON CONFLICT (domain_id, level_name) DO NOTHING;

INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
SELECT d.id, 'High School', 3, 'Advanced chemistry and physics', '#ef4444'
FROM public.domains d WHERE d.name = 'Science'
ON CONFLICT (domain_id, level_name) DO NOTHING;

INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
SELECT d.id, 'College Prep', 4, 'AP-level science courses', '#8b5cf6'
FROM public.domains d WHERE d.name = 'Science'
ON CONFLICT (domain_id, level_name) DO NOTHING;

-- STEP 11: Insert difficulty levels for Language Arts
INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
SELECT d.id, 'Beginning Reader', 1, 'Phonics and basic reading', '#22c55e'
FROM public.domains d WHERE d.name = 'Language Arts'
ON CONFLICT (domain_id, level_name) DO NOTHING;

INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
SELECT d.id, 'Developing Reader', 2, 'Comprehension and vocabulary', '#3b82f6'
FROM public.domains d WHERE d.name = 'Language Arts'
ON CONFLICT (domain_id, level_name) DO NOTHING;

INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
SELECT d.id, 'Proficient Reader', 3, 'Literary analysis and writing', '#ef4444'
FROM public.domains d WHERE d.name = 'Language Arts'
ON CONFLICT (domain_id, level_name) DO NOTHING;

INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
SELECT d.id, 'Advanced Literacy', 4, 'Creative writing and rhetoric', '#8b5cf6'
FROM public.domains d WHERE d.name = 'Language Arts'
ON CONFLICT (domain_id, level_name) DO NOTHING;

-- STEP 12: Verify difficulty levels were inserted
SELECT dll.*, d.name as domain_name 
FROM public.difficulty_level_labels dll
JOIN public.domains d ON dll.domain_id = d.id
ORDER BY d.name, dll.level_order;

-- STEP 13: Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    
    -- Class details
    class_name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level_id UUID REFERENCES public.difficulty_level_labels(id) ON DELETE SET NULL,
    
    -- Schedule settings
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly')),
    allows_student_messages BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Status and metadata
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived', 'cancelled')),
    max_students INTEGER NOT NULL DEFAULT 30,
    current_student_count INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STEP 14: Create remaining tables (sessions, enrollments, invitations)
-- Continue with remaining tables...