# Gemeos Multi-Tenant Platform - Architecture Design Document

## Executive Summary

This document presents a comprehensive technical architecture for transforming Gemeos from a single-tenant to a multi-tenant educational platform. The design leverages existing infrastructure (Supabase, Google Cloud) while introducing robust tenant isolation, content inheritance, and scalability features.

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Platform Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Platform Admin Dashboard │ Standard Content Management        │
│  Tenant Management        │ Global Analytics                   │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                   Multi-Tenant Application Layer                │
├─────────────────────────────────────────────────────────────────┤
│  Tenant A          │  Tenant B          │  Tenant C            │
│  ┌───────────────┐ │  ┌───────────────┐ │  ┌───────────────┐   │
│  │ Admin Panel   │ │  │ Admin Panel   │ │  │ Admin Panel   │   │
│  │ Teacher Portal│ │  │ Teacher Portal│ │  │ Teacher Portal│   │
│  │ Student Portal│ │  │ Student Portal│ │  │ Student Portal│   │
│  └───────────────┘ │  └───────────────┘ │  └───────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                    Service Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  Auth Service     │  Content Service   │  File Processing      │
│  Tenant Service   │  Class Service     │  Notification Service │
│  User Service     │  Analytics Service │  Audit Service        │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer                                   │
├─────────────────────────────────────────────────────────────────┤
│  Supabase (Multi-tenant DB)  │  Google Cloud Storage           │
│  Row-Level Security          │  Tenant-specific buckets        │
│  Event Store                 │  Content Delivery Network       │
└─────────────────────────────────────────────────────────────────┘
```

## Data Architecture

### Multi-Tenant Data Model

#### Core Tables Structure

```sql
-- Platform-level tables
CREATE TABLE platforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE NOT NULL,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenant management
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    subdomain TEXT UNIQUE,
    config JSONB DEFAULT '{}',
    status tenant_status DEFAULT 'active',
    subscription_tier TEXT DEFAULT 'basic',
    user_limit INTEGER DEFAULT 100,
    storage_limit_gb INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced user profiles with tenant context
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT NOT NULL,
    grade_level TEXT,
    department TEXT,
    active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- Standard domains (platform-level)
CREATE TABLE standard_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    subject_area TEXT,
    grade_levels TEXT[],
    metadata JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    status content_status DEFAULT 'draft',
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenant domain enablement
CREATE TABLE tenant_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    standard_domain_id UUID REFERENCES standard_domains(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    custom_name TEXT,
    custom_config JSONB DEFAULT '{}',
    enabled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    enabled_by UUID REFERENCES user_profiles(id),
    UNIQUE(tenant_id, standard_domain_id)
);

-- Content hierarchy with inheritance
CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    domain_id UUID, -- Can reference standard_domains or tenant_domains
    parent_id UUID REFERENCES content_items(id),
    content_type content_type_enum NOT NULL, -- concept, learning_goal, exercise
    title TEXT NOT NULL,
    description TEXT,
    content JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    source_type source_type_enum DEFAULT 'custom', -- standard, inherited, custom
    source_id UUID, -- Reference to original if inherited/customized
    status content_status DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes and enrollment
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    grade_level TEXT,
    class_code TEXT UNIQUE NOT NULL,
    domain_ids UUID[],
    capacity INTEGER DEFAULT 30,
    status class_status DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    schedule JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE class_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    status enrollment_status DEFAULT 'active',
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(class_id, student_id)
);
```

#### Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation ON user_profiles
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant_id')::UUID
        OR current_setting('app.current_user_role') = 'platform_admin'
    );

-- Content access policy
CREATE POLICY content_access ON content_items
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant_id')::UUID
        OR source_type = 'standard'
        OR current_setting('app.current_user_role') = 'platform_admin'
    );

-- Class access policy
CREATE POLICY class_access ON classes
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant_id')::UUID
        AND (
            teacher_id = current_setting('app.current_user_id')::UUID
            OR current_setting('app.current_user_role') IN ('tenant_admin', 'platform_admin')
            OR EXISTS (
                SELECT 1 FROM class_enrollments 
                WHERE class_id = classes.id 
                AND student_id = current_setting('app.current_user_id')::UUID
            )
        )
    );
```

### Content Inheritance Model

```
Platform Standard Content
         │
         ▼
Tenant Enabled Domains
         │
         ▼
Tenant Custom Content ──► Teacher Customizations
         │                       │
         ▼                       ▼
     Classes ◄─────── Student Access
```

