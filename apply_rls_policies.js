import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://jfolpnyipoocflcrachg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb2xwbnlpcG9vY2ZsY3JhY2hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzM1NDE5NywiZXhwIjoyMDY4OTMwMTk3fQ.ehPKApa5bd-wbnrRKEipZRKM7ZwfYjpN9yiWpdPK-yU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const sqlCommands = [
  // Enable RLS on tables
  `ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;`,

  // Tenants policies
  `CREATE POLICY "Platform admins can view all tenants" ON public.tenants
    FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles r ON ut.role_id = r.id
        WHERE ut.user_id = auth.uid()
        AND r.name = 'platform_admin'
        AND ut.status = 'active'
      )
    );`,

  `CREATE POLICY "Platform admins can create tenants" ON public.tenants
    FOR INSERT TO authenticated WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles r ON ut.role_id = r.id
        WHERE ut.user_id = auth.uid()
        AND r.name = 'platform_admin'
        AND ut.status = 'active'
      )
    );`,

  `CREATE POLICY "Platform admins can update tenants" ON public.tenants
    FOR UPDATE TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles r ON ut.role_id = r.id
        WHERE ut.user_id = auth.uid()
        AND r.name = 'platform_admin'
        AND ut.status = 'active'
      )
    );`,

  // User roles policies
  `CREATE POLICY "All authenticated users can view roles" ON public.user_roles
    FOR SELECT TO authenticated USING (true);`,

  // Profiles policies  
  `CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT TO authenticated USING (id = auth.uid());`,

  `CREATE POLICY "Platform admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles r ON ut.role_id = r.id
        WHERE ut.user_id = auth.uid()
        AND r.name = 'platform_admin'
        AND ut.status = 'active'
      )
    );`,

  // User tenants policies
  `CREATE POLICY "Users can view their own tenant relationships" ON public.user_tenants
    FOR SELECT TO authenticated USING (user_id = auth.uid());`,

  `CREATE POLICY "Platform admins can view all tenant relationships" ON public.user_tenants
    FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles r ON ut.role_id = r.id
        WHERE ut.user_id = auth.uid()
        AND r.name = 'platform_admin'
        AND ut.status = 'active'
      )
    );`,

  `CREATE POLICY "Platform admins can create tenant relationships" ON public.user_tenants
    FOR INSERT TO authenticated WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles r ON ut.role_id = r.id
        WHERE ut.user_id = auth.uid()
        AND r.name = 'platform_admin'
        AND ut.status = 'active'
      )
    );`,

  // Invitations policies
  `CREATE POLICY "Platform admins can view all invitations" ON public.invitations
    FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles r ON ut.role_id = r.id
        WHERE ut.user_id = auth.uid()
        AND r.name = 'platform_admin'
        AND ut.status = 'active'
      )
    );`,

  `CREATE POLICY "Platform admins can create invitations" ON public.invitations
    FOR INSERT TO authenticated WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles r ON ut.role_id = r.id
        WHERE ut.user_id = auth.uid()
        AND r.name = 'platform_admin'
        AND ut.status = 'active'
      )
    );`,

  // Domains policies
  `CREATE POLICY "All authenticated users can view domains" ON public.domains
    FOR SELECT TO authenticated USING (true);`,

  `CREATE POLICY "Platform admins can manage domains" ON public.domains
    FOR ALL TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles r ON ut.role_id = r.id
        WHERE ut.user_id = auth.uid()
        AND r.name = 'platform_admin'
        AND ut.status = 'active'
      )
    );`,

  // Tenant domains policies
  `CREATE POLICY "Users can view their tenant domains" ON public.tenant_domains
    FOR SELECT TO authenticated USING (
      tenant_id IN (
        SELECT tenant_id FROM public.user_tenants
        WHERE user_id = auth.uid()
        AND status = 'active'
      )
    );`,

  `CREATE POLICY "Platform admins can manage tenant domains" ON public.tenant_domains
    FOR ALL TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.user_tenants ut
        JOIN public.user_roles r ON ut.role_id = r.id
        WHERE ut.user_id = auth.uid()
        AND r.name = 'platform_admin'
        AND ut.status = 'active'
      )
    );`
];

async function applyRLSPolicies() {
  console.log('🔐 Starting RLS policy application...');
  
  for (let i = 0; i < sqlCommands.length; i++) {
    const sql = sqlCommands[i];
    console.log(`\n[${i + 1}/${sqlCommands.length}] Executing: ${sql.substring(0, 50)}...`);
    
    try {
      const { error } = await supabase.rpc('exec', { sql });
      
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        // Continue with other policies even if one fails
      } else {
        console.log(`✅ Success`);
      }
    } catch (error) {
      console.error(`❌ Exception: ${error.message}`);
    }
  }
  
  console.log('\n🎉 RLS policy application completed!');
}

applyRLSPolicies();