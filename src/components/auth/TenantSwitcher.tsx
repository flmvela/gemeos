/**
 * Tenant Switcher Component
 * Allows users to switch between tenants they have access to
 */

import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronDown, Shield, UserCog, GraduationCap, Users } from 'lucide-react';
import { useTenantSwitcher } from '@/hooks/useAuth';
import { SystemRole } from '@/types/auth.types';

const roleIcons = {
  [SystemRole.PLATFORM_ADMIN]: Shield,
  [SystemRole.TENANT_ADMIN]: UserCog,
  [SystemRole.TEACHER]: GraduationCap,
  [SystemRole.STUDENT]: Users,
};

const roleColors = {
  [SystemRole.PLATFORM_ADMIN]: 'bg-red-100 text-red-800',
  [SystemRole.TENANT_ADMIN]: 'bg-purple-100 text-purple-800',
  [SystemRole.TEACHER]: 'bg-blue-100 text-blue-800',
  [SystemRole.STUDENT]: 'bg-green-100 text-green-800',
};

export function TenantSwitcher() {
  const { tenants, currentTenant, switchTenant, loading } = useTenantSwitcher();

  if (!currentTenant || tenants.length <= 1) {
    return null; // Don't show switcher if user has access to only one tenant
  }

  const handleTenantChange = (tenantId: string) => {
    if (tenantId !== currentTenant.tenant_id) {
      switchTenant(tenantId);
    }
  };

  const RoleIcon = roleIcons[currentTenant.role.name as SystemRole] || Users;
  const roleColor = roleColors[currentTenant.role.name as SystemRole] || 'bg-gray-100 text-gray-800';

  return (
    <div className="flex items-center gap-2">
      <Select 
        value={currentTenant.tenant_id} 
        onValueChange={handleTenantChange}
        disabled={loading}
      >
        <SelectTrigger className="w-[250px]">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select organization" />
            <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {tenants.map((tenant) => {
            const TenantRoleIcon = roleIcons[tenant.role.name as SystemRole] || Users;
            const tenantRoleColor = roleColors[tenant.role.name as SystemRole] || 'bg-gray-100 text-gray-800';
            
            return (
              <SelectItem key={tenant.tenant_id} value={tenant.tenant_id}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{tenant.tenant.name}</span>
                  </div>
                  <Badge variant="secondary" className={`ml-2 ${tenantRoleColor}`}>
                    <TenantRoleIcon className="h-3 w-3 mr-1" />
                    {tenant.role.display_name}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      <Badge variant="outline" className={roleColor}>
        <RoleIcon className="h-3 w-3 mr-1" />
        {currentTenant.role.display_name}
      </Badge>
    </div>
  );
}

/**
 * Compact version for mobile or sidebar
 */
export function TenantSwitcherCompact() {
  const { tenants, currentTenant, switchTenant, loading } = useTenantSwitcher();

  if (!currentTenant || tenants.length <= 1) {
    return null;
  }

  const handleTenantChange = (tenantId: string) => {
    if (tenantId !== currentTenant.tenant_id) {
      switchTenant(tenantId);
    }
  };

  return (
    <div className="w-full">
      <label className="text-xs text-muted-foreground mb-1 block">Organization</label>
      <Select 
        value={currentTenant.tenant_id} 
        onValueChange={handleTenantChange}
        disabled={loading}
      >
        <SelectTrigger className="w-full h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {tenants.map((tenant) => (
            <SelectItem key={tenant.tenant_id} value={tenant.tenant_id}>
              <div className="flex items-center gap-2">
                <span className="truncate">{tenant.tenant.name}</span>
                <Badge variant="ghost" className="ml-auto text-xs px-1 py-0">
                  {tenant.role.name}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}