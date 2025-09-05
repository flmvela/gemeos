
-- 1) Add concept_id to learning_goals and indexes
ALTER TABLE public.learning_goals
ADD COLUMN IF NOT EXISTS concept_id UUID REFERENCES public.concepts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_learning_goals_concept_id
  ON public.learning_goals(concept_id);

CREATE INDEX IF NOT EXISTS idx_learning_goals_domain_status
  ON public.learning_goals(domain_id, status);

-- 2) RLS: allow teachers to modify goals for their assigned domains
-- Existing policies keep public SELECT and admin-only write.
-- We add teacher policies in addition to admin ones.

-- INSERT: teacher can insert if assigned to the domain
CREATE POLICY "Teachers can insert learning goals for their domains"
ON public.learning_goals
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.teacher_domains td
    WHERE td.teacher_id = auth.uid()
      AND td.domain_id = public.learning_goals.domain_id
  )
);

-- UPDATE: teacher can update if assigned to the domain
CREATE POLICY "Teachers can update learning goals for their domains"
ON public.learning_goals
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.teacher_domains td
    WHERE td.teacher_id = auth.uid()
      AND td.domain_id = public.learning_goals.domain_id
  )
);

-- DELETE: teacher can delete if assigned to the domain
CREATE POLICY "Teachers can delete learning goals for their domains"
ON public.learning_goals
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.teacher_domains td
    WHERE td.teacher_id = auth.uid()
      AND td.domain_id = public.learning_goals.domain_id
  )
);
