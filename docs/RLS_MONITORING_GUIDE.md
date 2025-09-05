# RLS Monitoring and Maintenance Guide

## Quick Start Checklist

### Immediate Actions to Fix 406 Errors

1. **Apply the RLS fix migration:**
```bash
supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres" < supabase/migrations/20250904_comprehensive_rls_fix.sql
```

2. **Verify RLS policies are active:**
```sql
SELECT * FROM public.diagnose_rls_policies();
```

3. **Test with platform admin user:**
```sql
SELECT * FROM public.diagnose_user_access('platform-admin@gemeos.ai');
```

## Monitoring Dashboard Queries

### 1. Real-Time RLS Performance Monitor

```sql
-- Create a view for ongoing monitoring
CREATE OR REPLACE VIEW rls_health_dashboard AS
WITH policy_stats AS (
    SELECT 
        tablename,
        COUNT(*) as policy_count,
        array_agg(policyname ORDER BY policyname) as policies
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
),
table_stats AS (
    SELECT 
        schemaname,
        tablename,
        n_live_tup as row_count,
        n_dead_tup as dead_rows,
        last_vacuum,
        last_autovacuum
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
),
index_stats AS (
    SELECT 
        schemaname,
        tablename,
        COUNT(*) as index_count,
        SUM(idx_scan) as total_index_scans
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    GROUP BY schemaname, tablename
)
SELECT 
    t.tablename,
    COALESCE(p.policy_count, 0) as policies,
    t.row_count,
    t.dead_rows,
    i.index_count,
    i.total_index_scans,
    CASE 
        WHEN t.last_autovacuum IS NULL THEN 'Never'
        ELSE to_char(t.last_autovacuum, 'YYYY-MM-DD HH24:MI')
    END as last_vacuum,
    CASE 
        WHEN COALESCE(p.policy_count, 0) = 0 THEN 'CRITICAL - No Policies'
        WHEN t.dead_rows > t.row_count * 0.2 THEN 'WARNING - Needs Vacuum'
        WHEN i.total_index_scans = 0 THEN 'WARNING - Unused Indexes'
        ELSE 'OK'
    END as health_status
FROM table_stats t
LEFT JOIN policy_stats p ON t.tablename = p.tablename
LEFT JOIN index_stats i ON t.tablename = i.tablename
WHERE t.tablename IN (
    'tenants', 'user_tenants', 'profiles', 'invitations',
    'domains', 'tenant_domains', 'audit_logs'
)
ORDER BY 
    CASE 
        WHEN COALESCE(p.policy_count, 0) = 0 THEN 0
        ELSE 1
    END,
    t.tablename;

-- Query the dashboard
SELECT * FROM rls_health_dashboard;
```

### 2. Slow Query Detection

```sql
-- Enable pg_stat_statements if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Monitor slow RLS queries
CREATE OR REPLACE FUNCTION monitor_slow_rls_queries()
RETURNS TABLE(
    query_pattern TEXT,
    avg_time_ms NUMERIC,
    max_time_ms NUMERIC,
    calls BIGINT,
    alert_level TEXT,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN query LIKE '%user_tenants%' THEN 'User-Tenant Lookup'
            WHEN query LIKE '%roles%' THEN 'Role Check'
            WHEN query LIKE '%profiles%' THEN 'Profile Access'
            WHEN query LIKE '%audit_logs%' THEN 'Audit Query'
            ELSE 'Other RLS Query'
        END as query_pattern,
        ROUND(mean_exec_time::NUMERIC, 2) as avg_time_ms,
        ROUND(max_exec_time::NUMERIC, 2) as max_time_ms,
        calls,
        CASE 
            WHEN max_exec_time > 50 THEN 'CRITICAL'
            WHEN mean_exec_time > 10 THEN 'WARNING'
            ELSE 'OK'
        END as alert_level,
        CASE 
            WHEN max_exec_time > 50 THEN 'Query needs optimization - check indexes'
            WHEN mean_exec_time > 10 THEN 'Consider caching or materialized view'
            ELSE 'Performance acceptable'
        END as recommendation
    FROM pg_stat_statements
    WHERE query LIKE ANY(ARRAY[
        '%user_tenants%',
        '%roles%',
        '%profiles%',
        '%audit_logs%',
        '%tenants%'
    ])
    AND query NOT LIKE '%pg_stat_statements%'
    ORDER BY max_exec_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;
```

