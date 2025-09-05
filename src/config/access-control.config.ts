/**
 * Centralized Access Control Configuration
 * Defines roles, permissions, and access rules for the Gemeos platform
 */

export interface RoleDefinition {
  name: string;
  displayName: string;
  description: string;
  hierarchyLevel: number;
  inheritsFrom?: string[];
}

export interface ResourceDefinition {
  name: string;
  actions: string[];
  description: string;
}

export interface RouteAccessRule {
  path: string | RegExp;
  roles?: string[];
  permissions?: Array<{
    resource: string;
    action: string;
  }>;
  public?: boolean;
}

/**
 * Role Hierarchy Configuration
 * Lower hierarchy levels have more privileges
 */
export const ROLES: Record<string, RoleDefinition> = {
  PLATFORM_ADMIN: {
    name: 'platform_admin',
    displayName: 'Platform Administrator',
    description: 'Full system access with all privileges',
    hierarchyLevel: 0
  },
  TENANT_ADMIN: {
    name: 'tenant_admin',
    displayName: 'Tenant Administrator',
    description: 'Manages tenant-specific settings and users',
    hierarchyLevel: 10,
    inheritsFrom: ['teacher']
  },
  TEACHER: {
    name: 'teacher',
    displayName: 'Teacher',
    description: 'Creates and manages educational content',
    hierarchyLevel: 20,
    inheritsFrom: ['student']
  },
  STUDENT: {
    name: 'student',
    displayName: 'Student',
    description: 'Accesses educational content and assessments',
    hierarchyLevel: 30
  }
};

/**
 * Resource and Action Definitions
 */
export const RESOURCES: Record<string, ResourceDefinition> = {
  DOMAIN: {
    name: 'domain',
    actions: ['create', 'read', 'update', 'delete', 'publish'],
    description: 'Learning domain management'
  },
  CONCEPT: {
    name: 'concept',
    actions: ['create', 'read', 'update', 'delete', 'reorder'],
    description: 'Concept management within domains'
  },
  LEARNING_GOAL: {
    name: 'learning_goal',
    actions: ['create', 'read', 'update', 'delete', 'assign'],
    description: 'Learning goals and objectives'
  },
  USER: {
    name: 'user',
    actions: ['create', 'read', 'update', 'delete', 'invite'],
    description: 'User account management'
  },
  TENANT: {
    name: 'tenant',
    actions: ['create', 'read', 'update', 'delete', 'configure'],
    description: 'Tenant organization management'
  },
  PERMISSION: {
    name: 'permission',
    actions: ['grant', 'revoke', 'read'],
    description: 'Permission management'
  },
  ANALYTICS: {
    name: 'analytics',
    actions: ['view', 'export'],
    description: 'Analytics and reporting'
  },
  AI_TRAINING: {
    name: 'ai_training',
    actions: ['configure', 'execute', 'monitor'],
    description: 'AI model training and configuration'
  }
};

/**
 * Route Access Rules
 * Defines which roles can access specific routes
 */
export const ROUTE_ACCESS_RULES: RouteAccessRule[] = [
  // Public routes (no authentication required)
  { path: '/welcome', public: true },
  { path: '/login', public: true },
  { path: '/register', public: true },
  { path: '/forgot-password', public: true },
  { path: '/unauthorized', public: true },

  // Platform Admin routes (automatically accessible by platform_admin)
  { path: /^\/admin\/.*/, roles: ['platform_admin'] },
  
  // Teacher routes
  { path: '/teacher/dashboard', roles: ['teacher', 'tenant_admin'] },
  { path: '/teacher/domain-selection', roles: ['teacher', 'tenant_admin'] },
  { path: '/teacher/settings/curriculum-setup', roles: ['teacher', 'tenant_admin'] },
  { path: '/teacher/administration', roles: ['teacher', 'tenant_admin'] },
  { path: '/teacher/administration/domains', roles: ['teacher', 'tenant_admin'] },
  { path: '/teacher/administration/learning-goals', roles: ['teacher', 'tenant_admin'] },

  // Domain-specific routes (with dynamic segments)
  { 
    path: /^\/admin\/domain\/[^/]+\/concepts$/, 
    roles: ['platform_admin', 'tenant_admin'],
    permissions: [{ resource: 'concept', action: 'read' }]
  },
  { 
    path: /^\/admin\/domain\/[^/]+$/, 
    roles: ['platform_admin', 'tenant_admin'],
    permissions: [{ resource: 'domain', action: 'read' }]
  },

  // Tenant Admin routes
  { path: '/tenant-admin', roles: ['tenant_admin'] },
  
  // Student routes
  { path: '/student/dashboard', roles: ['student'] },
  { path: '/student/courses', roles: ['student'] },
  { path: '/student/assessments', roles: ['student'] }
];

