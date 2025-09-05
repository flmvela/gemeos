/**
 * Enhanced Authentication System Types
 * These types correspond to the enhanced multi-tenant RBAC database schema
 */

// ============================================================
// CORE TYPES
// ============================================================

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'inactive';
export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';
export type UserTenantStatus = 'active' | 'invited' | 'suspended' | 'inactive';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  settings: Record<string, any>;
  status: TenantStatus;
  subscription_tier: SubscriptionTier;
  max_users: number;
  max_domains: number;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  hierarchy_level: number;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTenant {
  id: string;
  user_id: string;
  tenant_id: string;
  role_id: string;
  is_primary: boolean;
  status: UserTenantStatus;
  invited_by?: string;
  joined_at?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  tenant?: Tenant;
  role?: Role;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  tenant_id?: string;
  conditions?: Record<string, any>;
  created_at: string;
  // Joined data
  role?: Role;
  permission?: Permission;
}

export interface TenantDomain {
  id: string;
  tenant_id: string;
  domain_id: string;
  is_active: boolean;
  max_teachers: number;
  max_students: number;
  created_at: string;
  updated_at: string;
  // Joined data
  tenant?: Tenant;
  domain?: any; // Replace with actual Domain type
}

export interface AuditLog {
  id: string;
  tenant_id?: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// ============================================================
// ROLE DEFINITIONS
// ============================================================

export enum SystemRole {
  PLATFORM_ADMIN = 'platform_admin',
  TENANT_ADMIN = 'tenant_admin',
  TEACHER = 'teacher',
  STUDENT = 'student'
}

export enum RoleHierarchy {
  PLATFORM_ADMIN = 0,
  TENANT_ADMIN = 10,
  TEACHER = 20,
  STUDENT = 30
}

// ============================================================
// PERMISSION RESOURCES AND ACTIONS
// ============================================================

export enum PermissionResource {
  USERS = 'users',
  DOMAINS = 'domains',
  CONCEPTS = 'concepts',
  LEARNING_GOALS = 'learning_goals',
  TENANTS = 'tenants',
  REPORTS = 'reports'
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  INVITE = 'invite',
  ASSIGN = 'assign',
  PUBLISH = 'publish',
  VIEW = 'view',
  EXPORT = 'export'
}

// ============================================================
// CONTEXT AND SESSION TYPES
// ============================================================

export interface AuthSession {
  user_id: string;
  email: string;
  tenants: UserTenantWithDetails[];
  current_tenant?: UserTenantWithDetails;
  is_platform_admin: boolean;
}

export interface UserTenantWithDetails extends UserTenant {
  tenant: Tenant;
  role: Role;
  permissions?: Permission[];
}

export interface TenantContext {
  tenant: Tenant;
  user_role: Role;
  permissions: Permission[];
  can(resource: PermissionResource, action: PermissionAction): boolean;
}

// ============================================================
// HELPER TYPES
// ============================================================

export interface CreateTenantInput {
  name: string;
  slug: string;
  description?: string;
  subscription_tier?: SubscriptionTier;
  max_users?: number;
  max_domains?: number;
}

export interface InviteUserInput {
  email: string;
  tenant_id: string;
  role: SystemRole;
  domains?: string[];
}

export interface AssignRoleInput {
  user_id: string;
  tenant_id: string;
  role: SystemRole;
}

export interface CheckPermissionInput {
  user_id: string;
  tenant_id: string;
  resource: string;
  action: string;
}

// ============================================================
// FUNCTION RETURN TYPES
// ============================================================

export interface UserTenantsWithRoles {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  role_name: string;
  role_display_name: string;
  is_primary: boolean;
  status: UserTenantStatus;
}

// ============================================================
// ERROR TYPES
// ============================================================

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public resource?: string,
    public action?: string,
    public tenant_id?: string
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class TenantNotFoundError extends Error {
  constructor(tenant_id: string) {
    super(`Tenant ${tenant_id} not found`);
    this.name = 'TenantNotFoundError';
  }
}

export class RoleNotFoundError extends Error {
  constructor(role_name: string) {
    super(`Role ${role_name} not found`);
    this.name = 'RoleNotFoundError';
  }
}