**Inheritance Rules:**
1. **Platform → Tenant**: Standard content available to all tenants, can be customized
2. **Tenant → Teacher**: Tenant content can be forked and modified by teachers
3. **Teacher → Class**: Teacher content is available to enrolled students
4. **Version Control**: All content changes are versioned with rollback capability

## Service Architecture

### Microservices Decomposition

#### 1. Authentication & Authorization Service
```typescript
// Enhanced auth with tenant context
interface AuthContext {
  userId: string;
  tenantId: string;
  role: UserRole;
  permissions: string[];
  sessionId: string;
}

class AuthService {
  async authenticateWithTenant(token: string, tenantSlug: string): Promise<AuthContext>
  async validatePermission(context: AuthContext, resource: string, action: string): Promise<boolean>
  async refreshToken(context: AuthContext): Promise<string>
}
```

#### 2. Tenant Management Service
```typescript
interface TenantService {
  async createTenant(data: CreateTenantRequest): Promise<Tenant>
  async updateTenantConfig(tenantId: string, config: TenantConfig): Promise<void>
  async getTenantMetrics(tenantId: string): Promise<TenantMetrics>
  async suspendTenant(tenantId: string, reason: string): Promise<void>
}
```

#### 3. Content Management Service
```typescript
interface ContentService {
  async getStandardContent(domainId: string): Promise<ContentItem[]>
  async createTenantContent(tenantId: string, content: CreateContentRequest): Promise<ContentItem>
  async inheritContent(tenantId: string, sourceId: string, customizations: any): Promise<ContentItem>
  async publishContent(contentId: string, version: number): Promise<void>
}
```

#### 4. File Processing Service (Enhanced)
```python
# Enhanced preprocessor with tenant context
class TenantAwarePreprocessor:
    def process_file_upload(self, file_info: dict) -> dict:
        tenant_context = self.extract_tenant_context(file_info['metadata'])
        
        # Process with tenant isolation
        extracted_content = self.extract_content(file_info['file_path'])
        
        # Store with tenant context
        record = self.store_extracted_content(
            content=extracted_content,
            tenant_id=tenant_context['tenant_id'],
            domain_id=tenant_context['domain_id']
        )
        
        # Publish to tenant-specific topic
        self.publish_extraction_request(record, tenant_context)
        
        return record
```

### API Gateway & Routing

```nginx
# Tenant routing configuration
server {
    listen 443 ssl;
    server_name *.gemeos.com;
    
    location / {
        # Extract tenant from subdomain
        set $tenant "";
        if ($host ~* "^(.+)\.gemeos\.com$") {
            set $tenant $1;
        }
        
        # Add tenant header
        proxy_set_header X-Tenant-Slug $tenant;
        proxy_pass http://app-backend;
    }
}
```

## Security Architecture

### Tenant Isolation Strategy

#### 1. Data Isolation
- **Database**: Row-Level Security with tenant_id filtering
- **Storage**: Tenant-specific GCS bucket prefixes
- **Caching**: Tenant-aware cache keys
- **API**: Request-level tenant context validation

#### 2. Authentication & Authorization
```typescript
// Tenant-aware middleware
export const tenantAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const tenantSlug = req.headers['x-tenant-slug'] || req.subdomain;
  const authToken = req.headers['authorization'];
  
  // Validate tenant exists and is active
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant || tenant.status !== 'active') {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  // Authenticate user within tenant context
  const authContext = await authenticateWithTenant(authToken, tenant.id);
  
  // Set database session variables for RLS
  await setSessionContext({
    'app.current_tenant_id': tenant.id,
    'app.current_user_id': authContext.userId,
    'app.current_user_role': authContext.role
  });
  
  req.tenantContext = { tenant, user: authContext };
  next();
};
```

#### 3. Data Privacy & GDPR Compliance
```typescript
interface PrivacyService {
  // Right to be forgotten
  async deleteUserData(userId: string, tenantId: string): Promise<void> {
    // Soft delete with 30-day retention
    await this.softDeleteUserData(userId, tenantId);
    
    // Schedule hard deletion
    await this.scheduleHardDeletion(userId, tenantId, 30);
    
    // Anonymize audit logs
    await this.anonymizeAuditLogs(userId, tenantId);
    
    // Generate deletion certificate
    return this.generateDeletionCertificate(userId, tenantId);
  }
  
  // Data portability
  async exportUserData(userId: string, tenantId: string): Promise<DataExport> {
    return {
      profile: await this.getUserProfile(userId, tenantId),
      content: await this.getUserContent(userId, tenantId),
      progress: await this.getUserProgress(userId, tenantId),
      classes: await this.getUserClasses(userId, tenantId)
    };
  }
}
```

## Technology Stack

### Current vs. Proposed