### 3. User Activity Monitor

```sql
CREATE OR REPLACE FUNCTION monitor_user_activity(p_hours INTEGER DEFAULT 24)
RETURNS TABLE(
    user_id UUID,
    user_email TEXT,
    tenant_name TEXT,
    role_name TEXT,
    action_count BIGINT,
    last_action TIMESTAMP WITH TIME ZONE,
    suspicious_activity BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH user_actions AS (
        SELECT 
            al.user_id,
            COUNT(*) as actions,
            MAX(al.created_at) as last_action,
            COUNT(*) FILTER (WHERE al.action LIKE '%failed%') as failed_actions,
            COUNT(*) FILTER (WHERE al.action IN ('role_change', 'permission_change')) as privilege_changes
        FROM public.audit_logs al
        WHERE al.created_at > NOW() - (p_hours || ' hours')::INTERVAL
        GROUP BY al.user_id
    )
    SELECT 
        ua.user_id,
        p.email::TEXT,
        t.name::TEXT as tenant_name,
        r.name::TEXT as role_name,
        ua.actions,
        ua.last_action,
        (ua.failed_actions > 5 OR ua.privilege_changes > 2) as suspicious_activity
    FROM user_actions ua
    LEFT JOIN public.profiles p ON ua.user_id = p.id
    LEFT JOIN public.user_tenants ut ON ua.user_id = ut.user_id AND ut.is_primary = true
    LEFT JOIN public.tenants t ON ut.tenant_id = t.id
    LEFT JOIN public.roles r ON ut.role_id = r.id
    ORDER BY ua.actions DESC;
END;
$$ LANGUAGE plpgsql;
```

## Alert Configuration

### 1. PostgreSQL Alerts (using pg_cron)

```sql
-- Install pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule hourly RLS health check
SELECT cron.schedule(
    'rls-health-check',
    '0 * * * *',
    $$
    DO $$
    DECLARE
        v_critical_count INTEGER;
        v_warning_count INTEGER;
    BEGIN
        -- Check for critical issues
        SELECT COUNT(*) INTO v_critical_count
        FROM rls_health_dashboard
        WHERE health_status LIKE 'CRITICAL%';
        
        -- Check for warnings
        SELECT COUNT(*) INTO v_warning_count
        FROM rls_health_dashboard
        WHERE health_status LIKE 'WARNING%';
        
        -- Log issues
        IF v_critical_count > 0 THEN
            INSERT INTO public.audit_logs (
                action, resource_type, resource_id, changes
            ) VALUES (
                'rls_health_critical',
                'system',
                'rls_monitor',
                jsonb_build_object(
                    'critical_count', v_critical_count,
                    'warning_count', v_warning_count,
                    'timestamp', NOW()
                )
            );
        END IF;
    END $$;
    $$
);

-- Schedule daily performance report
SELECT cron.schedule(
    'rls-performance-report',
    '0 2 * * *',
    $$
    INSERT INTO public.audit_logs (
        action, resource_type, resource_id, changes
    )
    SELECT 
        'rls_performance_report',
        'system',
        'daily_report',
        jsonb_build_object(
            'date', CURRENT_DATE,
            'slow_queries', (
                SELECT jsonb_agg(row_to_json(sq))
                FROM monitor_slow_rls_queries() sq
                WHERE alert_level != 'OK'
            ),
            'table_health', (
                SELECT jsonb_agg(row_to_json(hd))
                FROM rls_health_dashboard hd
                WHERE health_status != 'OK'
            )
        );
    $$
);
```

### 2. Application-Level Monitoring (JavaScript/TypeScript)

