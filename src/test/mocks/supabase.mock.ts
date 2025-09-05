import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

export const createMockSupabaseClient = (): Partial<SupabaseClient> => {
  const authMock = {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
    admin: {
      inviteUserByEmail: vi.fn(),
    }
  };

  const fromMock = vi.fn((table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    throwOnError: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
  }));

  const rpcMock = vi.fn();

  return {
    auth: authMock as any,
    from: fromMock as any,
    rpc: rpcMock as any,
  };
};

export const mockSupabaseResponses = {
  // User and session responses
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    created_at: '2024-01-01T00:00:00.000Z',
  },
  
  // Tenant responses
  tenants: [
    {
      id: 'tenant-1',
      name: 'Test School 1',
      slug: 'test-school-1',
      status: 'active',
      subscription_tier: 'premium',
      max_users: 100,
      max_domains: 10,
      settings: {},
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'tenant-2',
      name: 'Test School 2',
      slug: 'test-school-2',
      status: 'active',
      subscription_tier: 'basic',
      max_users: 50,
      max_domains: 5,
      settings: {},
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
  ],

  // Role responses
  roles: {
    platform_admin: {
      id: 'role-platform-admin',
      name: 'platform_admin',
      display_name: 'Platform Administrator',
      description: 'Full system access',
      hierarchy_level: 0,
      is_system_role: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
    tenant_admin: {
      id: 'role-tenant-admin',
      name: 'tenant_admin',
      display_name: 'Tenant Administrator',
      description: 'Full tenant access',
      hierarchy_level: 10,
      is_system_role: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
    teacher: {
      id: 'role-teacher',
      name: 'teacher',
      display_name: 'Teacher',
      description: 'Teacher access',
      hierarchy_level: 20,
      is_system_role: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
    student: {
      id: 'role-student',
      name: 'student',
      display_name: 'Student',
      description: 'Student access',
      hierarchy_level: 30,
      is_system_role: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
  },

  // Permission responses
  permissions: [
    { id: 'perm-1', resource: 'users', action: 'create', description: 'Create users' },
    { id: 'perm-2', resource: 'users', action: 'read', description: 'Read users' },
    { id: 'perm-3', resource: 'users', action: 'update', description: 'Update users' },
    { id: 'perm-4', resource: 'users', action: 'delete', description: 'Delete users' },
    { id: 'perm-5', resource: 'domains', action: 'create', description: 'Create domains' },
    { id: 'perm-6', resource: 'domains', action: 'read', description: 'Read domains' },
    { id: 'perm-7', resource: 'domains', action: 'update', description: 'Update domains' },
    { id: 'perm-8', resource: 'domains', action: 'delete', description: 'Delete domains' },
    { id: 'perm-9', resource: 'concepts', action: 'create', description: 'Create concepts' },
    { id: 'perm-10', resource: 'concepts', action: 'read', description: 'Read concepts' },
    { id: 'perm-11', resource: 'learning_goals', action: 'create', description: 'Create learning goals' },
    { id: 'perm-12', resource: 'learning_goals', action: 'read', description: 'Read learning goals' },
  ],

  // User tenant responses
  userTenantWithRoles: [
    {
      tenant_id: 'tenant-1',
      tenant_name: 'Test School 1',
      tenant_slug: 'test-school-1',
      role_name: 'tenant_admin',
      role_display_name: 'Tenant Administrator',
      is_primary: true,
      status: 'active',
    },
    {
      tenant_id: 'tenant-2',
      tenant_name: 'Test School 2',
      tenant_slug: 'test-school-2',
      role_name: 'teacher',
      role_display_name: 'Teacher',
      is_primary: false,
      status: 'active',
    },
  ],

  // Audit log responses
  auditLogs: [
    {
      id: 'audit-1',
      tenant_id: 'tenant-1',
      user_id: 'test-user-123',
      action: 'user.login',
      resource_type: 'auth',
      resource_id: null,
      changes: null,
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0',
      created_at: '2024-01-01T10:00:00.000Z',
    },
    {
      id: 'audit-2',
      tenant_id: 'tenant-1',
      user_id: 'test-user-123',
      action: 'domain.update',
      resource_type: 'domains',
      resource_id: 'domain-1',
      changes: { name: 'Updated Domain' },
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0',
      created_at: '2024-01-01T11:00:00.000Z',
    },
  ],
};

// Helper function to create a mock Supabase client with specific responses
export const createConfiguredMockClient = (config: {
  user?: any;
  tenants?: any[];
  roles?: any;
  permissions?: any[];
  error?: any;
}) => {
  const client = createMockSupabaseClient();
  
  // Configure auth.getUser response
  if (config.user) {
    (client.auth!.getUser as any).mockResolvedValue({ data: { user: config.user }, error: null });
  } else if (config.error) {
    (client.auth!.getUser as any).mockResolvedValue({ data: null, error: config.error });
  } else {
    (client.auth!.getUser as any).mockResolvedValue({ data: null, error: null });
  }

  return client;
};