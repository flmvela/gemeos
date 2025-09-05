-- ============================================================
-- TEACHER CLASS CREATION SYSTEM - DATABASE SCHEMA
-- ============================================================
-- This migration creates tables for the teacher class creation system
-- including classes, sessions, enrollments, and invitations

-- ============================================================
-- 1. DIFFICULTY LEVEL LABELS TABLE (if not exists)
-- ============================================================
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

-- Create indexes for difficulty_level_labels
CREATE INDEX idx_difficulty_level_labels_domain_id ON public.difficulty_level_labels(domain_id);
CREATE INDEX idx_difficulty_level_labels_level_order ON public.difficulty_level_labels(domain_id, level_order);

CREATE TRIGGER update_difficulty_level_labels_updated_at BEFORE UPDATE ON public.difficulty_level_labels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. CLASSES TABLE
-- ============================================================
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

-- Create indexes for classes
CREATE INDEX idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX idx_classes_tenant_id ON public.classes(tenant_id);
CREATE INDEX idx_classes_domain_id ON public.classes(domain_id);
CREATE INDEX idx_classes_status ON public.classes(status);
CREATE INDEX idx_classes_teacher_tenant ON public.classes(teacher_id, tenant_id);

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. CLASS SESSIONS TABLE
-- ============================================================
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

-- Create indexes for class_sessions
CREATE INDEX idx_class_sessions_class_id ON public.class_sessions(class_id);
CREATE INDEX idx_class_sessions_session_date ON public.class_sessions(session_date);
CREATE INDEX idx_class_sessions_status ON public.class_sessions(status);
CREATE INDEX idx_class_sessions_teacher_schedule ON public.class_sessions(class_id, session_date, start_time);

CREATE TRIGGER update_class_sessions_updated_at BEFORE UPDATE ON public.class_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. CLASS ENROLLMENTS TABLE
-- ============================================================
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

-- Create indexes for class_enrollments
CREATE INDEX idx_class_enrollments_class_id ON public.class_enrollments(class_id);
CREATE INDEX idx_class_enrollments_student_id ON public.class_enrollments(student_id);
CREATE INDEX idx_class_enrollments_status ON public.class_enrollments(status);
CREATE INDEX idx_class_enrollments_class_status ON public.class_enrollments(class_id, status);

CREATE TRIGGER update_class_enrollments_updated_at BEFORE UPDATE ON public.class_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. CLASS INVITATIONS TABLE
-- ============================================================
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

-- Create indexes for class_invitations
CREATE INDEX idx_class_invitations_class_id ON public.class_invitations(class_id);
CREATE INDEX idx_class_invitations_email ON public.class_invitations(email);
CREATE INDEX idx_class_invitations_status ON public.class_invitations(status);
CREATE INDEX idx_class_invitations_expires_at ON public.class_invitations(expires_at);
CREATE INDEX idx_class_invitations_token ON public.class_invitations(invitation_token);

CREATE TRIGGER update_class_invitations_updated_at BEFORE UPDATE ON public.class_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. HELPER FUNCTIONS
-- ============================================================

-- Function to update class student count
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

-- Trigger to automatically update class student count
CREATE TRIGGER trigger_update_class_student_count
    AFTER INSERT OR UPDATE OR DELETE ON public.class_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.update_class_student_count();

