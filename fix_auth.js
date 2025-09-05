import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jfolpnyipoocflcrachg.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS Policies...')
  
  // Step 1: Drop problematic policies
  console.log('1. Dropping problematic policies...')
  
  const dropPolicies = `
    DROP POLICY IF EXISTS "user_tenants_policy" ON public.user_tenants;
    DROP POLICY IF EXISTS "tenants_policy" ON public.tenants;
  `
  
  const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies })
  if (dropError) {
    console.error('Error dropping policies:', dropError)
    return
  }
  
  // Step 2: Create simple policies
  console.log('2. Creating simplified policies...')
  
  const createPolicies = `
    -- Simple policy for user_tenants
    CREATE POLICY "user_tenants_select_own" ON public.user_tenants
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

    -- Simple policy for tenants  
    CREATE POLICY "tenants_select_simple" ON public.tenants
    FOR SELECT TO authenticated
    USING (true);

    -- Make user_roles readable
    DROP POLICY IF EXISTS "user_roles_policy" ON public.user_roles;
    CREATE POLICY "user_roles_select_all" ON public.user_roles
    FOR SELECT TO authenticated
    USING (true);
  `
  
  const { error: createError } = await supabase.rpc('exec_sql', { sql: createPolicies })
  if (createError) {
    console.error('Error creating policies:', createError)
    return
  }
  
  console.log('✅ RLS Policies fixed successfully!')
  console.log('🎯 Try logging in now - the infinite recursion should be resolved!')
}

fixRLSPolicies().catch(console.error)