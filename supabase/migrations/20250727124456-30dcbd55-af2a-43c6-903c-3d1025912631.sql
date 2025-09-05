-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create rag_chunks table for storing document chunks with embeddings
CREATE TABLE public.rag_chunks (
    chunk_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    extracted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rag_chunks
-- Only admins can insert chunks
CREATE POLICY "Only admins can insert rag chunks" 
ON public.rag_chunks 
FOR INSERT 
WITH CHECK (
    (auth.jwt() ->> 'role'::text) = 'admin'::text
);

-- Only admins can read chunks
CREATE POLICY "Only admins can read rag chunks" 
ON public.rag_chunks 
FOR SELECT 
USING (
    (auth.jwt() ->> 'role'::text) = 'admin'::text
);

-- Explicitly deny updates and deletes for security
CREATE POLICY "Deny updates on rag chunks" 
ON public.rag_chunks 
FOR UPDATE 
USING (false);

CREATE POLICY "Deny deletes on rag chunks" 
ON public.rag_chunks 
FOR DELETE 
USING (false);

-- Create vector similarity search index (HNSW)
CREATE INDEX idx_rag_chunks_embedding_hnsw 
ON public.rag_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Create full-text search index for fallback keyword search
CREATE INDEX idx_rag_chunks_text_gin 
ON public.rag_chunks 
USING gin (to_tsvector('english', chunk_text));

-- Create index on document_id for efficient filtering
CREATE INDEX idx_rag_chunks_document_id 
ON public.rag_chunks (document_id);

-- Create index on extracted_at for time-based queries
CREATE INDEX idx_rag_chunks_extracted_at 
ON public.rag_chunks (extracted_at);