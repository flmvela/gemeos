-- Add source_file_id column to concepts table
ALTER TABLE public.concepts 
ADD COLUMN source_file_id uuid;

-- Add foreign key constraint to link concepts to domain_extracted_files
ALTER TABLE public.concepts 
ADD CONSTRAINT fk_concepts_source_file 
FOREIGN KEY (source_file_id) 
REFERENCES public.domain_extracted_files(id) 
ON DELETE SET NULL;