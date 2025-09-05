-- ============================================================
-- MINIMAL WORKING CLASS CREATION MIGRATION
-- This creates the essential tables without optional features
-- ============================================================

-- Drop the table if it exists and recreate it properly
DROP TABLE IF EXISTS public.difficulty_level_labels CASCADE;

-- Create difficulty_level_labels table with explicit schema
CREATE TABLE public.difficulty_level_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL,
    level_name VARCHAR(100) NOT NULL,
    level_order INTEGER NOT NULL,
    description TEXT,
    color_code VARCHAR(7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add the foreign key constraint separately
ALTER TABLE public.difficulty_level_labels 
ADD CONSTRAINT fk_difficulty_level_labels_domain 
FOREIGN KEY (domain_id) REFERENCES public.domains(id) ON DELETE CASCADE;

-- Add unique constraints separately
ALTER TABLE public.difficulty_level_labels 
ADD CONSTRAINT uk_difficulty_level_domain_name UNIQUE (domain_id, level_name);

ALTER TABLE public.difficulty_level_labels 
ADD CONSTRAINT uk_difficulty_level_domain_order UNIQUE (domain_id, level_order);

-- Create indexes separately
CREATE INDEX idx_difficulty_level_labels_domain_id 
ON public.difficulty_level_labels(domain_id);

CREATE INDEX idx_difficulty_level_labels_level_order 
ON public.difficulty_level_labels(domain_id, level_order);

-- Verify the table structure
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'difficulty_level_labels' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Create the classes table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    class_name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level_id UUID REFERENCES public.difficulty_level_labels(id) ON DELETE SET NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly')),
    allows_student_messages BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived', 'cancelled')),
    max_students INTEGER NOT NULL DEFAULT 30,
    current_student_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create remaining tables
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    session_name VARCHAR(255),
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    time_zone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.class_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    student_first_name VARCHAR(100) NOT NULL,
    student_last_name VARCHAR(100) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.class_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    custom_message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitation_token VARCHAR(255) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(class_id, email)
);

-- Grant permissions
GRANT ALL ON public.difficulty_level_labels TO authenticated;
GRANT ALL ON public.classes TO authenticated;
GRANT ALL ON public.class_sessions TO authenticated;
GRANT ALL ON public.class_enrollments TO authenticated;
GRANT ALL ON public.class_invitations TO authenticated;

GRANT ALL ON public.difficulty_level_labels TO service_role;
GRANT ALL ON public.classes TO service_role;
GRANT ALL ON public.class_sessions TO service_role;
GRANT ALL ON public.class_enrollments TO service_role;
GRANT ALL ON public.class_invitations TO service_role;

-- Insert sample difficulty levels for existing domains
INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
SELECT d.id, 'Beginner', 1, 'Basic level', '#22c55e'
FROM public.domains d 
WHERE d.status = 'active'
ON CONFLICT (domain_id, level_name) DO NOTHING;

INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
SELECT d.id, 'Intermediate', 2, 'Intermediate level', '#3b82f6'
FROM public.domains d 
WHERE d.status = 'active'
ON CONFLICT (domain_id, level_name) DO NOTHING;

INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
SELECT d.id, 'Advanced', 3, 'Advanced level', '#ef4444'
FROM public.domains d 
WHERE d.status = 'active'
ON CONFLICT (domain_id, level_name) DO NOTHING;

-- Verify everything was created
SELECT 'Migration completed!' AS status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('difficulty_level_labels', 'classes', 'class_sessions', 'class_enrollments', 'class_invitations');