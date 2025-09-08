/**
 * Platform Admin Service
 * Handles platform-wide statistics and dashboard data
 */

import { supabase } from '@/integrations/supabase/client';
import { tenantService } from './tenant.service';

export interface PlatformDashboardStats {
  tenants: number;
  teachers: number; // Mock data for now
  students: number; // Mock data for now
  classes: number; // Mock data for now
  newMessages: number; // Mock data for now
}

export interface TenantHeaderInfo {
  name: string;
  initials: string;
  subscription_tier: string;
}

class PlatformAdminService {
  /**
   * Get dashboard statistics for platform admin
   */
  async getDashboardStats(): Promise<PlatformDashboardStats> {
    try {
      // Get actual tenant count from database
      const tenants = await tenantService.getTenants();
      const tenantCount = tenants.length;

      // Return statistics (using mock data for other metrics as requested)
      return {
        tenants: tenantCount,
        teachers: 63, // Mock data
        students: 1614, // Mock data
        classes: 132, // Mock data
        newMessages: 23, // Mock data
      };
    } catch (error) {
      console.error('Error fetching platform dashboard stats:', error);
      // Return mock data if there's an error
      return {
        tenants: 5, // Fallback mock data
        teachers: 63,
        students: 1614,
        classes: 132,
        newMessages: 23,
      };
    }
  }

  /**
   * Get tenant growth data (for future use)
   */
  async getTenantGrowthStats() {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('created_at, status')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tenant growth stats:', error);
        return { currentMonth: 0, previousMonth: 0 };
      }

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const currentMonth = (data || []).filter(tenant => 
        new Date(tenant.created_at) >= currentMonthStart
      ).length;

      const previousMonth = (data || []).filter(tenant => {
        const createdAt = new Date(tenant.created_at);
        return createdAt >= previousMonthStart && createdAt < currentMonthStart;
      }).length;

      return { currentMonth, previousMonth };
    } catch (error) {
      console.error('Error calculating tenant growth:', error);
      return { currentMonth: 0, previousMonth: 0 };
    }
  }

  /**
   * Get tenant header information for the platform admin dashboard
   * For demo purposes, we'll return the first tenant as the "current" tenant
   */
  async getTenantHeaderInfo(): Promise<TenantHeaderInfo> {
    try {
      const tenants = await tenantService.getTenants();
      
      if (tenants.length > 0) {
        const firstTenant = tenants[0];
        const words = firstTenant.name.split(' ');
        const initials = words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
        
        return {
          name: firstTenant.name,
          initials,
          subscription_tier: firstTenant.subscription_tier
        };
      }

      // Fallback if no tenants exist
      return {
        name: 'Harmony Music Academy',
        initials: 'HM',
        subscription_tier: 'premium'
      };
    } catch (error) {
      console.error('Error fetching tenant header info:', error);
      // Fallback data
      return {
        name: 'Harmony Music Academy',
        initials: 'HM',
        subscription_tier: 'premium'
      };
    }
  }
}

export const platformAdminService = new PlatformAdminService();