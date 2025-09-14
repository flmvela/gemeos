-- Script to create test domains for the teacher's tenant
-- First, find the tenant for the teacher user

-- Get the tenant_id for the teacher
WITH teacher_tenant AS (
  SELECT ut.tenant_id
  FROM auth.users u
  JOIN user_tenants ut ON ut.user_id = u.id
  WHERE u.email = 'flm.velardi+teacher13@gmail.com'
  LIMIT 1
)
-- Insert test domains if they don't exist
INSERT INTO domains (name, description, tenant_id, status, difficulty_levels, created_at, updated_at)
SELECT 
  name,
  description,
  tenant_id,
  'active' as status,
  difficulty_levels,
  NOW() as created_at,
  NOW() as updated_at
FROM (
  SELECT 
    tt.tenant_id,
    unnest(ARRAY[
      'Mathematics',
      'Music Theory', 
      'Piano',
      'Science',
      'Language Arts'
    ]) as name,
    unnest(ARRAY[
      'Algebra, Geometry, Calculus, and Statistics',
      'Fundamentals, Harmony, Composition, and Analysis',
      'Classical and Contemporary Piano Performance',
      'Physics, Chemistry, Biology, and Earth Science',
      'Reading, Writing, Grammar, and Literature'
    ]) as description,
    unnest(ARRAY[
      ARRAY[1,2,3,4,5]::integer[],
      ARRAY[1,2,3,4]::integer[],
      ARRAY[1,2,3,4,5,6]::integer[],
      ARRAY[1,2,3,4,5]::integer[],
      ARRAY[1,2,3]::integer[]
    ]) as difficulty_levels
  FROM teacher_tenant tt
) AS new_domains
WHERE NOT EXISTS (
  SELECT 1 FROM domains d 
  WHERE d.name = new_domains.name 
  AND d.tenant_id = new_domains.tenant_id
);

-- Verify the domains were created
SELECT 
  d.id,
  d.name,
  d.description,
  d.status,
  d.difficulty_levels,
  t.name as tenant_name
FROM domains d
JOIN tenants t ON t.id = d.tenant_id
WHERE d.tenant_id IN (
  SELECT ut.tenant_id
  FROM auth.users u
  JOIN user_tenants ut ON ut.user_id = u.id
  WHERE u.email = 'flm.velardi+teacher13@gmail.com'
)
ORDER BY d.name;