-- Function to update session participant count
CREATE OR REPLACE FUNCTION public.update_session_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be extended later when we add session attendance tracking
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to check if teacher can create class in domain
CREATE OR REPLACE FUNCTION public.can_teacher_create_class_in_domain(
    p_teacher_id UUID,
    p_domain_id UUID,
    p_tenant_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if teacher has access to this domain in this tenant
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_tenants ut
        JOIN public.roles r ON ut.role_id = r.id
        JOIN public.tenant_domains td ON td.tenant_id = ut.tenant_id
        WHERE ut.user_id = p_teacher_id 
        AND ut.tenant_id = p_tenant_id
        AND td.domain_id = p_domain_id
        AND r.name IN ('teacher', 'tenant_admin')
        AND ut.status = 'active'
        AND td.is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. INSERT SAMPLE DIFFICULTY LEVELS
-- ============================================================
-- Get domain IDs for sample data and insert difficulty levels
DO $$
DECLARE
    math_domain_id UUID;
    science_domain_id UUID;
    language_domain_id UUID;
BEGIN
    -- Get domain IDs (create them if they don't exist)
    SELECT id INTO math_domain_id FROM public.domains WHERE name = 'Mathematics' LIMIT 1;
    SELECT id INTO science_domain_id FROM public.domains WHERE name = 'Science' LIMIT 1;
    SELECT id INTO language_domain_id FROM public.domains WHERE name = 'Language Arts' LIMIT 1;
    
    -- Create Mathematics domain if it doesn't exist
    IF math_domain_id IS NULL THEN
        INSERT INTO public.domains (name, description, icon_name, is_active)
        VALUES ('Mathematics', 'Mathematical concepts and problem solving', 'calculator', TRUE)
        RETURNING id INTO math_domain_id;
    END IF;
    
    -- Create Science domain if it doesn't exist
    IF science_domain_id IS NULL THEN
        INSERT INTO public.domains (name, description, icon_name, is_active)
        VALUES ('Science', 'Natural sciences including physics, chemistry, and biology', 'flask', TRUE)
        RETURNING id INTO science_domain_id;
    END IF;
    
    -- Create Language Arts domain if it doesn't exist
    IF language_domain_id IS NULL THEN
        INSERT INTO public.domains (name, description, icon_name, is_active)
        VALUES ('Language Arts', 'Reading, writing, and communication skills', 'book', TRUE)
        RETURNING id INTO language_domain_id;
    END IF;
    
    -- Insert difficulty levels for Mathematics
    IF math_domain_id IS NOT NULL THEN
        INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
        VALUES 
            (math_domain_id, 'Beginner', 1, 'Basic arithmetic and number concepts', '#22c55e'),
            (math_domain_id, 'Intermediate', 2, 'Algebra and geometry fundamentals', '#3b82f6'),
            (math_domain_id, 'Advanced', 3, 'Calculus and advanced topics', '#ef4444'),
            (math_domain_id, 'Expert', 4, 'University-level mathematics', '#8b5cf6')
        ON CONFLICT (domain_id, level_name) DO NOTHING;
    END IF;
    
    -- Insert difficulty levels for Science
    IF science_domain_id IS NOT NULL THEN
        INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
        VALUES 
            (science_domain_id, 'Elementary', 1, 'Basic scientific concepts', '#22c55e'),
            (science_domain_id, 'Middle School', 2, 'Chemistry and physics basics', '#3b82f6'),
            (science_domain_id, 'High School', 3, 'Advanced chemistry and physics', '#ef4444'),
            (science_domain_id, 'College Prep', 4, 'AP-level science courses', '#8b5cf6')
        ON CONFLICT (domain_id, level_name) DO NOTHING;
    END IF;
    
    -- Insert difficulty levels for Language Arts
    IF language_domain_id IS NOT NULL THEN
        INSERT INTO public.difficulty_level_labels (domain_id, level_name, level_order, description, color_code)
        VALUES 
            (language_domain_id, 'Beginning Reader', 1, 'Phonics and basic reading', '#22c55e'),
            (language_domain_id, 'Developing Reader', 2, 'Comprehension and vocabulary', '#3b82f6'),
            (language_domain_id, 'Proficient Reader', 3, 'Literary analysis and writing', '#ef4444'),
            (language_domain_id, 'Advanced Literacy', 4, 'Creative writing and rhetoric', '#8b5cf6')
        ON CONFLICT (domain_id, level_name) DO NOTHING;
    END IF;
END $$;

-- ============================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.difficulty_level_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for difficulty_level_labels
CREATE POLICY "Users can view difficulty levels for domains in their tenant" ON public.difficulty_level_labels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.tenant_domains td ON td.tenant_id = ut.tenant_id
            JOIN public.domains d ON d.id = td.domain_id
            WHERE ut.user_id = auth.uid()
            AND d.id = difficulty_level_labels.domain_id
            AND ut.status = 'active'
            AND td.is_active = TRUE
        )
    );

CREATE POLICY "Platform admins can manage difficulty levels" ON public.difficulty_level_labels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND r.name = 'platform_admin'
            AND ut.status = 'active'
        )
    );

-- RLS Policies for classes
CREATE POLICY "Teachers can view and manage their own classes" ON public.classes
    FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view classes they are enrolled in" ON public.classes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.class_enrollments ce
            WHERE ce.class_id = classes.id
            AND ce.student_id = auth.uid()
            AND ce.status IN ('active', 'invited')
        )
    );

CREATE POLICY "Tenant admins can view classes in their tenant" ON public.classes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_tenants ut
            JOIN public.roles r ON ut.role_id = r.id
            WHERE ut.user_id = auth.uid()
            AND ut.tenant_id = classes.tenant_id
            AND r.name = 'tenant_admin'
            AND ut.status = 'active'
        )
    );

-- RLS Policies for class_sessions
CREATE POLICY "Teachers can manage sessions for their classes" ON public.class_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = class_sessions.class_id
            AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can view sessions for classes they are enrolled in" ON public.class_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.class_enrollments ce
            WHERE ce.class_id = class_sessions.class_id
            AND ce.student_id = auth.uid()
            AND ce.status IN ('active', 'invited')
        )
    );

-- RLS Policies for class_enrollments
CREATE POLICY "Teachers can manage enrollments for their classes" ON public.class_enrollments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = class_enrollments.class_id
            AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can view their own enrollments" ON public.class_enrollments
    FOR SELECT USING (student_id = auth.uid());

-- RLS Policies for class_invitations
CREATE POLICY "Teachers can manage invitations for their classes" ON public.class_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = class_invitations.class_id
            AND c.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Users can view invitations sent to their email" ON public.class_invitations
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- ============================================================
-- 9. GRANT PERMISSIONS
-- ============================================================
GRANT ALL ON public.difficulty_level_labels TO authenticated;
GRANT ALL ON public.classes TO authenticated;
GRANT ALL ON public.class_sessions TO authenticated;
GRANT ALL ON public.class_enrollments TO authenticated;
GRANT ALL ON public.class_invitations TO authenticated;

-- Grant permissions for service role
GRANT ALL ON public.difficulty_level_labels TO service_role;
GRANT ALL ON public.classes TO service_role;
GRANT ALL ON public.class_sessions TO service_role;
GRANT ALL ON public.class_enrollments TO service_role;
GRANT ALL ON public.class_invitations TO service_role;