-- Add admin_count to tenant statistics materialized view
DROP MATERIALIZED VIEW IF EXISTS tenant_statistics CASCADE;

CREATE MATERIALIZED VIEW tenant_statistics AS
SELECT 
    t.id as tenant_id,
    t.name,
    t.slug,
    t.description,
    t.status,
    t.subscription_tier,
    t.settings,
    t.created_at,
    t.updated_at,
    -- Domain count
    COUNT(DISTINCT td.domain_id) FILTER (WHERE td.is_active = true) as domain_count,
    -- Teacher count (active users with teacher role)
    COUNT(DISTINCT ut.user_id) FILTER (
        WHERE ut.status = 'active' 
        AND r.name = 'teacher'
    ) as teacher_count,
    -- Student count (active users with student role)
    COUNT(DISTINCT ut.user_id) FILTER (
        WHERE ut.status = 'active' 
        AND r.name = 'student'
    ) as student_count,
    -- Admin count (active users with tenant_admin role)
    COUNT(DISTINCT ut.user_id) FILTER (
        WHERE ut.status = 'active' 
        AND r.name = 'tenant_admin'
    ) as admin_count,
    -- Total active users
    COUNT(DISTINCT ut.user_id) FILTER (WHERE ut.status = 'active') as total_users,
    -- Last activity timestamp
    GREATEST(
        MAX(t.updated_at),
        MAX(ut.updated_at),
        MAX(td.updated_at)
    ) as last_activity
FROM tenants t
LEFT JOIN tenant_domains td ON t.id = td.tenant_id
LEFT JOIN user_tenants ut ON t.id = ut.tenant_id
LEFT JOIN roles r ON ut.role_id = r.id
GROUP BY t.id, t.name, t.slug, t.description, t.status, t.subscription_tier, t.settings, t.created_at, t.updated_at;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_tenant_statistics_tenant_id ON tenant_statistics(tenant_id);

-- Create composite indexes for common query patterns (updated to include admin_count)
CREATE INDEX idx_tenant_stats_composite ON tenant_statistics(
    status,
    domain_count DESC, 
    teacher_count DESC, 
    student_count DESC,
    admin_count DESC
);

-- Index for search
CREATE INDEX idx_tenant_stats_search ON tenant_statistics 
    USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Index for sorting
CREATE INDEX idx_tenant_stats_name ON tenant_statistics(name);
CREATE INDEX idx_tenant_stats_created ON tenant_statistics(created_at DESC);
CREATE INDEX idx_tenant_stats_activity ON tenant_statistics(last_activity DESC);