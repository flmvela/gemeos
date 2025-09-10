# URL Restructure Plan - Clean Admin URLs

## 📋 Current vs Proposed Structure

| Current URL | New URL | Resource Name | Display Name | Changes Required |
|-------------|---------|---------------|--------------|------------------|
| `/admin/dashboard` | `/admin/dashboard` | `page:dashboard` | "Dashboard" | Resource name only |
| `/admin/domain/:domainId` | `/admin/domains/:slug` | `page:domain_detail` | "Domain Management" | URL path + slug lookup |
| `/admin/domain/:domainSlug/concepts` | `/admin/domains/:slug/concepts` | `page:learning_concepts` | "Learning Concepts" | URL path consistency |
| `/admin/domain/:domainId/goals` | `/admin/domains/:slug/goals` | `page:learning_goals` | "Learning Goals" | URL path + slug lookup |
| `/admin/domain/:domainId/ai-guidance` | `/admin/domains/:slug/ai-guidance` | `page:ai_guidance` | "AI Guidance" | URL path + slug lookup |
| `/admin/tenants` | `/admin/tenants` | `page:tenants` | "Tenant Management" | Resource name only |
| `/admin/upload` | `/admin/upload` | `page:content_upload` | "Content Upload" | Resource name only |
| `/admin/rbac-management` | `/admin/permissions` | `page:permission_management` | "Permission Management" | URL simplification |

## 🛠️ Implementation Steps

### Phase 1: Database Updates (30 minutes)
```sql
-- Update resource names for better clarity
UPDATE public.resources SET 
    key = 'page:dashboard',
    description = 'Platform dashboard with system overview'
WHERE key = 'page:admin_dashboard';

UPDATE public.resources SET 
    key = 'page:domain_detail', 
    description = 'Domain management and configuration'
WHERE key = 'page:domain_management';

-- Add new resources for missing pages
INSERT INTO public.resources (key, kind, description, category) VALUES
('page:learning_concepts', 'page', 'Manage learning concepts within domains', 'content'),
('page:learning_goals', 'page', 'Manage learning goals and objectives', 'content'),
('page:ai_guidance', 'page', 'AI guidance configuration and training', 'content'),
('page:tenants', 'page', 'Tenant management and administration', 'users'),
('page:content_upload', 'page', 'Upload content files and documents', 'system')
ON CONFLICT (key) DO UPDATE SET
    description = EXCLUDED.description,
    category = EXCLUDED.category;
```

### Phase 2: Component Updates (2 hours)

**A. Create Slug Resolution Hook:**
```typescript
// hooks/useDomainSlug.ts
export const useDomainSlug = (identifier: string) => {
  // Check if identifier is UUID or slug
  // Return domain data with both id and slug
};
```

**B. Update Route Components:**
- Update `DomainAdmin.tsx` to handle slug resolution
- Update `DomainConcepts.tsx` to use consistent slug
- Update `LearningGoalsPage.tsx` to use slug
- Update navigation components

### Phase 3: Route Configuration (1 hour)

**Update App.tsx routes:**
```typescript
// Old routes
<Route path="domain/:domainId" element={<DomainAdmin />} />
<Route path="domain/:domainSlug/concepts" element={<DomainConcepts />} />

// New consistent routes  
<Route path="domains/:slug" element={<DomainAdmin />} />
<Route path="domains/:slug/concepts" element={<DomainConcepts />} />
<Route path="domains/:slug/goals" element={<LearningGoalsPage />} />
<Route path="permissions" element={<RBACManagement />} />
```

### Phase 4: Navigation Updates (1 hour)
- Update all internal links to use new URLs
- Update breadcrumbs and menu items
- Add redirects for old URLs (temporary compatibility)

## 🎯 Benefits

### For Product Managers:
- **Clear naming**: "Dashboard" instead of "page:admin_dashboard"
- **Intuitive permissions**: Easy to understand what each permission controls
- **Consistent patterns**: All domain URLs follow same structure

### For Developers:
- **Maintainable code**: Consistent slug usage throughout
- **SEO friendly**: Clean URLs with meaningful paths
- **Future-proof**: Easy to add new domain-related pages

### For Users:
- **Readable URLs**: `/admin/domains/jazz-piano/concepts` vs `/admin/domain/472a6e02.../concepts`
- **Bookmarkable**: Friendly URLs that make sense
- **Intuitive navigation**: URLs match the page hierarchy

## ⚠️ Risk Assessment

### Low Risk:
- Database resource name updates
- Adding missing resources
- Updating component display names

### Medium Risk:
- Route path changes (requires thorough testing)
- Slug resolution logic
- Navigation link updates

### Mitigation:
- **Backward compatibility**: Add redirects for old URLs during transition
- **Comprehensive testing**: Test all navigation flows
- **Staged deployment**: Update database first, then frontend
- **Rollback plan**: Keep old routes active during testing phase

## 📋 Quick Win Alternative (Option 2)

If URL changes are too risky, we can implement just the resource naming improvements:

```sql
-- Quick fix: Just update resource names and descriptions
UPDATE public.resources SET 
    key = 'page:dashboard',
    description = 'Dashboard'
WHERE key = 'page:admin_dashboard';

UPDATE public.resources SET 
    key = 'page:domain_management',
    description = 'Domain Management'
WHERE key = 'page:domain_management';
-- ... etc for all resources
```

**Effort:** 30 minutes
**Risk:** Very low
**Benefit:** Clear permission names in RBAC interface

## 🚀 Recommendation

**I recommend Option 1 (full restructure)** because:
1. **Future-proof**: Sets up clean architecture for growth
2. **User experience**: Much better URLs for daily use
3. **Maintainability**: Easier to add new features
4. **Professional**: Clean URLs look more polished

The risk is manageable with proper testing and staged rollout.