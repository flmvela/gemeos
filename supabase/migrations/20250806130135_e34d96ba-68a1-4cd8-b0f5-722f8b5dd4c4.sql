-- Create domain_feedback_config table
CREATE TABLE public.domain_feedback_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  domain_id text NOT NULL,
  aspect text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT domain_feedback_config_pkey PRIMARY KEY (id),
  CONSTRAINT domain_feedback_config_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.domains(id),
  CONSTRAINT domain_feedback_config_unique_domain_aspect UNIQUE (domain_id, aspect)
);

-- Add status column to learning_goals table
ALTER TABLE public.learning_goals 
ADD COLUMN status text NOT NULL DEFAULT 'approved';

-- Add check constraint for learning_goals status
ALTER TABLE public.learning_goals 
ADD CONSTRAINT learning_goals_status_check 
CHECK (status IN ('suggested', 'approved', 'rejected', 'pending', 'ai_suggested'));

-- Enable RLS on domain_feedback_config
ALTER TABLE public.domain_feedback_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for domain_feedback_config (admin-only access)
CREATE POLICY "Admins can manage feedback config" 
ON public.domain_feedback_config 
FOR ALL 
USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text)
WITH CHECK (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

-- Create trigger for updated_at
CREATE TRIGGER update_domain_feedback_config_updated_at
BEFORE UPDATE ON public.domain_feedback_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default feedback configurations for existing domains
INSERT INTO public.domain_feedback_config (domain_id, aspect, is_enabled)
SELECT d.id, 'concepts', true FROM public.domains d
ON CONFLICT (domain_id, aspect) DO NOTHING;

INSERT INTO public.domain_feedback_config (domain_id, aspect, is_enabled)
SELECT d.id, 'learning_goals', true FROM public.domains d
ON CONFLICT (domain_id, aspect) DO NOTHING;