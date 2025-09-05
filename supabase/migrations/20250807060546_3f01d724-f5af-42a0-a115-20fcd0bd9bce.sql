-- Check the current trigger definition
SELECT tgname, tgtype, tgenabled, pg_get_triggerdef(oid) as definition
FROM pg_trigger 
WHERE tgrelid = 'concepts'::regclass;

-- Check what the auto_set_teacher_id function does
SELECT pg_get_functiondef('auto_set_teacher_id'::regproc);