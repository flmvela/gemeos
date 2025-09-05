-- Create enum for extraction status
CREATE TYPE public.extraction_status AS ENUM ('pending', 'approved', 'rejected');

-- Create domain_extracted_files table
CREATE TABLE public.domain_extracted_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status extraction_status NOT NULL DEFAULT 'pending'
);

-- Enable Row Level Security
ALTER TABLE public.domain_extracted_files ENABLE ROW LEVEL SECURITY;

-- Teachers can insert their own entries
CREATE POLICY "Teachers can insert their own extractions" 
ON public.domain_extracted_files 
FOR INSERT 
WITH CHECK (auth.uid() = uploaded_by);

-- Teachers can read their own entries
CREATE POLICY "Teachers can view their own extractions" 
ON public.domain_extracted_files 
FOR SELECT 
USING (auth.uid() = uploaded_by);

-- Admins can read all entries
CREATE POLICY "Admins can view all extractions" 
ON public.domain_extracted_files 
FOR SELECT 
USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

-- Admins can delete all entries
CREATE POLICY "Admins can delete all extractions" 
ON public.domain_extracted_files 
FOR DELETE 
USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

-- Only admins can update status
CREATE POLICY "Only admins can update extraction status" 
ON public.domain_extracted_files 
FOR UPDATE 
USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);