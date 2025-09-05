-- Add missing feedback aspects for all domains
INSERT INTO public.domain_feedback_config (domain_id, aspect, is_enabled)
SELECT d.id, unnest(ARRAY['exercises', 'strategies', 'gamification', 'tasks', 'motivation']) as aspect, true
FROM public.domains d
ON CONFLICT (domain_id, aspect) DO NOTHING;

-- Verify the aspects we now have
SELECT domain_id, aspect, is_enabled FROM domain_feedback_config WHERE domain_id = 'jazz' ORDER BY aspect;