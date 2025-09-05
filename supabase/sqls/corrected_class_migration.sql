-- ============================================================
-- CORRECTED CLASS CREATION MIGRATION
-- Based on actual domains table structure
-- ============================================================

-- Step 1: Create difficulty_level_labels table (works with your domains structure)
CREATE TABLE IF NOT EXISTS public.difficulty_level_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    level_name VARCHAR(100) NOT NULL,
    level_order INTEGER NOT NULL,
    description TEXT,
    color_code VARCHAR(7), -- Hex color code
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(domain_id, level_name),
    UNIQUE(domain_id, level_order)
);

-- Step 2: Create indexes for difficulty_level_labels
CREATE INDEX IF NOT EXISTS idx_difficulty_level_labels_domain_id ON public.difficulty_level_labels(domain_id);
CREATE INDEX IF NOT EXISTS idx_difficulty_level_labels_level_order ON public.difficulty_level_labels(domain_id, level_order);

-- Step 3: Create trigger for difficulty_level_labels
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_difficulty_level_labels_updated_at 
        BEFORE UPDATE ON public.difficulty_level_labels
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Step 4: Create classes table
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

-- Step 5: Create indexes for classes
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_tenant_id ON public.classes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_classes_domain_id ON public.classes(domain_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON public.classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_tenant ON public.classes(teacher_id, tenant_id);

-- Step 6: Create trigger for classes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_classes_updated_at 
        BEFORE UPDATE ON public.classes
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Step 7: Create class_sessions table
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    
    -- Session details
    session_name VARCHAR(255),
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    time_zone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    
    -- Session metadata
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    max_participants INTEGER,
    current_participant_count INTEGER NOT NULL DEFAULT 0,
    
    -- Optional fields
    meeting_url TEXT,
    meeting_password VARCHAR(100),
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure end_time is after start_time
    CONSTRAINT chk_session_time_order CHECK (end_time > start_time)
);

-- Step 8: Create indexes for class_sessions
CREATE INDEX IF NOT EXISTS idx_class_sessions_class_id ON public.class_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_session_date ON public.class_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_status ON public.class_sessions(status);
CREATE INDEX IF NOT EXISTS idx_class_sessions_teacher_schedule ON public.class_sessions(class_id, session_date, start_time);

-- Step 9: Create trigger for class_sessions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_class_sessions_updated_at 
        BEFORE UPDATE ON public.class_sessions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Step 10: Create class_enrollments table
CREATE TABLE IF NOT EXISTS public.class_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Enrollment details
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended', 'withdrawn', 'completed')),
    enrollment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Student information (cached for performance)
    student_first_name VARCHAR(100) NOT NULL,
    student_last_name VARCHAR(100) NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    
    -- Enrollment metadata
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invitation_accepted_at TIMESTAMPTZ,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate enrollments
    UNIQUE(class_id, student_id)
);

-- Step 11: Create indexes for class_enrollments
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON public.class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON public.class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_status ON public.class_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_status ON public.class_enrollments(class_id, status);

-- Step 12: Create trigger for class_enrollments
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_class_enrollments_updated_at 
        BEFORE UPDATE ON public.class_enrollments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Step 13: Create class_invitations table
CREATE TABLE IF NOT EXISTS public.class_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    
    -- Invitation details
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    custom_message TEXT,
    
    -- Invitation status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'declined', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Invitation metadata
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitation_token VARCHAR(255) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    sent_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate invitations
    UNIQUE(class_id, email)
);

-- Step 14: Create indexes for class_invitations
CREATE INDEX IF NOT EXISTS idx_class_invitations_class_id ON public.class_invitations(class_id);
CREATE INDEX IF NOT EXISTS idx_class_invitations_email ON public.class_invitations(email);
CREATE INDEX IF NOT EXISTS idx_class_invitations_status ON public.class_invitations(status);
CREATE INDEX IF NOT EXISTS idx_class_invitations_expires_at ON public.class_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_class_invitations_token ON public.class_invitations(invitation_token);

-- Step 15: Create trigger for class_invitations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_class_invitations_updated_at 
        BEFORE UPDATE ON public.class_invitations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Step 16: Create helper functions
CREATE OR REPLACE FUNCTION public.update_class_student_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.classes 
        SET current_student_count = (
            SELECT COUNT(*) 
            FROM public.class_enrollments 
            WHERE class_id = NEW.class_id 
            AND status IN ('active', 'invited')
        )
        WHERE id = NEW.class_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.classes 
        SET current_student_count = (
            SELECT COUNT(*) 
            FROM public.class_enrollments 
            WHERE class_id = OLD.class_id 
            AND status IN ('active', 'invited')
        )
        WHERE id = OLD.class_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 17: Create trigger to automatically update class student count
CREATE TRIGGER trigger_update_class_student_count
    AFTER INSERT OR UPDATE OR DELETE ON public.class_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.update_class_student_count();

-- Step 18: Create sample difficulty levels
-- First, insert some sample difficulty levels using existing domains
-- You'll need to run this after you have some domains in your system

-- Check if you have any domains and create sample difficulty levels
DO $$
DECLARE
    domain_record RECORD;
BEGIN
    -- For each active domain, create basic difficulty levels
    FOR domain_record IN 
        SELECT id, name FROM public.domains WHERE status = 'active' LIMIT 3
    LOOP
        -- Insert basic difficulty levels for each domain
        INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
        VALUES 
            (domain_record.id, 'Beginner', 1, 'Basic level', '#22c55e'),
            (domain_record.id, 'Intermediate', 2, 'Intermediate level', '#3b82f6'),
            (domain_record.id, 'Advanced', 3, 'Advanced level', '#ef4444'),
            (domain_record.id, 'Expert', 4, 'Expert level', '#8b5cf6')
        ON CONFLICT (domain_id, level_name) DO NOTHING;
    END LOOP;
END $$;

-- Step 19: Enable RLS on all new tables
ALTER TABLE public.difficulty_level_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_invitations ENABLE ROW LEVEL SECURITY;

-- Step 20: Grant permissions
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

-- Step 21: Verify the migration worked
SELECT 'Migration completed successfully. Tables created:' as message;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('difficulty_level_labels', 'classes', 'class_sessions', 'class_enrollments', 'class_invitations');