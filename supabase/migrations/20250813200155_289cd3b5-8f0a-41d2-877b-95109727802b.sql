-- Seed global difficulty_level_labels if table is empty
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.difficulty_level_labels) = 0 THEN
    INSERT INTO public.difficulty_level_labels (domain_id, level_value, label, description, color, display_order)
    VALUES
      (NULL, 0, 'Introductory', 'Foundational concepts and orientation', NULL, 0),
      (NULL, 1, 'Beginner', 'Basic skills and simple applications', NULL, 1),
      (NULL, 2, 'Intermediate', 'Broader understanding and routine problem solving', NULL, 2),
      (NULL, 3, 'Advanced', 'Complex tasks and deeper reasoning', NULL, 3),
      (NULL, 4, 'Expert', 'Specialized knowledge and optimization', NULL, 4),
      (NULL, 5, 'Mastery', 'Comprehensive command and innovation', NULL, 5);
  END IF;
END $$;