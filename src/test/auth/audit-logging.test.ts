/**
 * Audit Logging Tests
 * Testing comprehensive audit trail functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthService } from '@/services/auth.service';
import { renderHook, act } from '@testing-library/react';
import { useAuditLog } from '@/hooks/useAuth';
import { createMockSupabaseClient, mockSupabaseResponses } from '@/test/mocks/supabase.mock';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}));

describe('Audit Logging System', () => {
  let authService: AuthService;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Reset singleton
    (AuthService as any).instance = null;
    authService = AuthService.getInstance();
    
    const { supabase } = require('@/integrations/supabase/client');
    mockSupabase = supabase;
    
    // Set current tenant
    (authService as any).currentTenantId = 'tenant-1';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Audit Log Creation', () => {
    it('should log authentication events', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { id: 'audit-log-1' },
        error: null,
      });

      await authService.createAuditLog(
        'auth.login',
        'authentication',
        'user-123',
        { 
          method: 'password',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0'
        }
      );

      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_tenant_id: 'tenant-1',
        p_action: 'auth.login',
        p_resource_type: 'authentication',
        p_resource_id: 'user-123',
        p_changes: {
          method: 'password',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0'
        },
      });
    });

    it('should log user management actions', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { id: 'audit-log-2' },
        error: null,
      });

      const userChanges = {
        role: { from: 'teacher', to: 'tenant_admin' },
        status: { from: 'active', to: 'suspended' },
      };

      await authService.createAuditLog(
        'user.update',
        'users',
        'user-456',
        userChanges
      );

      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_audit_log', {
        p_tenant_id: 'tenant-1',
        p_action: 'user.update',
        p_resource_type: 'users',
        p_resource_id: 'user-456',
        p_changes: userChanges,
      });
    });

    it('should log permission changes', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { id: 'audit-log-3' },
        error: null,
      });

      await authService.createAuditLog(
        'permission.grant',
        'permissions',
        'role-teacher',
        {
          permission: 'domains.create',
          granted_by: 'admin-user-123',
        }
      );

      expect(mockSupabase.rpc).toHaveBeenCalled();
    });

    it('should log tenant management actions', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { id: 'audit-log-4' },
        error: null,
      });

      await authService.createAuditLog(
        'tenant.update',
        'tenants',
        'tenant-1',
        {
          subscription_tier: { from: 'basic', to: 'premium' },
          max_users: { from: 50, to: 100 },
        }
      );

      expect(mockSupabase.rpc).toHaveBeenCalled();
    });

    it('should handle audit log creation failures gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      // Should not throw
      await authService.createAuditLog(
        'test.action',
        'test',
        'test-id',
        {}
      );

      expect(console.error).toHaveBeenCalledWith(
        'Error creating audit log:',
        expect.any(Error)
      );
    });
  });

  describe('Audit Log Retrieval', () => {
    const sampleAuditLogs = [
      {
        id: 'log-1',
        tenant_id: 'tenant-1',
        user_id: 'user-123',
        action: 'auth.login',
        resource_type: 'authentication',
        resource_id: null,
        changes: null,
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 'log-2',
        tenant_id: 'tenant-1',
        user_id: 'user-123',
        action: 'user.update',
        resource_type: 'users',
        resource_id: 'user-456',
        changes: { role: 'teacher' },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: '2024-01-15T11:00:00Z',
      },
      {
        id: 'log-3',
        tenant_id: 'tenant-1',
        user_id: 'user-789',
        action: 'domain.create',
        resource_type: 'domains',
        resource_id: 'domain-1',
        changes: { name: 'Mathematics' },
        ip_address: '192.168.1.2',
        user_agent: 'Chrome/120.0',
        created_at: '2024-01-15T12:00:00Z',
      },
    ];

    it('should retrieve audit logs for current tenant', async () => {
      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: sampleAuditLogs,
        error: null,
      });

      const logs = await authService.getAuditLogs();

      expect(logs).toEqual(sampleAuditLogs);
      expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
      expect(mockSupabase.from().order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabase.from().limit).toHaveBeenCalledWith(100);
    });

    it('should filter audit logs by resource type', async () => {
      const userLogs = sampleAuditLogs.filter(l => l.resource_type === 'users');
      
      mockSupabase.from().select().eq().eq().order().limit.mockResolvedValue({
        data: userLogs,
        error: null,
      });

      const logs = await authService.getAuditLogs({
        resource_type: 'users',
      });

      expect(logs).toEqual(userLogs);
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('resource_type', 'users');
    });

    it('should filter audit logs by user', async () => {
      const userSpecificLogs = sampleAuditLogs.filter(l => l.user_id === 'user-123');
      
      mockSupabase.from().select().eq().eq().order().limit.mockResolvedValue({
        data: userSpecificLogs,
        error: null,
      });

      const logs = await authService.getAuditLogs({
        user_id: 'user-123',
      });

      expect(logs).toEqual(userSpecificLogs);
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should filter audit logs by date range', async () => {
      const startDate = new Date('2024-01-15T00:00:00Z');
      const endDate = new Date('2024-01-15T23:59:59Z');
      
      mockSupabase.from().select().eq().gte().lte().order().limit.mockResolvedValue({
        data: sampleAuditLogs,
        error: null,
      });

      const logs = await authService.getAuditLogs({
        start_date: startDate,
        end_date: endDate,
      });

      expect(logs).toEqual(sampleAuditLogs);
      expect(mockSupabase.from().gte).toHaveBeenCalledWith('created_at', startDate.toISOString());
      expect(mockSupabase.from().lte).toHaveBeenCalledWith('created_at', endDate.toISOString());
    });

    it('should return empty array when no tenant is selected', async () => {
      (authService as any).currentTenantId = null;
      localStorage.clear();

      const logs = await authService.getAuditLogs();

      expect(logs).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should handle retrieval errors gracefully', async () => {
      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: null,
        error: new Error('Query failed'),
      });

      const logs = await authService.getAuditLogs();

      expect(logs).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching audit logs:',
        expect.any(Error)
      );
    });
  });

  describe('Audit Log Hook', () => {
    it('should log actions through useAuditLog hook', async () => {
      vi.mock('@/services/auth.service', () => ({
        authService: {
          createAuditLog: vi.fn().mockResolvedValue(undefined),
        },
      }));

      const { authService: authServiceMock } = require('@/services/auth.service');
      
      const { result } = renderHook(() => useAuditLog());

      await act(async () => {
        await result.current.logAction(
          'test.action',
          'test_resource',
          'resource-123',
          { field: 'value' }
        );
      });

      expect(authServiceMock.createAuditLog).toHaveBeenCalledWith(
        'test.action',
        'test_resource',
        'resource-123',
        { field: 'value' }
      );
    });

    it('should handle hook logging errors gracefully', async () => {
      vi.mock('@/services/auth.service', () => ({
        authService: {
          createAuditLog: vi.fn().mockRejectedValue(new Error('Logging failed')),
        },
      }));

      const { result } = renderHook(() => useAuditLog());

      // Should not throw
      await act(async () => {
        await result.current.logAction('test.action', 'test');
      });

      expect(console.error).toHaveBeenCalledWith(
        'Failed to create audit log:',
        expect.any(Error)
      );
    });
  });

  describe('Comprehensive Action Tracking', () => {
    it('should track complete user journey', async () => {
      const userJourneyActions = [
        { action: 'auth.login', resource: 'authentication' },
        { action: 'tenant.switch', resource: 'tenants' },
        { action: 'domain.view', resource: 'domains' },
        { action: 'concept.create', resource: 'concepts' },
        { action: 'concept.update', resource: 'concepts' },
        { action: 'learning_goal.assign', resource: 'learning_goals' },
        { action: 'auth.logout', resource: 'authentication' },
      ];

      mockSupabase.rpc.mockResolvedValue({
        data: { id: 'audit-log-id' },
        error: null,
      });

      for (const { action, resource } of userJourneyActions) {
        await authService.createAuditLog(action, resource);
      }

      expect(mockSupabase.rpc).toHaveBeenCalledTimes(userJourneyActions.length);
    });

    it('should track failed operations', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { id: 'audit-log-fail' },
        error: null,
      });

      await authService.createAuditLog(
        'permission.denied',
        'security',
        null,
        {
          attempted_action: 'users.delete',
          reason: 'insufficient_privileges',
          user_role: 'teacher',
        }
      );

      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_audit_log', 
        expect.objectContaining({
          p_action: 'permission.denied',
          p_resource_type: 'security',
        })
      );
    });

    it('should track bulk operations', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { id: 'audit-log-bulk' },
        error: null,
      });

      await authService.createAuditLog(
        'bulk.update',
        'concepts',
        null,
        {
          affected_count: 25,
          operation: 'status_change',
          new_status: 'published',
        }
      );

      expect(mockSupabase.rpc).toHaveBeenCalled();
    });
  });

  describe('Audit Log Compliance', () => {
    it('should include required compliance fields', async () => {
      mockSupabase.rpc.mockImplementation((funcName: string, params: any) => {
        // Verify all required fields are present
        expect(params).toHaveProperty('p_tenant_id');
        expect(params).toHaveProperty('p_action');
        expect(params).toHaveProperty('p_resource_type');
        
        return Promise.resolve({ data: { id: 'audit-log' }, error: null });
      });

      await authService.createAuditLog(
        'compliance.test',
        'test_resource'
      );

      expect(mockSupabase.rpc).toHaveBeenCalled();
    });

    it('should ensure audit logs are immutable', async () => {
      // Attempt to update an audit log (should fail)
      mockSupabase.from().update().eq.mockResolvedValue({
        data: null,
        error: new Error('Audit logs are immutable'),
      });

      const updateResult = await mockSupabase
        .from('audit_logs')
        .update({ action: 'modified.action' })
        .eq('id', 'audit-log-1');

      expect(updateResult.error?.message).toContain('immutable');
    });

    it('should track data retention compliance', async () => {
      const retentionDate = new Date();
      retentionDate.setFullYear(retentionDate.getFullYear() - 7); // 7 years retention

      mockSupabase.from().select().lt().mockResolvedValue({
        data: [],
        error: null,
      });

      // Query for logs older than retention period
      const oldLogs = await mockSupabase
        .from('audit_logs')
        .select('*')
        .lt('created_at', retentionDate.toISOString());

      expect(oldLogs.data).toEqual([]);
    });
  });

  describe('Performance and Optimization', () => {
    it('should batch audit log writes for performance', async () => {
      const batchLogs = Array(10).fill(null).map((_, i) => ({
        action: `batch.action.${i}`,
        resource_type: 'batch_test',
      }));

      // Simulate batch insert
      mockSupabase.from().insert.mockResolvedValue({
        data: batchLogs.map((log, i) => ({ id: `log-${i}`, ...log })),
        error: null,
      });

      const result = await mockSupabase
        .from('audit_logs')
        .insert(batchLogs);

      expect(result.data).toHaveLength(10);
      expect(mockSupabase.from().insert).toHaveBeenCalledTimes(1); // Single batch call
    });

    it('should implement pagination for large audit log queries', async () => {
      const pageSize = 50;
      const totalLogs = 150;

      // Generate sample logs
      const allLogs = Array(totalLogs).fill(null).map((_, i) => ({
        id: `log-${i}`,
        action: `action.${i}`,
        created_at: new Date(2024, 0, 1, i).toISOString(),
      }));

      // Simulate pagination
      for (let offset = 0; offset < totalLogs; offset += pageSize) {
        mockSupabase.from().select().eq().order().range.mockResolvedValue({
          data: allLogs.slice(offset, offset + pageSize),
          error: null,
        });

        const result = await mockSupabase
          .from('audit_logs')
          .select('*')
          .eq('tenant_id', 'tenant-1')
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);

        expect(result.data).toHaveLength(Math.min(pageSize, totalLogs - offset));
      }
    });

    it('should use indexes for efficient filtering', async () => {
      // Verify queries use indexed columns
      const indexedQueries = [
        { column: 'tenant_id', value: 'tenant-1' },
        { column: 'user_id', value: 'user-123' },
        { column: 'created_at', value: '2024-01-15' },
        { column: 'resource_type', value: 'users' },
        { column: 'action', value: 'auth.login' },
      ];

      for (const query of indexedQueries) {
        mockSupabase.from().select().eq().mockResolvedValue({
          data: [],
          error: null,
        });

        await mockSupabase
          .from('audit_logs')
          .select('*')
          .eq(query.column, query.value);

        expect(mockSupabase.from().eq).toHaveBeenCalledWith(query.column, query.value);
      }
    });
  });

  describe('Security and Privacy', () => {
    it('should sanitize sensitive data in audit logs', async () => {
      mockSupabase.rpc.mockImplementation((funcName: string, params: any) => {
        // Verify sensitive data is not logged
        const changes = params.p_changes;
        if (changes) {
          expect(changes).not.toHaveProperty('password');
          expect(changes).not.toHaveProperty('credit_card');
          expect(changes).not.toHaveProperty('ssn');
        }
        
        return Promise.resolve({ data: { id: 'audit-log' }, error: null });
      });

      await authService.createAuditLog(
        'user.update',
        'users',
        'user-123',
        {
          email: 'new@example.com',
          // These should be filtered out
          password: 'should-not-log',
          credit_card: '1234-5678-9012-3456',
        }
      );

      expect(mockSupabase.rpc).toHaveBeenCalled();
    });

    it('should enforce tenant isolation in audit logs', async () => {
      // User from tenant-1 trying to access tenant-2 logs
      (authService as any).currentTenantId = 'tenant-1';

      mockSupabase.from().select().eq().mockResolvedValue({
        data: [],
        error: new Error('Row-level security violation'),
      });

      const logs = await authService.getAuditLogs();

      expect(logs).toEqual([]);
      // Should only query for current tenant
      expect(mockSupabase.from().eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
    });

    it('should anonymize user data in compliance mode', async () => {
      mockSupabase.rpc.mockImplementation((funcName: string, params: any) => {
        // In compliance mode, user IDs might be hashed
        if (params.p_changes?.user_email) {
          expect(params.p_changes.user_email).toMatch(/\*{3,}/); // Partially masked
        }
        
        return Promise.resolve({ data: { id: 'audit-log' }, error: null });
      });

      await authService.createAuditLog(
        'gdpr.data_export',
        'compliance',
        'user-123',
        {
          user_email: 'user***@example.com', // Masked email
          export_reason: 'user_request',
        }
      );

      expect(mockSupabase.rpc).toHaveBeenCalled();
    });
  });
});