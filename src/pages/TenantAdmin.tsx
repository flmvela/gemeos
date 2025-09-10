/**
 * Tenant Admin Page
 * Main entry point for tenant administration features
 */

import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, useAuthGuard } from '@/hooks/useAuth';
import { TenantAdminDashboard } from '@/components/tenant-admin/TenantAdminDashboard';
import { TeacherManagement } from '@/components/tenant-admin/TeacherManagement';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Loader2 } from 'lucide-react';

/**
 * Tenant Admin Page Component
 * Provides navigation and routing for all tenant admin features
 */
export function TenantAdminPage() {
  const navigate = useNavigate();
  const { authorized, loading } = useAuthGuard({
    requiredRole: 'tenant_admin',
    redirectTo: '/unauthorized',
  });

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect if not authorized
  if (!authorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <PermissionGuard resource="page:tenant_admin" action="read">
      <div className="container mx-auto py-6">
        <Routes>
          {/* Dashboard Route */}
          <Route index element={<TenantAdminDashboard />} />
          
          {/* Teacher Management Route */}
          <Route path="teachers" element={<TeacherManagementPage />} />
          
          {/* Domain Management Route */}
          <Route path="domains" element={<DomainManagementPage />} />
          
          {/* Settings Route */}
          <Route path="settings" element={<TenantSettingsPage />} />
          
          {/* Invitations Route */}
          <Route path="invitations" element={<InvitationsPage />} />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </PermissionGuard>
  );
}

/**
 * Teacher Management Page
 */
function TeacherManagementPage() {
  return (
    <div className="space-y-6">
      <TeacherManagement />
    </div>
  );
}

/**
 * Domain Management Page (placeholder)
 */
function DomainManagementPage() {
  const { hasPermission } = useAuth();
  
  if (!hasPermission('domains', 'assign')) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          You don't have permission to manage domains.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Domain Management</h2>
      <p className="text-muted-foreground">
        Domain management interface will be implemented here.
      </p>
    </div>
  );
}

/**
 * Tenant Settings Page (placeholder)
 */
function TenantSettingsPage() {
  const { hasPermission } = useAuth();
  
  if (!hasPermission('tenants', 'update')) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          You don't have permission to manage tenant settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tenant Settings</h2>
      <p className="text-muted-foreground">
        Tenant settings interface will be implemented here.
      </p>
    </div>
  );
}

/**
 * Invitations Page (placeholder)
 */
function InvitationsPage() {
  const { hasPermission } = useAuth();
  
  if (!hasPermission('users', 'invite')) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          You don't have permission to manage invitations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Invitations</h2>
      <p className="text-muted-foreground">
        Invitations management interface will be implemented here.
      </p>
    </div>
  );
}