/**
 * Permission Matrix
 * Defines which roles have which permissions by default
 */
export const PERMISSION_MATRIX = {
  platform_admin: {
    // Platform admin has all permissions (handled by bypass logic)
    '*': ['*']
  },
  tenant_admin: {
    domain: ['create', 'read', 'update', 'delete'],
    concept: ['create', 'read', 'update', 'delete', 'reorder'],
    learning_goal: ['create', 'read', 'update', 'delete', 'assign'],
    user: ['read', 'invite'],
    tenant: ['read', 'update'],
    analytics: ['view', 'export']
  },
  teacher: {
    domain: ['read'],
    concept: ['create', 'read', 'update'],
    learning_goal: ['create', 'read', 'update', 'assign'],
    user: ['read'],
    analytics: ['view']
  },
  student: {
    domain: ['read'],
    concept: ['read'],
    learning_goal: ['read'],
    analytics: ['view'] // Only their own analytics
  }
};

/**
 * Special Access Rules
 * Define special conditions or overrides
 */
export const SPECIAL_ACCESS_RULES = {
  // Platform admin bypass - always returns true for any check
  platformAdminBypass: true,
  
  // Allow users to always access their own profile
  ownProfileAccess: true,
  
  // Tenant isolation - users can only access resources within their tenant
  tenantIsolation: true,
  
  // Hierarchy enforcement - higher roles inherit lower role permissions
  hierarchicalInheritance: true
};

/**
 * Helper function to check if a role has a specific permission
 */
export function roleHasPermission(
  role: string, 
  resource: string, 
  action: string
): boolean {
  // Platform admin always has permission
  if (role === 'platform_admin') return true;
  
  const rolePermissions = PERMISSION_MATRIX[role as keyof typeof PERMISSION_MATRIX];
  if (!rolePermissions) return false;
  
  // Check for wildcard permissions
  if (rolePermissions['*']?.includes('*')) return true;
  if (rolePermissions['*']?.includes(action)) return true;
  
  // Check specific resource permissions
  const resourcePermissions = rolePermissions[resource as keyof typeof rolePermissions];
  if (!resourcePermissions) return false;
  
  return Array.isArray(resourcePermissions) && 
         (resourcePermissions.includes('*') || resourcePermissions.includes(action));
}

/**
 * Helper function to get all permissions for a role
 */
export function getRolePermissions(role: string): Array<{ resource: string; actions: string[] }> {
  if (role === 'platform_admin') {
    // Return all possible permissions for platform admin
    return Object.values(RESOURCES).map(resource => ({
      resource: resource.name,
      actions: resource.actions
    }));
  }
  
  const rolePermissions = PERMISSION_MATRIX[role as keyof typeof PERMISSION_MATRIX];
  if (!rolePermissions) return [];
  
  return Object.entries(rolePermissions).map(([resource, actions]) => ({
    resource,
    actions: Array.isArray(actions) ? actions : []
  }));
}

/**
 * Helper function to check if a path matches a route rule
 */
export function matchesRouteRule(path: string, rule: string | RegExp): boolean {
  if (typeof rule === 'string') {
    return path === rule;
  }
  return rule.test(path);
}

export default {
  ROLES,
  RESOURCES,
  ROUTE_ACCESS_RULES,
  PERMISSION_MATRIX,
  SPECIAL_ACCESS_RULES,
  roleHasPermission,
  getRolePermissions,
  matchesRouteRule
};