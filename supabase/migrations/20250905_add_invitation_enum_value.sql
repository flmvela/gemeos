-- Add invitation template type to enum (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'email_template_type' AND e.enumlabel = 'invitation') THEN
        ALTER TYPE email_template_type ADD VALUE 'invitation';
    END IF;
END $$;