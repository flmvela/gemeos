# Multi-Tenant Educational Platform Database Architecture

## Executive Summary

This document outlines the complete database schema architecture for a multi-tenant educational platform built on Supabase/PostgreSQL. The architecture implements a robust, scalable, and secure foundation supporting role-based access control (RBAC), tenant isolation, and comprehensive audit logging.

## Architecture Overview

### Design Principles

1. **Multi-Tenancy**: Shared database with row-level tenant isolation
2. **Security First**: Row Level Security (RLS) policies enforce data access boundaries
3. **Scalability**: Optimized indexes and partitioning-ready design
4. **Auditability**: Comprehensive audit logging for compliance
5. **Flexibility**: JSONB fields for extensible metadata

### Technology Stack

- **Database**: PostgreSQL 14+ (via Supabase)
- **Authentication**: Supabase Auth (auth.users)
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage for file attachments

## Database Schema

### Core Tables

#### 1. **tenants**
Central table for organization/company data.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Organization name |
| slug | VARCHAR(100) | URL-friendly identifier |
| status | ENUM | active, suspended, trial, inactive |
| subscription_tier | ENUM | free, basic, premium, enterprise |
| max_users | INTEGER | User limit per subscription |
| max_domains | INTEGER | Domain limit per subscription |
| settings | JSONB | Flexible configuration storage |

**Key Features:**
- Slug-based routing for tenant-specific URLs
- Subscription tier enforcement
- Soft delete via status field

#### 2. **roles**
System-wide role definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(50) | System identifier |
| display_name | VARCHAR(100) | User-friendly name |
| hierarchy_level | INTEGER | Role precedence (0=highest) |
| is_system_role | BOOLEAN | Protected system roles |

**Predefined Roles:**
- platform_admin (level 0): Full system access
- tenant_admin (level 10): Tenant management
- teacher (level 20): Course and student management
- student (level 30): Learning access

#### 3. **user_tenants**
Many-to-many relationship with role assignment.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| tenant_id | UUID | References tenants |
| role_id | UUID | References roles |
| is_primary | BOOLEAN | User's default tenant |
| status | ENUM | active, invited, suspended, inactive |
| joined_at | TIMESTAMPTZ | Actual join timestamp |

**Key Constraints:**
- Unique(user_id, tenant_id): One role per user per tenant
- Trigger ensures single primary tenant per user

#### 4. **invitations**
Manages user onboarding flow.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Invitee email |
| tenant_id | UUID | Target tenant |
| role_id | UUID | Assigned role |
| status | ENUM | pending, accepted, expired, cancelled |
| expires_at | TIMESTAMPTZ | Invitation expiration |
| invitation_token | VARCHAR(255) | Secure acceptance token |
| invited_by | UUID | Inviter user ID |

**Security Features:**
- Cryptographically secure tokens
- Automatic expiration handling
- Email validation

#### 5. **domains**
Learning domains/subjects hierarchy.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Domain name |
| parent_domain_id | UUID | Hierarchical structure |
| icon_name | VARCHAR(100) | UI icon identifier |
| metadata | JSONB | Extensible properties |

#### 6. **tenant_domains**
Domain assignments with limits.

| Column | Type | Description |
|--------|------|-------------|
| tenant_id | UUID | References tenants |
| domain_id | UUID | References domains |
| max_teachers | INTEGER | Teacher limit for domain |
| max_students | INTEGER | Student limit for domain |
| is_active | BOOLEAN | Enable/disable without deletion |

### Security Architecture

#### Row Level Security (RLS)

**Implementation Strategy:**
1. All tables have RLS enabled by default
2. Policies use helper functions for performance
3. Hierarchical access (platform_admin > tenant_admin > teacher > student)

**Key Policies:**

```sql
-- Example: Users can only see their tenant's data
CREATE POLICY "Users can view their tenant data" ON table_name
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_tenants
            WHERE tenant_id = table_name.tenant_id
            AND user_id = auth.uid()
            AND status = 'active'
        )
    );
```

#### Permission System

**Granular Permissions:**
- Resource-based (users, domains, concepts, etc.)
- Action-based (create, read, update, delete, etc.)
- Role-permission mapping with optional tenant scope