| Component | Current | Proposed Enhancement |
|-----------|---------|---------------------|
| **Frontend** | React + TypeScript | React + TypeScript + Tenant Context |
| **Backend** | Supabase Edge Functions | Enhanced + Microservices |
| **Database** | Supabase PostgreSQL | Supabase + RLS + Multi-tenant Schema |
| **Authentication** | Supabase Auth | Supabase Auth + Tenant Context |
| **Storage** | Google Cloud Storage | GCS + Tenant Isolation |
| **Processing** | Cloud Run + Pub/Sub | Enhanced with Tenant Awareness |
| **Monitoring** | Basic | Google Cloud Operations Suite |
| **CDN** | None | Google Cloud CDN |
| **Load Balancer** | None | Google Cloud Load Balancer |

### New Components

#### 1. Tenant Management API
```dockerfile
# Dockerfile for tenant management service
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

#### 2. Content Inheritance Engine
```typescript
class ContentInheritanceEngine {
  async syncStandardContentUpdates(domainId: string): Promise<void> {
    const tenants = await this.getTenantsWithDomain(domainId);
    
    for (const tenant of tenants) {
      // Check for customizations
      const customizations = await this.getTenantCustomizations(tenant.id, domainId);
      
      if (customizations.length === 0) {
        // Direct sync
        await this.syncContent(tenant.id, domainId);
      } else {
        // Create merge proposal
        await this.createMergeProposal(tenant.id, domainId, customizations);
      }
    }
  }
}
```

## Deployment Architecture

### High Availability Setup

#### 1. Multi-Region Deployment
```yaml
# Cloud Run deployment with multiple regions
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: gemeos-app
  annotations:
    run.googleapis.com/cpu-throttling: "false"
    run.googleapis.com/execution-environment: "gen2"
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/memory: "2Gi"
        run.googleapis.com/cpu: "2"
        autoscaling.knative.dev/maxScale: "100"
        autoscaling.knative.dev/minScale: "2"
    spec:
      containers:
      - image: gcr.io/gemeos-467015/app:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-config
              key: url
```

#### 2. Database Replication
```sql
-- Read replicas for performance
-- Primary: us-central1
-- Replicas: us-east1, europe-west1

-- Connection routing
CREATE OR REPLACE FUNCTION route_read_query(query_type TEXT)
RETURNS TEXT AS $$
BEGIN
  CASE query_type
    WHEN 'read' THEN
      RETURN 'replica-' || get_nearest_region();
    ELSE
      RETURN 'primary';
  END CASE;
END;
$$ LANGUAGE plpgsql;
```

#### 3. Storage Strategy
```python
# Tenant-aware storage buckets
class TenantStorage:
    def __init__(self, tenant_id: str):
        self.bucket_name = f"gemeos-{self.get_region()}-{tenant_id[:8]}"
        self.client = storage.Client()
    
    def upload_file(self, file_path: str, content: bytes) -> str:
        bucket = self.client.bucket(self.bucket_name)
        blob = bucket.blob(file_path)
        
        # Add tenant metadata
        blob.metadata = {
            'tenant_id': self.tenant_id,
            'upload_time': datetime.utcnow().isoformat()
        }
        
        blob.upload_from_string(content)
        return f"gs://{self.bucket_name}/{file_path}"
```

### Performance Optimization

#### 1. Caching Strategy
```typescript
interface CacheService {
  // Multi-level caching
  async get(key: string, tenantId: string): Promise<any> {
    const tenantKey = `${tenantId}:${key}`;
    
    // L1: In-memory cache
    let value = this.memoryCache.get(tenantKey);
    if (value) return value;
    
    // L2: Redis cache
    value = await this.redisCache.get(tenantKey);
    if (value) {
      this.memoryCache.set(tenantKey, value, 300); // 5 min TTL
      return value;
    }
    
    // L3: Database
    value = await this.database.get(key, tenantId);
    if (value) {
      await this.redisCache.set(tenantKey, value, 3600); // 1 hour TTL
      this.memoryCache.set(tenantKey, value, 300);
    }
    
    return value;
  }
}
```

#### 2. Database Optimization
```sql
-- Performance indexes for multi-tenant queries
CREATE INDEX CONCURRENTLY idx_content_items_tenant_domain 
ON content_items (tenant_id, domain_id) 
WHERE status = 'published';

CREATE INDEX CONCURRENTLY idx_user_profiles_tenant_role 
ON user_profiles (tenant_id, role) 
WHERE active = true;

-- Partitioning for large tables
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    data JSONB
) PARTITION BY HASH (tenant_id);