```typescript
// RLS Monitor Service
class RLSMonitor {
  private supabase: SupabaseClient;
  private alertThresholds = {
    queryTime: 10, // ms
    errorRate: 0.01, // 1%
    failedAuthAttempts: 5
  };

  async checkRLSHealth(): Promise<HealthStatus> {
    try {
      // Test basic RLS operation
      const start = performance.now();
      const { data, error } = await this.supabase
        .from('tenants')
        .select('id, name')
        .limit(1);
      const duration = performance.now() - start;

      if (error) {
        if (error.code === '42501') {
          // RLS policy violation
          return {
            status: 'critical',
            message: 'RLS policy error - check user permissions',
            error: error
          };
        }
        throw error;
      }

      // Check performance
      if (duration > this.alertThresholds.queryTime) {
        return {
          status: 'warning',
          message: `RLS query time ${duration}ms exceeds threshold`,
          metrics: { queryTime: duration }
        };
      }

      return {
        status: 'healthy',
        message: 'RLS operating normally',
        metrics: { queryTime: duration }
      };
    } catch (error) {
      return {
        status: 'critical',
        message: 'RLS health check failed',
        error
      };
    }
  }

  async monitorUserAccess(userId: string): Promise<AccessReport> {
    const { data: tenants } = await this.supabase
      .rpc('get_user_tenants_with_roles', { p_user_id: userId });

    const { data: recentActivity } = await this.supabase
      .from('audit_logs')
      .select('action, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return {
      userId,
      tenants: tenants || [],
      recentActivity: recentActivity || [],
      accessLevel: this.calculateAccessLevel(tenants)
    };
  }

  private calculateAccessLevel(tenants: any[]): string {
    if (tenants.some(t => t.role_name === 'platform_admin')) {
      return 'platform_admin';
    }
    if (tenants.some(t => t.role_name === 'tenant_admin')) {
      return 'tenant_admin';
    }
    if (tenants.some(t => t.role_name === 'teacher')) {
      return 'teacher';
    }
    return 'student';
  }
}

// Usage
const monitor = new RLSMonitor(supabase);

// Set up periodic health checks
setInterval(async () => {
  const health = await monitor.checkRLSHealth();
  if (health.status !== 'healthy') {
    console.error('RLS Health Alert:', health);
    // Send alert to monitoring service
  }
}, 60000); // Check every minute
```

## Maintenance Procedures

### 1. Regular Maintenance Tasks

```sql
-- Weekly maintenance function
CREATE OR REPLACE FUNCTION perform_rls_maintenance()
RETURNS JSONB AS $$
DECLARE
    v_report JSONB;
BEGIN
    -- 1. Vacuum tables with RLS policies
    VACUUM ANALYZE public.tenants;
    VACUUM ANALYZE public.user_tenants;
    VACUUM ANALYZE public.profiles;
    VACUUM ANALYZE public.audit_logs;
    
    -- 2. Reindex critical indexes
    REINDEX INDEX CONCURRENTLY idx_user_tenants_user_status_active;
    REINDEX INDEX CONCURRENTLY idx_user_tenants_tenant_status_active;
    
    -- 3. Clean up old audit logs (keep 90 days)
    DELETE FROM public.audit_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- 4. Update statistics
    ANALYZE public.user_tenants;
    ANALYZE public.tenants;
    
    -- 5. Generate report
    v_report := jsonb_build_object(
        'maintenance_date', NOW(),
        'tables_vacuumed', 4,
        'indexes_rebuilt', 2,
        'audit_logs_cleaned', (
            SELECT COUNT(*) FROM public.audit_logs
            WHERE created_at < NOW() - INTERVAL '90 days'
        ),
        'health_check', (
            SELECT jsonb_agg(row_to_json(hd))
            FROM rls_health_dashboard hd
        )
    );
    
    -- Log maintenance
    INSERT INTO public.audit_logs (
        action, resource_type, changes
    ) VALUES (
        'maintenance_completed',
        'system',
        v_report
    );
    
    RETURN v_report;
END;
$$ LANGUAGE plpgsql;

-- Schedule weekly maintenance
SELECT cron.schedule(
    'weekly-rls-maintenance',
    '0 3 * * 0', -- Sunday at 3 AM
    'SELECT perform_rls_maintenance();'
);
```

### 2. Emergency Response Procedures

