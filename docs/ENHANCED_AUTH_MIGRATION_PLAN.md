# Enhanced Authentication System - Migration Plan

## Overview
This document outlines the migration strategy from the current authentication system to the enhanced multi-tenant RBAC system for the Gemeos platform.

## Architecture Summary

### Database Schema Changes

#### New Tables Created
1. **tenants** - Organizations/institutions using the platform
2. **user_tenants** - Many-to-many relationship between users and tenants with roles
3. **roles** - Flexible role definitions with hierarchy
4. **permissions** - Granular permission definitions
5. **role_permissions** - Role-permission mappings
6. **tenant_domains** - Domain availability per tenant
7. **audit_logs** - Comprehensive audit trail

#### Modified Tables
- **profiles** - Added `primary_tenant_id` and `is_platform_admin` columns
- **teacher_domains** - Added `tenant_id` column for multi-tenancy

### Security Implementation

#### Row Level Security (RLS)
- All new tables have RLS enabled
- Policies enforce tenant isolation
- Hierarchical role access (Platform Admin > Tenant Admin > Teacher > Student)

#### Permission Model
- Resource-based permissions (users, domains, concepts, etc.)
- Action-based permissions (create, read, update, delete, etc.)
- Tenant-scoped and global permissions

## Migration Steps

### Phase 1: Database Migration (Immediate)

1. **Run the migration SQL**
   ```bash
   supabase migration new enhanced_auth_system
   # Copy the SQL from /supabase/migrations/20250904_enhanced_auth_system.sql
   supabase db push
   ```

2. **Verify migration**
   - Check all tables are created
   - Verify existing data is migrated to default tenant
   - Confirm RLS policies are active

### Phase 2: Backend Integration (Day 1-2)

1. **Update Supabase Types**
   ```bash
   supabase gen types typescript --local > src/integrations/supabase/types.ts
   ```

2. **Integrate Auth Service**
   - Import `authService` in relevant components
   - Replace existing auth checks with new service methods

3. **Update API Endpoints**
   - Add tenant_id to all queries
   - Implement permission checks in Edge Functions

### Phase 3: Frontend Implementation (Day 2-3)

1. **Wrap App with AuthProvider**
   ```tsx
   // In App.tsx or main.tsx
   import { AuthProvider } from '@/hooks/useAuth';
   
   <AuthProvider>
     <App />
   </AuthProvider>
   ```

2. **Update Components**
   - Replace role checks with permission hooks
   - Add tenant context to data fetching
   - Implement tenant switcher UI

3. **Protected Routes**
   ```tsx
   // Example usage
   function ProtectedPage() {
     const { authorized, loading } = useAuthGuard({
       requiredRole: 'teacher',
       redirectTo: '/unauthorized'
     });
     
     if (loading) return <LoadingSpinner />;
     if (!authorized) return null;
     
     return <PageContent />;
   }
   ```

### Phase 4: Testing (Day 3-4)

1. **Test Matrix**
   - Platform Admin: Full system access
   - Tenant Admin: Tenant-wide access
   - Teacher: Domain-specific access
   - Student: Learning material access

2. **Test Scenarios**
   - User login and session management
   - Tenant switching
   - Permission enforcement
   - Data isolation between tenants
   - Audit log creation

### Phase 5: Data Migration (Day 4)

1. **Create Initial Tenants**
   ```sql
   -- Example: Create tenants for existing organizations
   INSERT INTO tenants (name, slug, description, status)
   VALUES 
     ('Demo School', 'demo-school', 'Demo tenant for testing', 'active'),
     ('Music Academy', 'music-academy', 'Professional music education', 'active');
   ```

2. **Assign Users to Tenants**
   - Run migration function: `SELECT public.migrate_existing_users_to_tenant_system();`
   - Manually assign specific users to additional tenants if needed

3. **Configure Tenant Domains**
   ```sql
   -- Assign domains to tenants
   INSERT INTO tenant_domains (tenant_id, domain_id, is_active)
   SELECT t.id, 'music', true
   FROM tenants t WHERE t.slug = 'music-academy';
   ```

## Code Examples

### Checking Permissions
```typescript
// In a React component
import { usePermission } from '@/hooks/useAuth';

function ConceptManager() {
  const canCreateConcepts = usePermission('concepts', 'create');
  const canDeleteConcepts = usePermission('concepts', 'delete');
  
  return (
    <div>
      {canCreateConcepts && <CreateConceptButton />}
      {canDeleteConcepts && <DeleteConceptButton />}
    </div>
  );
}
```

