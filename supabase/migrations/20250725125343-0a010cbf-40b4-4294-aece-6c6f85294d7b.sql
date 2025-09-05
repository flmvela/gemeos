-- Add policies for domain management operations
-- These allow authenticated users (teachers) to manage domains

-- Allow authenticated users to insert domains
CREATE POLICY "Authenticated users can insert domains" 
ON public.domains 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update domains
CREATE POLICY "Authenticated users can update domains" 
ON public.domains 
FOR UPDATE 
TO authenticated
USING (true);

-- Allow authenticated users to delete domains
CREATE POLICY "Authenticated users can delete domains" 
ON public.domains 
FOR DELETE 
TO authenticated
USING (true);