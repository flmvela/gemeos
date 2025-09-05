-- Create the table to store AI-suggested concept hierarchies
CREATE TABLE public.suggested_concept_hierarchies (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    domain_id text NOT NULL,
    suggested_structure jsonb NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    teacher_id uuid,
    created_by uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT suggested_concept_hierarchies_pkey PRIMARY KEY (id),
    CONSTRAINT suggested_concept_hierarchies_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES domains(id),
    CONSTRAINT suggested_concept_hierarchies_status_check CHECK (status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT suggested_concept_hierarchies_structure_not_empty CHECK (jsonb_typeof(suggested_structure) IS NOT NULL)
);

-- Enable Row-Level Security
ALTER TABLE public.suggested_concept_hierarchies ENABLE ROW LEVEL SECURITY;

-- Create admin-only RLS policies
CREATE POLICY "Only admins can select suggested hierarchies" 
ON public.suggested_concept_hierarchies 
FOR SELECT 
USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Only admins can insert suggested hierarchies" 
ON public.suggested_concept_hierarchies 
FOR INSERT 
WITH CHECK (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Only admins can update suggested hierarchies" 
ON public.suggested_concept_hierarchies 
FOR UPDATE 
USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

CREATE POLICY "Only admins can delete suggested hierarchies" 
ON public.suggested_concept_hierarchies 
FOR DELETE 
USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

-- Create indexes for better performance
CREATE INDEX idx_suggested_concept_hierarchies_domain_id ON public.suggested_concept_hierarchies(domain_id);
CREATE INDEX idx_suggested_concept_hierarchies_status ON public.suggested_concept_hierarchies(status);
CREATE INDEX idx_suggested_concept_hierarchies_created_at ON public.suggested_concept_hierarchies(created_at);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_suggested_concept_hierarchies_updated_at
    BEFORE UPDATE ON public.suggested_concept_hierarchies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();