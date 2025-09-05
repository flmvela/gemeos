# Enhanced Authentication System - Implementation Plan

**Task:** Enhanced Authentication System (P0 - Foundation Blocker)  
**Assignee:** TDD-Software-Engineer + Solution-Architect  
**Sprint:** Sprint 1  
**Status:** IN_PROGRESS  

## Current System Analysis

### Existing Authentication Infrastructure ✅
```typescript
// Current auth system capabilities:
- Supabase Auth integration (useAuth.ts)
- Basic user session management  
- Role detection from JWT app_metadata
- Route protection (RouteProtection.tsx)
- Page-based permissions system (usePagePermissions.ts)
```

### Current Database Schema ✅
```sql
-- Already exists:
- pages (id, path, description)
- page_permissions (id, page_id, role, is_active)
```

### Gaps Identified 🔍
1. **Missing multi-tenant role structure** - Currently only basic role in app_metadata
2. **No tenant isolation** - No tenant context in user sessions
3. **Limited role definitions** - Need Platform Admin, Tenant Admin, Teacher, Student
4. **No permission audit trail** - No logging of authentication events
5. **No tenant-specific permissions** - Page permissions not tenant-scoped

## Implementation Strategy

### Phase 1: Database Schema Enhancement (Days 1-2)
**Architect:** Solution-Architect  
**Developer:** TDD-Software-Engineer

#### 1.1 Create Multi-Tenant Role Tables
```sql
-- New tables to implement:
-- tenants (if not exists)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_roles (replaces simple app_metadata role)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'platform_admin', 'tenant_admin', 'teacher', 'student'
  is_active BOOLEAN DEFAULT true,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, tenant_id, role)
);

-- permissions (granular permissions)
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(100) NOT NULL, -- 'concepts', 'domains', 'users', etc.
  action VARCHAR(50) NOT NULL,    -- 'create', 'read', 'update', 'delete'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- role_permissions (map roles to permissions)
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,
  permission_id UUID REFERENCES permissions(id),
  tenant_id UUID REFERENCES tenants(id), -- NULL for platform-wide
  UNIQUE(role, permission_id, tenant_id)
);

-- auth_audit_log (security audit trail)
CREATE TABLE auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  tenant_id UUID REFERENCES tenants(id),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 1.2 Row Level Security Policies
```sql
-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Platform admin can see everything
CREATE POLICY platform_admin_all_access ON user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'platform_admin' 
      AND ur.is_active = true
    )
  );

-- Tenant admin can only see their tenant
CREATE POLICY tenant_admin_tenant_access ON user_roles
  FOR ALL USING (
    tenant_id IN (
      SELECT ur.tenant_id FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'tenant_admin' 
      AND ur.is_active = true
    )
  );

-- Users can see their own roles
CREATE POLICY user_own_roles ON user_roles
  FOR SELECT USING (user_id = auth.uid());
```

### Phase 2: Enhanced Authentication Hooks (Days 2-3)
**Developer:** TDD-Software-Engineer (TDD Approach)

#### 2.1 Enhanced useAuth Hook
```typescript
// Enhanced useAuth.ts implementation
export interface UserRole {
  id: string;
  user_id: string;
  tenant_id: string;
  role: 'platform_admin' | 'tenant_admin' | 'teacher' | 'student';
  is_active: boolean;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [currentTenant, setCurrentTenant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Enhanced methods:
  const getUserRoles = () => roles;
  const getCurrentTenant = () => currentTenant;
  const switchTenant = (tenantId: string) => setCurrentTenant(tenantId);
  const hasRole = (role: string, tenantId?: string) => {
    return roles.some(r => 
      r.role === role && 
      r.is_active && 
      (!tenantId || r.tenant_id === tenantId)
    );
  };
  const isPlatformAdmin = () => hasRole('platform_admin');
  const isTenantAdmin = (tenantId?: string) => hasRole('tenant_admin', tenantId);
  const isTeacher = (tenantId?: string) => hasRole('teacher', tenantId);
  const isStudent = (tenantId?: string) => hasRole('student', tenantId);
  
  // Return enhanced interface
  return {
    user,
    session, 
    roles,
    currentTenant,
    loading,
    isAuthenticated: !!user,
    getUserRoles,
    getCurrentTenant,
    switchTenant,
    hasRole,
    isPlatformAdmin,
    isTenantAdmin,
    isTeacher,
    isStudent,
    logout
  };
};
```

#### 2.2 Test-Driven Development Approach
```typescript
// Tests to write FIRST (TDD):

// __tests__/useAuth.test.ts
describe('useAuth Enhanced', () => {
  test('should detect platform admin role correctly', () => {
    // Test platform admin can access all tenants
  });
  
  test('should enforce tenant isolation for tenant admin', () => {
    // Test tenant admin only sees their tenant
  });
  
  test('should handle role switching for platform admin', () => {
    // Test switching between tenant contexts
  });
  
  test('should validate JWT token enhancements', () => {
    // Test JWT contains proper role/tenant claims
  });
});

// __tests__/RouteProtection.test.ts  
describe('Enhanced Route Protection', () => {
  test('should protect routes based on roles and tenant context', () => {
    // Test role-based route protection
  });
});
```

### Phase 3: JWT Token Enhancement (Day 3)
**Developer:** TDD-Software-Engineer

#### 3.1 Supabase Auth Hooks Integration
```sql
-- Custom claims function for JWT enhancement
CREATE OR REPLACE FUNCTION auth.jwt_claims_with_roles(user_id UUID)
RETURNS JSONB
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    COALESCE(
      jsonb_build_object(
        'roles', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'role', ur.role,
              'tenant_id', ur.tenant_id,
              'tenant_slug', t.slug,
              'is_active', ur.is_active
            )
          )
          FROM user_roles ur
          JOIN tenants t ON t.id = ur.tenant_id
          WHERE ur.user_id = user_id AND ur.is_active = true
        )
      ),
      '{}'::JSONB
    );
