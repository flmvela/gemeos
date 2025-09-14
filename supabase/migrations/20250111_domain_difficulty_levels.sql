-- Create a table to store difficulty levels for each domain
-- This allows customization of difficulty levels per domain

BEGIN;

-- Create difficulty levels table
CREATE TABLE IF NOT EXISTS public.domain_difficulty_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL CHECK (level_number BETWEEN 1 AND 10),
  level_name VARCHAR(100) NOT NULL,
  description TEXT,
  color_code VARCHAR(7), -- Hex color code
  icon VARCHAR(10), -- Emoji or icon identifier
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique level numbers per domain
  UNIQUE(domain_id, level_number)
);

-- Create indexes
CREATE INDEX idx_domain_difficulty_levels_domain ON public.domain_difficulty_levels(domain_id);
CREATE INDEX idx_domain_difficulty_levels_number ON public.domain_difficulty_levels(level_number);

-- Add RLS policies
ALTER TABLE public.domain_difficulty_levels ENABLE ROW LEVEL SECURITY;

-- Policy for viewing difficulty levels (anyone can view)
CREATE POLICY "Domain difficulty levels are viewable by all authenticated users" 
  ON public.domain_difficulty_levels
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy for managing difficulty levels (tenant admins only)
CREATE POLICY "Tenant admins can manage domain difficulty levels" 
  ON public.domain_difficulty_levels
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.domains d
      JOIN public.user_tenants ut ON d.tenant_id = ut.tenant_id
      JOIN public.user_roles ur ON ut.role_id = ur.id
      WHERE d.id = domain_difficulty_levels.domain_id
        AND ut.user_id = auth.uid()
        AND ur.name IN ('tenant_admin', 'platform_admin')
        AND ut.status = 'active'
    )
  );

-- Function to populate default difficulty levels for a domain
CREATE OR REPLACE FUNCTION public.create_default_difficulty_levels(p_domain_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.domain_difficulty_levels (domain_id, level_number, level_name, description, color_code)
  VALUES
    (p_domain_id, 1, 'Beginner', 'Foundation level - basic concepts and skills', '#22c55e'),
    (p_domain_id, 2, 'Elementary', 'Building on basics with simple applications', '#34d399'),
    (p_domain_id, 3, 'Intermediate', 'Developing competency with moderate complexity', '#fbbf24'),
    (p_domain_id, 4, 'Advanced Intermediate', 'Approaching advanced concepts', '#f59e0b'),
    (p_domain_id, 5, 'Advanced', 'Complex concepts and applications', '#fb923c'),
    (p_domain_id, 6, 'Proficient', 'High-level mastery of concepts', '#f87171'),
    (p_domain_id, 7, 'Expert', 'Expert-level understanding and application', '#ef4444'),
    (p_domain_id, 8, 'Master', 'Mastery of advanced techniques', '#dc2626'),
    (p_domain_id, 9, 'Professional', 'Professional-level expertise', '#b91c1c'),
    (p_domain_id, 10, 'Specialist', 'Specialist knowledge and skills', '#991b1b')
  ON CONFLICT (domain_id, level_number) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default difficulty levels when a new domain is created
CREATE OR REPLACE FUNCTION public.create_difficulty_levels_on_domain_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.create_default_difficulty_levels(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_difficulty_levels_trigger
  AFTER INSERT ON public.domains
  FOR EACH ROW
  EXECUTE FUNCTION public.create_difficulty_levels_on_domain_insert();

-- Populate difficulty levels for existing domains
DO $$
DECLARE
  domain_record RECORD;
BEGIN
  FOR domain_record IN SELECT id FROM public.domains
  LOOP
    PERFORM public.create_default_difficulty_levels(domain_record.id);
  END LOOP;
END;
$$;

COMMIT;