-- Create partitions
CREATE TABLE audit_logs_p0 PARTITION OF audit_logs
FOR VALUES WITH (modulus 8, remainder 0);
```

## Migration Strategy

### Phase 1: Foundation (Weeks 1-4)
1. **Database Schema Migration**
   ```sql
   -- Add tenant context to existing tables
   ALTER TABLE domains ADD COLUMN tenant_id UUID REFERENCES tenants(id);
   ALTER TABLE domains ADD COLUMN source_type source_type_enum DEFAULT 'custom';
   
   -- Create platform-level tables
   -- Enable RLS on all tenant-scoped tables
   -- Create initial RLS policies
   ```

2. **Data Migration**
   ```typescript
   async function migrateToMultiTenant() {
     // Create default platform
     const platform = await createPlatform({
       name: 'Gemeos Platform',
       domain: 'gemeos.com'
     });
     
     // Create default tenant
     const tenant = await createTenant({
       platform_id: platform.id,
       name: 'Default Organization',
       slug: 'default'
     });
     
     // Migrate existing users
     await migrateUsers(tenant.id);
     
     // Migrate existing content
     await migrateContent(tenant.id);
   }
   ```

### Phase 2: Service Updates (Weeks 5-8)
1. **Authentication Enhancement**
   - Add tenant context to auth flow
   - Implement tenant-aware RLS
   - Update session management

2. **API Updates**
   - Add tenant middleware
   - Update all endpoints for tenant context
   - Implement tenant validation

### Phase 3: Frontend Updates (Weeks 9-12)
1. **Tenant Context Provider**
   ```typescript
   export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
     const [tenantContext, setTenantContext] = useState<TenantContext | null>(null);
     
     useEffect(() => {
       const slug = window.location.hostname.split('.')[0];
       loadTenantContext(slug).then(setTenantContext);
     }, []);
     
     return (
       <TenantContext.Provider value={tenantContext}>
         {children}
       </TenantContext.Provider>
     );
   };
   ```

2. **Component Updates**
   - Add tenant awareness to all components
   - Update routing for tenant context
   - Implement tenant-specific theming

### Phase 4: Advanced Features (Weeks 13-16)
1. **Content Inheritance**
   - Implement inheritance engine
   - Add version control
   - Create merge workflow

2. **Multi-tenant Administration**
   - Platform admin dashboard
   - Tenant management interface
   - Usage monitoring and analytics

### Phase 5: Production Deployment (Weeks 17-20)
1. **Performance Testing**
   - Load testing with multiple tenants
   - Database performance optimization
   - Cache implementation

2. **Security Audit**
   - Penetration testing
   - Security review
   - Compliance verification

3. **Go-Live**
   - Production deployment
   - Monitoring setup
   - User training and documentation

## Monitoring & Operations

### Observability Stack
```yaml
# Monitoring configuration
monitoring:
  metrics:
    - tenant_request_count
    - tenant_response_time
    - tenant_error_rate
    - tenant_storage_usage
    - tenant_user_count
    
  alerts:
    - name: "High Error Rate"
      condition: "error_rate > 5%"
      notification: "ops-team@gemeos.com"
    
    - name: "Tenant Quota Exceeded"
      condition: "storage_usage > 90% of quota"
      notification: "tenant-admin@{tenant-domain}"

  dashboards:
    - platform_overview
    - tenant_metrics
    - performance_metrics
    - security_events
```

### Cost Optimization
```typescript
interface CostOptimizationService {
  async optimizeTenantResources(tenantId: string): Promise<void> {
    const usage = await this.getTenantUsage(tenantId);
    
    // Auto-scaling based on usage patterns
    if (usage.peak_hours.length < 8) {
      await this.enableAutoScaling(tenantId, 'conservative');
    }
    
    // Storage optimization
    if (usage.storage_growth < 0.1) {
      await this.enableStorageTiering(tenantId);
    }
    
    // Compute optimization
    await this.rightSizeInstances(tenantId, usage.cpu_utilization);
  }
}
```

## Success Metrics

### Performance KPIs
- **Response Time**: < 500ms for 95th percentile
- **Throughput**: 10,000 concurrent users per tenant
- **Availability**: 99.9% uptime SLA
- **Scalability**: Linear scaling to 1000+ tenants

### Business KPIs
- **Tenant Onboarding**: < 5 minutes setup time
- **User Adoption**: > 80% DAU/MAU ratio
- **Feature Usage**: > 70% of features used by active tenants
- **Support Tickets**: < 2% of monthly active users

This architecture provides a solid foundation for scaling Gemeos into a comprehensive multi-tenant educational platform that can serve thousands of tenants with millions of users while maintaining performance, security, and compliance requirements.