$$;

-- Hook to populate JWT claims  
CREATE OR REPLACE FUNCTION auth.populate_jwt_claims()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  -- Add custom claims to JWT
  NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}');
  NEW.raw_app_meta_data = NEW.raw_app_meta_data || auth.jwt_claims_with_roles(NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_jwt_claims
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.populate_jwt_claims();
```

### Phase 4: Enhanced Route Protection (Days 3-4)
**Developer:** TDD-Software-Engineer

#### 4.1 Role-Based Route Protection Component
```typescript
// Enhanced RouteProtection.tsx
interface RouteProtectionProps {
  children: ReactNode;
  requiredRoles?: string[];
  requiredTenant?: string;
  fallbackPath?: string;
}

export const RouteProtection = ({ 
  children, 
  requiredRoles = [],
  requiredTenant,
  fallbackPath = '/unauthorized' 
}: RouteProtectionProps) => {
  const { user, roles, hasRole, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  
  // Check role-based access
  const hasAccess = requiredRoles.length === 0 || 
    requiredRoles.some(role => hasRole(role, requiredTenant));
    
  if (!hasAccess) {
    return <Navigate to={fallbackPath} />;
  }
  
  return <>{children}</>;
};

// Usage examples:
<RouteProtection requiredRoles={['platform_admin']}>
  <PlatformAdminDashboard />
</RouteProtection>

<RouteProtection requiredRoles={['tenant_admin']} requiredTenant="tenant-123">
  <TenantAdminDashboard />
</RouteProtection>
```

#### 4.2 Permission-Based Component Protection
```typescript
// New component: PermissionGate.tsx
interface PermissionGateProps {
  children: ReactNode;
  resource: string;
  action: string;
  tenantId?: string;
  fallback?: ReactNode;
}

export const PermissionGate = ({ 
  children, 
  resource, 
  action, 
  tenantId,
  fallback = null 
}: PermissionGateProps) => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission(resource, action, tenantId)) {
    return fallback;
  }
  
  return <>{children}</>;
};
```

### Phase 5: Migration and Testing (Days 4-5)
**Developer:** TDD-Software-Engineer  
**Tester:** Assigned Tester

#### 5.1 Data Migration Strategy
```sql
-- Migration script: 001_enhanced_auth.sql
-- 1. Create new tables (from Phase 1)
-- 2. Migrate existing data
-- 3. Update existing role references

-- Migrate existing users to new role system
INSERT INTO user_roles (user_id, tenant_id, role, granted_at)
SELECT 
  u.id as user_id,
  -- Assign default tenant or create logic for tenant assignment
  '00000000-0000-0000-0000-000000000000'::uuid as tenant_id,
  COALESCE(u.raw_app_meta_data->>'role', 'student') as role,
  NOW() as granted_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
);
```

#### 5.2 Testing Strategy
```typescript
// Integration tests
describe('Enhanced Authentication Integration', () => {
  test('E2E: Platform admin can access all tenant data', async () => {
    // Full authentication flow test
  });
  
  test('E2E: Tenant admin restricted to their tenant', async () => {
    // Tenant isolation test
  });
  
  test('E2E: Role switching works for platform admin', async () => {
    // Role switching test
  });
  
  test('Security: Privilege escalation prevention', async () => {
    // Security test
  });
});
```

## Implementation Timeline

### Day 1 (Sept 3)
- [ ] Solution Architect: Design database schema
- [ ] TDD Engineer: Write comprehensive test suite
- [ ] Database migration scripts preparation

### Day 2 (Sept 4) 
- [ ] Execute database migrations
- [ ] Implement enhanced useAuth hook (TDD)
- [ ] Begin JWT token enhancement

### Day 3 (Sept 5)
- [ ] Complete JWT token enhancement
- [ ] Implement enhanced RouteProtection
- [ ] Create PermissionGate component

### Day 4 (Sept 6)
- [ ] Integration testing
- [ ] Security testing
- [ ] Performance validation

### Day 5 (Sept 7)
- [ ] Final testing and bug fixes
- [ ] Documentation updates
- [ ] Code review and approval

## Dependencies for Next Tasks

### Enables Tenant Admin Role Implementation (P1)
- User role system with tenant context ✓
- Tenant-scoped permissions ✓  
- Admin role validation ✓

### Enables Email Notification Service (P2)
- User management system for invitations ✓
- Tenant context for email templating ✓
- Role-based email permissions ✓

## Risk Mitigation

### Database Migration Risk
- **Mitigation:** Staged rollout, backup/restore procedures
- **Rollback:** Revert migration scripts prepared

### JWT Token Size Risk  
- **Mitigation:** Optimize claims structure, lazy loading
- **Monitoring:** Token size validation in tests

### Performance Impact Risk
- **Mitigation:** Database indexing, query optimization
- **Monitoring:** Performance benchmarking required

## Success Criteria

- [ ] All 4 user roles implemented and functional
- [ ] JWT tokens include role and tenant claims
- [ ] Route protection enforces role-based access
- [ ] Tenant data isolation verified
- [ ] Test coverage >95% for authentication components
- [ ] Security audit passed (privilege escalation tests)
- [ ] Performance benchmarks met (<200ms token validation)
- [ ] Migration completed without data loss

---

**Next Steps:** 
1. Solution Architect review and approval of database design
2. TDD Engineer to begin test suite implementation
3. Daily standup coordination with Sprint 1 team