-- Ensure difficulty levels exist for all domains
BEGIN;

-- Function to create default difficulty levels for a domain if they don't exist
CREATE OR REPLACE FUNCTION public.ensure_domain_difficulty_levels(p_domain_id UUID)
RETURNS void AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  -- Check if difficulty levels already exist for this domain
  SELECT COUNT(*) INTO existing_count
  FROM public.domain_difficulty_levels
  WHERE domain_id = p_domain_id;
  
  -- Only create if none exist
  IF existing_count = 0 THEN
    INSERT INTO public.domain_difficulty_levels (domain_id, level_number, level_name, description, color_code)
    VALUES
      (p_domain_id, 1, 'Beginner', 'Foundation level - basic concepts and skills', '#22c55e'),
      (p_domain_id, 2, 'Elementary', 'Building on basics with simple applications', '#34d399'),
      (p_domain_id, 3, 'Intermediate', 'Developing competency with moderate complexity', '#fbbf24'),
      (p_domain_id, 4, 'Advanced Intermediate', 'Approaching advanced concepts', '#f59e0b'),
      (p_domain_id, 5, 'Advanced', 'Complex concepts and applications', '#fb923c')
    ON CONFLICT (domain_id, level_number) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply to all existing domains
DO $$
DECLARE
  domain_record RECORD;
BEGIN
  FOR domain_record IN SELECT id, name FROM public.domains
  LOOP
    PERFORM public.ensure_domain_difficulty_levels(domain_record.id);
    RAISE NOTICE 'Ensured difficulty levels for domain: %', domain_record.name;
  END LOOP;
END;
$$;

-- Verify the results
SELECT 
  d.name as domain_name,
  COUNT(ddl.id) as difficulty_levels_count
FROM public.domains d
LEFT JOIN public.domain_difficulty_levels ddl ON d.id = ddl.domain_id
GROUP BY d.id, d.name
ORDER BY d.name;

COMMIT;