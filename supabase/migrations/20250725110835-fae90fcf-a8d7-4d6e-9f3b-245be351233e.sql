-- Create domains table for learning domains
CREATE TABLE public.domains (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT, -- For storing lucide icon names
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teacher_domains table to link teachers to their selected domains
CREATE TABLE public.teacher_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  domain_id TEXT NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  selected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, domain_id)
);

-- Enable Row Level Security
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_domains ENABLE ROW LEVEL SECURITY;

-- Domains are publicly readable (all teachers can see available domains)
CREATE POLICY "Domains are publicly readable" 
ON public.domains 
FOR SELECT 
USING (true);

-- Teachers can view their own domain selections
CREATE POLICY "Teachers can view their own domain selections" 
ON public.teacher_domains 
FOR SELECT 
USING (auth.uid() = teacher_id);

-- Teachers can insert their own domain selections
CREATE POLICY "Teachers can insert their own domain selections" 
ON public.teacher_domains 
FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their own domain selections
CREATE POLICY "Teachers can update their own domain selections" 
ON public.teacher_domains 
FOR UPDATE 
USING (auth.uid() = teacher_id);

-- Teachers can delete their own domain selections
CREATE POLICY "Teachers can delete their own domain selections" 
ON public.teacher_domains 
FOR DELETE 
USING (auth.uid() = teacher_id);

-- Add foreign key constraint to concepts table
ALTER TABLE public.concepts 
ADD CONSTRAINT fk_concepts_domain 
FOREIGN KEY (domain_id) REFERENCES public.domains(id);

-- Insert the initial domain data
INSERT INTO public.domains (id, name, description, icon_name) VALUES 
('music', 'Music', 'Comprehensive music education covering theory, performance, and composition techniques.', 'Music'),
('languages', 'Languages', 'Language learning and instruction across various linguistic skills and cultural contexts.', 'Languages'),
('gmat', 'GMAT', 'Prepares students for the Graduate Management Admission Test, focusing on analytical, quantitative, verbal, and integrated reasoning skills.', 'BookOpen'),
('ielts', 'IELTS', 'Prepares students for the International English Language Testing System, focusing on listening, reading, writing, and speaking skills.', 'BookOpen');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_domains_updated_at
BEFORE UPDATE ON public.domains
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_teacher_domains_teacher_id ON public.teacher_domains(teacher_id);
CREATE INDEX idx_teacher_domains_domain_id ON public.teacher_domains(domain_id);