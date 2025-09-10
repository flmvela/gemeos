/**
 * Tenant Context Hook
 * Provides current tenant information for the user
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  subscription_tier: string;
}

export interface UserTenantContext {
  tenant_id: string;
  role_name: string;
  status: string;
  is_primary: boolean;
  tenant: Tenant;
}

export const useTenant = () => {
  const { user } = useAuth();

  const { data: userTenants, isLoading } = useQuery({
    queryKey: ['user-tenants', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_tenants')
        .select(`
          tenant_id,
          role_id,
          status,
          is_primary,
          tenant:tenants(
            id,
            name,
            slug,
            description,
            status,
            subscription_tier
          ),
          role:user_roles(
            name,
            display_name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('is_primary', { ascending: false });

      if (error) throw error;

      return data?.map(item => ({
        tenant_id: item.tenant_id,
        role_name: (item.role as any)?.name || 'unknown',
        status: item.status,
        is_primary: item.is_primary,
        tenant: item.tenant as Tenant
      })) || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get current tenant (primary if available, otherwise first active)
  const currentTenant = userTenants?.[0]?.tenant || null;
  const currentTenantRole = userTenants?.[0]?.role_name || null;
  const isPrimaryTenant = userTenants?.[0]?.is_primary || false;

  return {
    userTenants: userTenants || [],
    currentTenant,
    currentTenantRole,
    isPrimaryTenant,
    isLoading,
    hasMultipleTenants: (userTenants?.length || 0) > 1,
  };
};