-- Create enum for evaluation method input types
CREATE TYPE public.evaluation_input_type AS ENUM ('MIDI', 'Audio', 'Text', 'MCQ', 'Video', 'Image', 'File');

-- Table 1: task_types
CREATE TABLE public.task_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  domain_id TEXT REFERENCES public.domains(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on task_types
ALTER TABLE public.task_types ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_types: Public read, admin write
CREATE POLICY "Anyone can view task types" 
ON public.task_types 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert task types" 
ON public.task_types 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update task types" 
ON public.task_types 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete task types" 
ON public.task_types 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'admin');

-- Table 2: content_formats
CREATE TABLE public.content_formats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  format_name TEXT NOT NULL UNIQUE,
  description TEXT,
  mime_type TEXT,
  domain_id TEXT REFERENCES public.domains(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on content_formats
ALTER TABLE public.content_formats ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_formats: Public read, admin write
CREATE POLICY "Anyone can view content formats" 
ON public.content_formats 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert content formats" 
ON public.content_formats 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update content formats" 
ON public.content_formats 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete content formats" 
ON public.content_formats 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'admin');

-- Table 3: learning_strategies
CREATE TABLE public.learning_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_name TEXT NOT NULL UNIQUE,
  description TEXT,
  domain_id TEXT REFERENCES public.domains(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on learning_strategies
ALTER TABLE public.learning_strategies ENABLE ROW LEVEL SECURITY;

-- RLS policies for learning_strategies: Public read, admin write
CREATE POLICY "Anyone can view learning strategies" 
ON public.learning_strategies 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert learning strategies" 
ON public.learning_strategies 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update learning strategies" 
ON public.learning_strategies 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete learning strategies" 
ON public.learning_strategies 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'admin');

-- Table 4: evaluation_methods
CREATE TABLE public.evaluation_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  method_name TEXT NOT NULL UNIQUE,
  description TEXT,
  input_type public.evaluation_input_type,
  domain_id TEXT REFERENCES public.domains(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on evaluation_methods
ALTER TABLE public.evaluation_methods ENABLE ROW LEVEL SECURITY;

-- RLS policies for evaluation_methods: Public read, admin write
CREATE POLICY "Anyone can view evaluation methods" 
ON public.evaluation_methods 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert evaluation methods" 
ON public.evaluation_methods 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update evaluation methods" 
ON public.evaluation_methods 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete evaluation methods" 
ON public.evaluation_methods 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'admin');

-- Table 5: learning_goal_schemas
CREATE TABLE public.learning_goal_schemas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schema_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on learning_goal_schemas
ALTER TABLE public.learning_goal_schemas ENABLE ROW LEVEL SECURITY;

-- RLS policies for learning_goal_schemas: Admin only
CREATE POLICY "Only admins can view learning goal schemas" 
ON public.learning_goal_schemas 
FOR SELECT 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can insert learning goal schemas" 
ON public.learning_goal_schemas 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update learning goal schemas" 
ON public.learning_goal_schemas 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete learning goal schemas" 
ON public.learning_goal_schemas 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'admin');

-- Table 6: learning_goals
CREATE TABLE public.learning_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schema_id UUID NOT NULL REFERENCES public.learning_goal_schemas(id) ON DELETE CASCADE,
  level_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  domain_id TEXT NOT NULL REFERENCES public.domains(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on learning_goals
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for learning_goals: Public read, admin write
CREATE POLICY "Anyone can view learning goals" 
ON public.learning_goals 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert learning goals" 
ON public.learning_goals 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update learning goals" 
ON public.learning_goals 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete learning goals" 
ON public.learning_goals 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'admin');

-- Table 7: concept_learning_strategies
CREATE TABLE public.concept_learning_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES public.learning_strategies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(concept_id, strategy_id)
);

-- Enable RLS on concept_learning_strategies
ALTER TABLE public.concept_learning_strategies ENABLE ROW LEVEL SECURITY;

-- RLS policies for concept_learning_strategies: Teacher ownership enforced by concept_id
CREATE POLICY "Teachers can view strategies for their concepts" 
ON public.concept_learning_strategies 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.concepts 
  WHERE concepts.id = concept_learning_strategies.concept_id 
  AND concepts.teacher_id = auth.uid()
));

