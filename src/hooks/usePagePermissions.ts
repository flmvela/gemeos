import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PagePermission {
  id: string;
  page_id: string;
  role: string;
  is_active: boolean;
  updated_at: string;
  page: {
    id: string;
    path: string;
    description: string;
    created_at: string;
  };
}

export interface Page {
  id: string;
  path: string;
  description: string;
  created_at: string;
}

// Helper function to convert route pattern to regex
const routePatternToRegex = (pattern: string): RegExp => {
  // Convert :param to regex pattern that matches any non-slash characters
  const regexPattern = pattern.replace(/:[\w-]+/g, '[^/]+');
  return new RegExp(`^${regexPattern}$`);
};

// Helper function to check if a path matches a route pattern
const matchesRoutePattern = (actualPath: string, routePattern: string): boolean => {
  const regex = routePatternToRegex(routePattern);
  return regex.test(actualPath);
};

// Hook to check if current user can access a specific path
export const useCanAccessPath = (path: string) => {
  return useQuery({
    queryKey: ['page-access', path],
    queryFn: async () => {
      console.log('🔍 Checking access for path:', path);
      
      // First check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔑 Current session:', session);
      console.log('🔑 User info:', session?.user);
      console.log('🔑 JWT claims:', session?.user?.app_metadata);
      
      if (!session?.user) {
        console.log('❌ No authenticated user');
        return false;
      }

      // Check if user is platform admin first - platform admins have universal access
      const isPlatformAdmin = session.user.email === 'admin@gemeos.ai';
      
      if (isPlatformAdmin) {
        console.log('🔐 Platform admin detected, granting access to path:', path);
        return true;
      }

      // Get user role from JWT app_metadata
      const userRole = session.user.app_metadata?.role;
      console.log('👤 User role:', userRole);
      
      if (!userRole) {
        console.log('❌ No role found for user');
        return false;
      }

      // First try exact path match
      let { data: pageData, error: pageError } = await supabase
        .from('pages')
        .select('id, path')
        .eq('path', path)
        .maybeSingle();

      console.log('📄 Exact match page data:', { pageData, pageError });
      
      // If no exact match found, try pattern matching
      if (!pageData && !pageError) {
        console.log('🔍 No exact match found, trying pattern matching...');
        
        // Get all pages to check against patterns
        const { data: allPages, error: allPagesError } = await supabase
          .from('pages')
          .select('id, path');

        if (allPagesError) {
          console.error('❌ Error fetching all pages:', allPagesError);
          throw allPagesError;
        }

        // Find a matching pattern
        const matchingPage = allPages?.find(page => 
          page.path.includes(':') && matchesRoutePattern(path, page.path)
        );

        if (matchingPage) {
          console.log('✅ Found matching pattern:', matchingPage.path, 'for path:', path);
          pageData = matchingPage;
        }
      }

      if (pageError || !pageData) {
        console.log('❌ Page not found (exact or pattern match)');
        return false;
      }

      // Then check permissions for this page and user role
      const { data, error } = await supabase
        .from('page_permissions')
        .select('*')
        .eq('page_id', pageData.id)
        .eq('role', userRole)
        .eq('is_active', true)
        .maybeSingle();

      console.log('📄 Page permissions query result:', { data, error });
      if (error) {
        console.error('❌ Error fetching page permissions:', error);
        throw error;
      }
      
      const hasAccess = !!data;
      console.log('✅ Access granted:', hasAccess);
      return hasAccess;
    },
    retry: false,
  });
};

// Hook to get all user's accessible paths
export const useUserAccessiblePaths = () => {
  return useQuery({
    queryKey: ['user-accessible-paths'],
    queryFn: async () => {
      // Get current user's session and check if platform admin
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return [];
      }

      // For platform admins, return all available pages
      // Platform admin is determined by the auth system setting is_platform_admin = true
      // We can check this by looking at the session or by using a more direct approach
      // For now, we'll check if the user email is admin@gemeos.ai as that's our current admin
      const isPlatformAdmin = session.user.email === 'admin@gemeos.ai';
      
      if (isPlatformAdmin) {
        console.log('🔐 Platform admin detected, granting universal access');
        // Get all pages for platform admin
        const { data: allPages, error: allPagesError } = await supabase
          .from('pages')
          .select('path');
        
        if (allPagesError) {
          console.error('Error fetching all pages for admin:', allPagesError);
          throw allPagesError;
        }
        
        return allPages?.map(page => page.path) || [];
      }

      // For non-admin users, use role-based permissions
      const userRole = session.user.app_metadata?.role;
      
      if (!userRole) {
        return [];
      }

      const { data, error } = await supabase
        .from('page_permissions')
        .select(`
          page:pages!inner(path)
        `)
        .eq('role', userRole)
        .eq('is_active', true);

      if (error) throw error;
      return data?.map(item => item.page.path) || [];
    },
  });
};

// Hook for admin to manage all page permissions
export const useAllPagePermissions = () => {
  return useQuery({
    queryKey: ['all-page-permissions'],
    queryFn: async () => {
      // First get all pages
      const { data: pages, error: pagesError } = await supabase
        .from('pages')
        .select('*')
        .order('path');

      if (pagesError) throw pagesError;

      // Then get all permissions
      const { data: permissions, error: permissionsError } = await supabase
        .from('page_permissions')
        .select('*');

      if (permissionsError) throw permissionsError;

      // Combine data for easier use
      return pages?.map(page => ({
        ...page,
        permissions: permissions?.filter(p => p.page_id === page.id) || []
      })) || [];
    },
  });
};

// Hook to update page permissions
export const useUpdatePagePermissions = () => {
  const [isLoading, setIsLoading] = useState(false);

  const updatePermission = async (pageId: string, role: string, isActive: boolean) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('page_permissions')
        .upsert({
          page_id: pageId,
          role,
          is_active: isActive,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'page_id,role'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating page permission:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { updatePermission, isLoading };
};