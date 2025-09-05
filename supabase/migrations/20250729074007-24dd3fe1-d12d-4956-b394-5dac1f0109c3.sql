-- Phase 1: Create file_uploads table and RLS policies

-- Create enum for uploaded_by_type
CREATE TYPE public.uploaded_by_type AS ENUM ('admin', 'teacher');

-- Create file_uploads table
CREATE TABLE public.file_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  domain_id TEXT NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  uploaded_by_type public.uploaded_by_type NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_file_uploads_uploaded_by ON public.file_uploads(uploaded_by);
CREATE INDEX idx_file_uploads_domain_id ON public.file_uploads(domain_id);
CREATE INDEX idx_file_uploads_uploaded_at ON public.file_uploads(uploaded_at);

-- Enable RLS
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admins can manage all files
CREATE POLICY "Admins can manage all file uploads" 
ON public.file_uploads 
FOR ALL 
USING ((auth.jwt() -> 'app_metadata' ->> 'role'::text) = 'admin'::text)
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role'::text) = 'admin'::text);

-- Teachers can only see and manage their own files
CREATE POLICY "Teachers can view their own file uploads" 
ON public.file_uploads 
FOR SELECT 
USING (auth.uid() = uploaded_by);

CREATE POLICY "Teachers can insert their own file uploads" 
ON public.file_uploads 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Teachers can update their own file uploads" 
ON public.file_uploads 
FOR UPDATE 
USING (auth.uid() = uploaded_by);

CREATE POLICY "Teachers can delete their own file uploads" 
ON public.file_uploads 
FOR DELETE 
USING (auth.uid() = uploaded_by);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_file_uploads_updated_at
BEFORE UPDATE ON public.file_uploads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();