CREATE POLICY "Teachers can insert strategies for their concepts" 
ON public.concept_learning_strategies 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.concepts 
  WHERE concepts.id = concept_learning_strategies.concept_id 
  AND concepts.teacher_id = auth.uid()
));

CREATE POLICY "Teachers can update strategies for their concepts" 
ON public.concept_learning_strategies 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.concepts 
  WHERE concepts.id = concept_learning_strategies.concept_id 
  AND concepts.teacher_id = auth.uid()
));

CREATE POLICY "Teachers can delete strategies for their concepts" 
ON public.concept_learning_strategies 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.concepts 
  WHERE concepts.id = concept_learning_strategies.concept_id 
  AND concepts.teacher_id = auth.uid()
));

-- Table 8: concept_evaluation_methods
CREATE TABLE public.concept_evaluation_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  evaluation_method_id UUID NOT NULL REFERENCES public.evaluation_methods(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(concept_id, evaluation_method_id)
);

-- Enable RLS on concept_evaluation_methods
ALTER TABLE public.concept_evaluation_methods ENABLE ROW LEVEL SECURITY;

-- RLS policies for concept_evaluation_methods: Teacher ownership enforced by concept_id
CREATE POLICY "Teachers can view evaluation methods for their concepts" 
ON public.concept_evaluation_methods 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.concepts 
  WHERE concepts.id = concept_evaluation_methods.concept_id 
  AND concepts.teacher_id = auth.uid()
));

CREATE POLICY "Teachers can insert evaluation methods for their concepts" 
ON public.concept_evaluation_methods 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.concepts 
  WHERE concepts.id = concept_evaluation_methods.concept_id 
  AND concepts.teacher_id = auth.uid()
));

CREATE POLICY "Teachers can update evaluation methods for their concepts" 
ON public.concept_evaluation_methods 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.concepts 
  WHERE concepts.id = concept_evaluation_methods.concept_id 
  AND concepts.teacher_id = auth.uid()
));

CREATE POLICY "Teachers can delete evaluation methods for their concepts" 
ON public.concept_evaluation_methods 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.concepts 
  WHERE concepts.id = concept_evaluation_methods.concept_id 
  AND concepts.teacher_id = auth.uid()
));

-- Table 9: concept_supported_content_formats
CREATE TABLE public.concept_supported_content_formats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  content_format_id UUID NOT NULL REFERENCES public.content_formats(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(concept_id, content_format_id)
);

-- Enable RLS on concept_supported_content_formats
ALTER TABLE public.concept_supported_content_formats ENABLE ROW LEVEL SECURITY;

-- RLS policies for concept_supported_content_formats: Teacher ownership enforced by concept_id
CREATE POLICY "Teachers can view content formats for their concepts" 
ON public.concept_supported_content_formats 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.concepts 
  WHERE concepts.id = concept_supported_content_formats.concept_id 
  AND concepts.teacher_id = auth.uid()
));

CREATE POLICY "Teachers can insert content formats for their concepts" 
ON public.concept_supported_content_formats 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.concepts 
  WHERE concepts.id = concept_supported_content_formats.concept_id 
  AND concepts.teacher_id = auth.uid()
));

CREATE POLICY "Teachers can update content formats for their concepts" 
ON public.concept_supported_content_formats 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.concepts 
  WHERE concepts.id = concept_supported_content_formats.concept_id 
  AND concepts.teacher_id = auth.uid()
));

CREATE POLICY "Teachers can delete content formats for their concepts" 
ON public.concept_supported_content_formats 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.concepts 
  WHERE concepts.id = concept_supported_content_formats.concept_id 
  AND concepts.teacher_id = auth.uid()
));

-- Create triggers for updated_at columns
CREATE TRIGGER update_task_types_updated_at
  BEFORE UPDATE ON public.task_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_formats_updated_at
  BEFORE UPDATE ON public.content_formats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_strategies_updated_at
  BEFORE UPDATE ON public.learning_strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evaluation_methods_updated_at
  BEFORE UPDATE ON public.evaluation_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_goal_schemas_updated_at
  BEFORE UPDATE ON public.learning_goal_schemas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_learning_goals_updated_at
  BEFORE UPDATE ON public.learning_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();