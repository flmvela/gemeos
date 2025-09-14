-- Safe migration that handles existing tables
BEGIN;

-- Create students table first (referenced by other tables)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Student information
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(email, tenant_id)
);

-- Drop and recreate classes table with all needed columns
DROP TABLE IF EXISTS public.classes CASCADE;

CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE RESTRICT,
  
  -- Basic information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Capacity settings
  max_students INTEGER NOT NULL DEFAULT 30,
  min_students INTEGER,
  
  -- Enrollment settings
  enrollment_type VARCHAR(50) DEFAULT 'invite-only' CHECK (enrollment_type IN ('invite-only', 'open', 'both')),
  enrollment_code VARCHAR(20),
  
  -- Settings
  allows_student_messages BOOLEAN DEFAULT false,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived', 'completed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(enrollment_code),
  CONSTRAINT valid_student_limits CHECK (min_students IS NULL OR min_students <= max_students)
);

-- Create class_sessions table
DROP TABLE IF EXISTS public.class_sessions CASCADE;

CREATE TABLE public.class_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  
  -- Schedule information
  session_date DATE,
  day_of_week VARCHAR(20),
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  
  -- Location
  location_type VARCHAR(50) DEFAULT 'online' CHECK (location_type IN ('online', 'in-person', 'hybrid')),
  location_address TEXT,
  meeting_link TEXT,
  
  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50),
  recurrence_end_type VARCHAR(50),
  recurrence_end_date DATE,
  recurrence_occurrences INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'scheduled',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create class_student_invitations table
DROP TABLE IF EXISTS public.class_student_invitations CASCADE;

CREATE TABLE public.class_student_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  
  -- Student information
  student_email VARCHAR(255) NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  
  -- Invitation details
  invitation_status VARCHAR(50) DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'sent', 'accepted', 'declined', 'expired')),
  invitation_token UUID DEFAULT gen_random_uuid(),
  custom_message TEXT,
  
  -- Timestamps
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Unique constraint
  UNIQUE(class_id, student_email)
);

-- Create class_difficulty_levels table (junction table)
DROP TABLE IF EXISTS public.class_difficulty_levels CASCADE;

CREATE TABLE public.class_difficulty_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  difficulty_level_id UUID NOT NULL REFERENCES public.domain_difficulty_levels(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(class_id, difficulty_level_id)
);

-- Create class_student_enrollments table (for tracking actual enrollments)
DROP TABLE IF EXISTS public.class_student_enrollments CASCADE;

CREATE TABLE public.class_student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  
  -- Enrollment details
  enrollment_date TIMESTAMPTZ DEFAULT NOW(),
  enrollment_status VARCHAR(50) DEFAULT 'active',
  
  -- Progress tracking
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(class_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX idx_classes_tenant ON public.classes(tenant_id);
CREATE INDEX idx_classes_teacher ON public.classes(teacher_id);
CREATE INDEX idx_classes_domain ON public.classes(domain_id);
CREATE INDEX idx_classes_status ON public.classes(status);
CREATE INDEX idx_classes_enrollment_code ON public.classes(enrollment_code);

CREATE INDEX idx_class_sessions_class ON public.class_sessions(class_id);
CREATE INDEX idx_class_sessions_date ON public.class_sessions(session_date);

CREATE INDEX idx_class_invitations_class ON public.class_student_invitations(class_id);
CREATE INDEX idx_class_invitations_email ON public.class_student_invitations(student_email);
CREATE INDEX idx_class_invitations_status ON public.class_student_invitations(invitation_status);

CREATE INDEX idx_class_difficulty_class ON public.class_difficulty_levels(class_id);

-- Add RLS policies
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_student_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_difficulty_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_student_enrollments ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can view and manage their own classes
CREATE POLICY "Teachers can manage their own classes" ON public.classes
  FOR ALL
  USING (
    teacher_id IN (
      SELECT id FROM public.teachers 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Students can view classes they're enrolled in
CREATE POLICY "Students can view enrolled classes" ON public.classes
  FOR SELECT
  USING (
    id IN (
      SELECT class_id FROM public.class_student_enrollments
      WHERE student_id IN (
        SELECT id FROM public.students
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Tenant admins can view all classes in their tenant
CREATE POLICY "Tenant admins can manage tenant classes" ON public.classes
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_tenants
      WHERE user_id = auth.uid()
        AND role_id IN (
          SELECT id FROM public.user_roles 
          WHERE name IN ('tenant_admin', 'platform_admin')
        )
        AND status = 'active'
    )
  );

-- Similar policies for class_sessions
CREATE POLICY "Users can view sessions for accessible classes" ON public.class_sessions
  FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM public.classes
      WHERE teacher_id IN (
        SELECT id FROM public.teachers 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Similar policies for invitations
CREATE POLICY "Teachers can manage class invitations" ON public.class_student_invitations
  FOR ALL
  USING (
    class_id IN (
      SELECT id FROM public.classes
      WHERE teacher_id IN (
        SELECT id FROM public.teachers 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy for difficulty levels
CREATE POLICY "Users can view class difficulty levels" ON public.class_difficulty_levels
  FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM public.classes
      WHERE teacher_id IN (
        SELECT id FROM public.teachers 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Students policies
CREATE POLICY "Students can view own record" ON public.students
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Students can view own enrollments" ON public.class_student_enrollments
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students
      WHERE user_id = auth.uid()
    )
  );

-- Add update trigger for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_classes_updated_at 
  BEFORE UPDATE ON public.classes
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_sessions_updated_at 
  BEFORE UPDATE ON public.class_sessions
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_enrollments_updated_at 
  BEFORE UPDATE ON public.class_student_enrollments
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at 
  BEFORE UPDATE ON public.students
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;