**Permission Check Function:**
```sql
SELECT public.check_permission(
    user_id, 
    tenant_id, 
    'resource', 
    'action'
);
```

### Performance Optimization

#### Indexes

**Strategic Index Placement:**
1. Foreign key columns (automatic)
2. Frequently queried columns (status, slug)
3. Full-text search (GIN indexes with pg_trgm)
4. Composite indexes for common JOIN patterns

```sql
-- Example composite index
CREATE INDEX idx_user_tenants_lookup 
ON user_tenants(user_id, tenant_id, status);
```

#### Query Optimization

**Best Practices:**
1. Use EXISTS instead of IN for subqueries
2. Leverage JSONB operators for metadata queries
3. Partition audit_logs by created_at (future)

### Audit and Compliance

#### Audit Logging

**Comprehensive Tracking:**
- All CUD operations logged automatically
- IP address and user agent capture
- JSONB change tracking (old vs new values)

```sql
-- Automatic audit trigger
CREATE TRIGGER audit_changes
    AFTER INSERT OR UPDATE OR DELETE ON table_name
    FOR EACH ROW EXECUTE FUNCTION audit_table_changes();
```

#### Data Retention

**Strategies:**
1. Soft deletes (status fields)
2. Audit log retention policies
3. GDPR compliance helpers

### Migration Strategy

#### Deployment Order

1. **Core Schema** (20250904100000): Tables and basic structure
2. **RLS Policies** (20250904100100): Security layer
3. **Triggers** (20250904100200): Business logic automation
4. **Permissions** (20250904100300): RBAC system
5. **Test Data** (20250904100400): Development data (optional)

#### Applying Migrations

```bash
# Local development
supabase db reset
supabase migration up

# Production
supabase db push
```

#### Rollback Strategy

Each migration includes rollback considerations:
```sql
-- At the end of each migration file
-- ROLLBACK: DROP TABLE IF EXISTS table_name CASCADE;
```

### Integration Points

#### Frontend Services

**TypeScript Interfaces:**
```typescript
interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  subscription_tier: SubscriptionTier;
}
```

**Service Layer:**
- tenant.service.ts: Tenant CRUD operations
- invitation.service.ts: User onboarding
- domain-assignment.service.ts: Domain management

#### Supabase Edge Functions

**Key Functions:**
- User provisioning webhooks
- Invitation email triggers
- Subscription tier enforcement
- Audit log aggregation

### Monitoring and Maintenance

#### Health Checks

```sql
-- Check tenant limits
SELECT * FROM get_tenant_statistics(tenant_id);

-- Find expired invitations
SELECT cleanup_expired_invitations();

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'tenants';
```

#### Performance Monitoring

**Key Metrics:**
1. Query execution time (pg_stat_statements)
2. Index usage (pg_stat_user_indexes)
3. Table bloat (autovacuum tuning)
4. Connection pool utilization

### Security Considerations

#### Best Practices

1. **Never disable RLS** in production
2. **Use SECURITY DEFINER** functions carefully
3. **Validate all user inputs** at database level
4. **Encrypt sensitive data** (PII, credentials)
5. **Regular security audits** of policies

#### Common Pitfalls

1. Forgetting RLS on new tables
2. Overly permissive policies
3. Missing indexes on foreign keys
4. Infinite loops in triggers
5. Unhandled NULL values in policies

### Future Enhancements

#### Planned Features

1. **Table Partitioning**: Audit logs by month
2. **Read Replicas**: Scale read operations
3. **Caching Layer**: Redis for session data
4. **Event Sourcing**: Complete state history
5. **GraphQL Interface**: Alternative API layer

#### Scalability Path

1. **Phase 1** (Current): Single database, RLS isolation
2. **Phase 2**: Read replicas, connection pooling
3. **Phase 3**: Horizontal sharding by tenant_id
4. **Phase 4**: Microservices with separate databases

## Conclusion

This database architecture provides a solid foundation for a multi-tenant educational platform with:

- **Security**: Row-level isolation and comprehensive RBAC
- **Scalability**: Optimized for growth with clear upgrade path
- **Maintainability**: Clear structure with extensive documentation
- **Compliance**: Full audit trail and data governance

The schema is production-ready and supports all frontend functionality while maintaining data integrity and security.