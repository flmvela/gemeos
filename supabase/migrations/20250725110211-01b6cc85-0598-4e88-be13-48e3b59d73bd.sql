-- Create concepts table for learning concepts hierarchy
CREATE TABLE public.concepts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  domain_id TEXT NOT NULL,
  parent_concept_id UUID REFERENCES public.concepts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'ai_suggested', 'pending_review', 'rejected')),
  metadata_json JSONB DEFAULT '{}',
  teacher_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create concept_prerequisites table for prerequisite relationships
CREATE TABLE public.concept_prerequisites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  prerequisite_concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(concept_id, prerequisite_concept_id),
  CHECK (concept_id != prerequisite_concept_id)
);

-- Enable Row Level Security
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_prerequisites ENABLE ROW LEVEL SECURITY;

-- Create policies for concepts table
CREATE POLICY "Teachers can view their own concepts" 
ON public.concepts 
FOR SELECT 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create their own concepts" 
ON public.concepts 
FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own concepts" 
ON public.concepts 
FOR UPDATE 
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own concepts" 
ON public.concepts 
FOR DELETE 
USING (auth.uid() = teacher_id);

-- Create policies for concept_prerequisites table
CREATE POLICY "Teachers can view prerequisites for their concepts" 
ON public.concept_prerequisites 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.concepts 
    WHERE id = concept_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can create prerequisites for their concepts" 
ON public.concept_prerequisites 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.concepts 
    WHERE id = concept_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can update prerequisites for their concepts" 
ON public.concept_prerequisites 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.concepts 
    WHERE id = concept_id AND teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can delete prerequisites for their concepts" 
ON public.concept_prerequisites 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.concepts 
    WHERE id = concept_id AND teacher_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_concepts_updated_at
BEFORE UPDATE ON public.concepts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_concepts_teacher_id ON public.concepts(teacher_id);
CREATE INDEX idx_concepts_domain_id ON public.concepts(domain_id);
CREATE INDEX idx_concepts_parent_concept_id ON public.concepts(parent_concept_id);
CREATE INDEX idx_concept_prerequisites_concept_id ON public.concept_prerequisites(concept_id);
CREATE INDEX idx_concept_prerequisites_prerequisite_concept_id ON public.concept_prerequisites(prerequisite_concept_id);