```sql
-- Emergency RLS disable (USE WITH EXTREME CAUTION)
CREATE OR REPLACE FUNCTION emergency_disable_rls(p_confirmation TEXT)
RETURNS TEXT AS $$
BEGIN
    IF p_confirmation != 'I understand this will expose all data' THEN
        RETURN 'Action cancelled - incorrect confirmation';
    END IF;
    
    -- Log the emergency action
    INSERT INTO public.audit_logs (
        action, resource_type, changes, user_id
    ) VALUES (
        'EMERGENCY_RLS_DISABLE',
        'system',
        jsonb_build_object(
            'reason', 'Emergency RLS disable',
            'timestamp', NOW(),
            'user', current_user
        ),
        auth.uid()
    );
    
    -- Disable RLS on critical tables
    ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.user_tenants DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
    
    RETURN 'RLS DISABLED - RE-ENABLE IMMEDIATELY AFTER FIXING ISSUE';
END;
$$ LANGUAGE plpgsql;

-- Emergency RLS re-enable
CREATE OR REPLACE FUNCTION emergency_enable_rls()
RETURNS TEXT AS $$
BEGIN
    -- Re-enable RLS
    ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
    
    -- Log the action
    INSERT INTO public.audit_logs (
        action, resource_type, changes, user_id
    ) VALUES (
        'EMERGENCY_RLS_ENABLE',
        'system',
        jsonb_build_object(
            'timestamp', NOW(),
            'user', current_user
        ),
        auth.uid()
    );
    
    RETURN 'RLS RE-ENABLED - Verify all policies are working';
END;
$$ LANGUAGE plpgsql;
```

## Troubleshooting Flowchart

```mermaid
graph TD
    A[406 Error Detected] --> B{Check RLS Status}
    B -->|Disabled| C[Enable RLS]
    B -->|Enabled| D{Check Policies}
    
    D -->|Missing| E[Apply Migration]
    D -->|Present| F{Check User Role}
    
    F -->|No Role| G[Assign User Role]
    F -->|Has Role| H{Check Tenant Assignment}
    
    H -->|Not Assigned| I[Add to Tenant]
    H -->|Assigned| J{Check Policy Logic}
    
    J -->|Incorrect| K[Fix Policy]
    J -->|Correct| L{Check Indexes}
    
    L -->|Missing| M[Add Indexes]
    L -->|Present| N[Check Query Plan]
    
    C --> O[Test Access]
    E --> O
    G --> O
    I --> O
    K --> O
    M --> O
    N --> P[Optimize Query]
    P --> O
    
    O -->|Success| Q[Monitor Performance]
    O -->|Failure| A
```

## Key Metrics to Track

### Daily Metrics
- Query response time (p50, p95, p99)
- RLS policy evaluation time
- Failed authentication attempts
- Cross-tenant access attempts (should be 0)

### Weekly Metrics
- Table growth rate
- Dead tuple percentage
- Index usage statistics
- Policy change frequency

### Monthly Metrics
- User activity patterns
- Tenant growth
- Performance degradation trends
- Security incident count

## Best Practices

1. **Never disable RLS in production** without a critical incident process
2. **Test all policy changes** in a staging environment first
3. **Monitor query performance** after any policy change
4. **Regular vacuum** of high-transaction tables
5. **Keep audit logs** for compliance (minimum 7 years for educational data)
6. **Document all policy changes** with ADRs (Architecture Decision Records)
7. **Regular security audits** of RLS policies (quarterly minimum)

## Contact Points

- **Critical Issues**: Immediately notify platform administrator
- **Performance Issues**: File ticket with database team
- **Policy Changes**: Require approval from security team
- **Audit Requests**: Coordinate with compliance team

## Appendix: Quick SQL Commands

```sql
-- Check current user's access
SELECT * FROM public.get_user_tenants_with_roles(auth.uid());

-- View all active policies
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test specific user access
SELECT public.test_rls_access('user@example.com');

-- Force statistics update
ANALYZE public.user_tenants;
ANALYZE public.tenants;

-- Check for lock issues
SELECT * FROM pg_locks 
WHERE NOT granted;

-- View current connections
SELECT pid, usename, application_name, state, query
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
```