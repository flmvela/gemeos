#!/usr/bin/env node

// Quick script to check tenants in database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jfolpnyipoocflcrachg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTenants() {
  console.log('🔍 Checking tenants in database...');
  
  try {
    // Check raw tenants table
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, slug, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (tenantError) {
      console.error('❌ Error querying tenants:', tenantError);
    } else {
      console.log('✅ Raw tenants table:', tenants?.length || 0, 'records');
      tenants?.forEach((tenant, i) => {
        console.log(`  ${i + 1}. ${tenant.name} (${tenant.slug}) - ${tenant.status} - ${tenant.created_at}`);
      });
    }

    // Check materialized view
    const { data: statsView, error: statsError } = await supabase
      .from('tenant_statistics')
      .select('tenant_id, name, slug, domain_count, teacher_count, student_count')
      .order('name')
      .limit(5);
    
    if (statsError) {
      console.error('❌ Error querying tenant_statistics view:', statsError);
    } else {
      console.log('✅ Materialized view tenant_statistics:', statsView?.length || 0, 'records');
      statsView?.forEach((stat, i) => {
        console.log(`  ${i + 1}. ${stat.name} (${stat.slug}) - Domains: ${stat.domain_count}, Teachers: ${stat.teacher_count}, Students: ${stat.student_count}`);
      });
    }

    // Check latest tenant domains
    const { data: domains, error: domainError } = await supabase
      .from('tenant_domains')
      .select(`
        tenant_id,
        tenants!inner(name, slug),
        domains!inner(name),
        is_active,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (domainError) {
      console.error('❌ Error querying tenant_domains:', domainError);
    } else {
      console.log('✅ Recent tenant domain assignments:', domains?.length || 0, 'records');
      domains?.forEach((assignment, i) => {
        console.log(`  ${i + 1}. ${assignment.tenants.name} -> ${assignment.domains.name} (${assignment.is_active ? 'active' : 'inactive'})`);
      });
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkTenants().then(() => {
  console.log('🏁 Database check completed');
  process.exit(0);
});