### Tenant-Scoped Queries
```typescript
// In a data fetching hook
import { authService } from '@/services/auth.service';
import { supabase } from '@/integrations/supabase/client';

async function fetchTenantConcepts() {
  const tenantId = authService.getCurrentTenantId();
  
  const { data, error } = await supabase
    .from('concepts')
    .select('*')
    .eq('tenant_id', tenantId);
    
  return data;
}
```

### Audit Logging
```typescript
// In an action handler
import { useAuditLog } from '@/hooks/useAuth';

function ConceptEditor() {
  const { logAction } = useAuditLog();
  
  const handleUpdate = async (conceptId: string, updates: any) => {
    // Update concept
    await updateConcept(conceptId, updates);
    
    // Log the action
    await logAction('update', 'concept', conceptId, updates);
  };
}
```

## Performance Considerations

### Indexes Created
- `idx_tenants_slug` - Fast tenant lookup
- `idx_user_tenants_lookup` - Composite index for user-tenant queries
- `idx_role_permissions_lookup` - Fast permission checks
- `idx_audit_logs_datetime` - Efficient audit log queries

### Caching Strategy
- Permission cache in AuthService (cleared on tenant switch)
- LocalStorage for current tenant ID
- Session data cached in React context

## Security Checklist

- [ ] All tables have RLS enabled
- [ ] Platform Admin role properly restricted
- [ ] Tenant isolation verified
- [ ] API endpoints check permissions
- [ ] Audit logging implemented for sensitive actions
- [ ] Session management secure
- [ ] Permission cache invalidation working

## Rollback Plan

If issues arise, rollback procedure:

1. **Database Rollback**
   ```sql
   -- Remove new foreign keys
   ALTER TABLE profiles DROP COLUMN primary_tenant_id;
   ALTER TABLE profiles DROP COLUMN is_platform_admin;
   ALTER TABLE teacher_domains DROP COLUMN tenant_id;
   
   -- Drop new tables (in reverse order of dependencies)
   DROP TABLE IF EXISTS audit_logs CASCADE;
   DROP TABLE IF EXISTS tenant_domains CASCADE;
   DROP TABLE IF EXISTS role_permissions CASCADE;
   DROP TABLE IF EXISTS permissions CASCADE;
   DROP TABLE IF EXISTS user_tenants CASCADE;
   DROP TABLE IF EXISTS roles CASCADE;
   DROP TABLE IF EXISTS tenants CASCADE;
   ```

2. **Code Rollback**
   - Revert to previous git commit
   - Restore original auth implementation

## Monitoring & Success Metrics

### Key Metrics to Track
- Login success rate
- Permission check performance (<50ms)
- Tenant switching time (<1s)
- Audit log volume
- RLS policy violations (should be 0)

### Success Criteria
- Zero unauthorized data access
- All existing functionality maintained
- Performance within acceptable limits
- Successful tenant isolation
- Complete audit trail

## Support & Troubleshooting

### Common Issues

1. **"Permission Denied" Errors**
   - Check user's role in current tenant
   - Verify RLS policies
   - Check permission assignments

2. **Slow Permission Checks**
   - Review indexes
   - Check cache implementation
   - Optimize RLS policies

3. **Tenant Data Leakage**
   - Audit RLS policies
   - Check all queries include tenant_id
   - Review permission hierarchy

### Debug Helpers

```typescript
// Log current auth state
const { session, tenantContext } = useAuth();
console.log('Current session:', session);
console.log('Tenant context:', tenantContext);

// Check specific permission
const hasPermission = await authService.hasPermission('concepts', 'create');
console.log('Can create concepts:', hasPermission);

// View audit logs
const logs = await authService.getAuditLogs({ 
  resource_type: 'concepts',
  start_date: new Date(Date.now() - 86400000) // Last 24 hours
});
console.log('Recent concept actions:', logs);
```

## Next Steps

1. Review and approve migration plan
2. Schedule migration window
3. Backup current database
4. Execute migration
5. Verify all functionality
6. Monitor for issues
7. Document any custom configurations

## Contact

For questions or issues during migration:
- Technical Lead: [Contact Info]
- Database Admin: [Contact Info]
- Security Team: [Contact Info]