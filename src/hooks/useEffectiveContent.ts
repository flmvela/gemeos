/**
 * React Hooks for Effective Content with Override Pattern
 * Provides React Query integration for content with inheritance
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { contentService, type EffectiveConcept, type EffectiveLearningGoal, type EffectiveExercise, type ContentOverride, type TenantContentSummary } from '@/services/content.service';

// ============================================================
// CONTENT RETRIEVAL HOOKS
// ============================================================

/**
 * Get effective concepts with inheritance resolved
 */
export const useEffectiveConcepts = (tenantId?: string, userId?: string) => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  return useQuery({
    queryKey: ['effective-concepts', tenantId || currentTenant?.id, userId || user?.id],
    queryFn: () => contentService.getEffectiveConcepts(tenantId || currentTenant?.id, userId || user?.id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!(currentTenant?.id || tenantId),
  });
};

/**
 * Get concepts for a specific domain
 */
export const useConceptsForDomain = (domainId: string, tenantId?: string, userId?: string) => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  return useQuery({
    queryKey: ['domain-concepts', domainId, tenantId || currentTenant?.id, userId || user?.id],
    queryFn: () => contentService.getConceptsForDomain(domainId, tenantId || currentTenant?.id, userId || user?.id),
    staleTime: 5 * 60 * 1000,
    enabled: !!(domainId && (currentTenant?.id || tenantId)),
  });
};

/**
 * Get effective learning goals with inheritance resolved
 */
export const useEffectiveLearningGoals = (tenantId?: string, userId?: string) => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  return useQuery({
    queryKey: ['effective-learning-goals', tenantId || currentTenant?.id, userId || user?.id],
    queryFn: () => contentService.getEffectiveLearningGoals(tenantId || currentTenant?.id, userId || user?.id),
    staleTime: 5 * 60 * 1000,
    enabled: !!(currentTenant?.id || tenantId),
  });
};

/**
 * Get learning goals for a specific concept
 */
export const useLearningGoalsForConcept = (conceptId: string, tenantId?: string, userId?: string) => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  return useQuery({
    queryKey: ['concept-learning-goals', conceptId, tenantId || currentTenant?.id, userId || user?.id],
    queryFn: () => contentService.getLearningGoalsForConcept(conceptId, tenantId || currentTenant?.id, userId || user?.id),
    staleTime: 5 * 60 * 1000,
    enabled: !!(conceptId && (currentTenant?.id || tenantId)),
  });
};

/**
 * Get effective exercises with inheritance resolved
 */
export const useEffectiveExercises = (tenantId?: string, userId?: string) => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  return useQuery({
    queryKey: ['effective-exercises', tenantId || currentTenant?.id, userId || user?.id],
    queryFn: () => contentService.getEffectiveExercises(tenantId || currentTenant?.id, userId || user?.id),
    staleTime: 5 * 60 * 1000,
    enabled: !!(currentTenant?.id || tenantId),
  });
};

/**
 * Get tenant content summary for dashboard
 */
export const useTenantContentSummary = (tenantId?: string) => {
  const { currentTenant } = useTenant();
  
  return useQuery({
    queryKey: ['tenant-content-summary', tenantId || currentTenant?.id],
    queryFn: () => contentService.getTenantContentSummary(tenantId || currentTenant?.id),
    staleTime: 10 * 60 * 1000, // 10 minutes for dashboard data
    enabled: !!(currentTenant?.id || tenantId),
  });
};

// ============================================================
// CONTENT CUSTOMIZATION HOOKS
// ============================================================

/**
 * Hook for creating/updating concept overrides
 */
export const useConceptOverride = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      baseConceptId, 
      updates, 
      scope 
    }: { 
      baseConceptId: string; 
      updates: Partial<ContentOverride>; 
      scope: 'tenant' | 'teacher' 
    }) => contentService.updateConceptOverride(baseConceptId, updates, scope),
    
    onSuccess: () => {
      // Invalidate all concept-related queries
      queryClient.invalidateQueries({ queryKey: ['effective-concepts'] });
      queryClient.invalidateQueries({ queryKey: ['domain-concepts'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-content-summary'] });
    }
  });
};

/**
 * Hook for creating/updating learning goal overrides
 */
export const useLearningGoalOverride = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      baseLearningGoalId, 
      updates, 
      scope 
    }: { 
      baseLearningGoalId: string; 
      updates: Partial<ContentOverride>; 
      scope: 'tenant' | 'teacher' 
    }) => contentService.updateLearningGoalOverride(baseLearningGoalId, updates, scope),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['effective-learning-goals'] });
      queryClient.invalidateQueries({ queryKey: ['concept-learning-goals'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-content-summary'] });
    }
  });
};

/**
 * Hook for creating/updating exercise overrides
 */
export const useExerciseOverride = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      baseExerciseId, 
      updates, 
      scope 
    }: { 
      baseExerciseId: string; 
      updates: Partial<ContentOverride>; 
      scope: 'tenant' | 'teacher' 
    }) => contentService.updateExerciseOverride(baseExerciseId, updates, scope),
    
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['effective-exercises'] });
      queryClient.invalidateQueries({ queryKey: ['tenant-content-summary'] });
    }
  });
};

/**
 * Hook for reverting content to parent version
 */
export const useRevertToParent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      contentType, 
      baseId, 
      scope 
    }: { 
      contentType: 'concept' | 'learning_goal' | 'exercise'; 
      baseId: string; 
      scope: 'tenant' | 'teacher' 
    }) => contentService.revertToParent(contentType, baseId, scope),
    
    onSuccess: (_, variables) => {
      // Invalidate appropriate queries based on content type
      if (variables.contentType === 'concept') {
        queryClient.invalidateQueries({ queryKey: ['effective-concepts'] });
        queryClient.invalidateQueries({ queryKey: ['domain-concepts'] });
      } else if (variables.contentType === 'learning_goal') {
        queryClient.invalidateQueries({ queryKey: ['effective-learning-goals'] });
        queryClient.invalidateQueries({ queryKey: ['concept-learning-goals'] });
      } else if (variables.contentType === 'exercise') {
        queryClient.invalidateQueries({ queryKey: ['effective-exercises'] });
      }
      queryClient.invalidateQueries({ queryKey: ['tenant-content-summary'] });
    }
  });
};

// ============================================================
// CONTENT STATE HOOKS
// ============================================================

/**
 * Hook to check user's content permissions
 */
export const useContentPermissions = () => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  return useQuery({
    queryKey: ['content-permissions', user?.id, currentTenant?.id],
    queryFn: async () => {
      const isPlatformAdmin = await contentService.isPlatformAdmin();
      const tenantRole = await contentService.getCurrentTenantRole();
      
      return {
        isPlatformAdmin,
        tenantRole,
        canEditTenantContent: isPlatformAdmin || tenantRole === 'tenant_admin',
        canEditTeacherContent: isPlatformAdmin || tenantRole === 'tenant_admin' || tenantRole === 'teacher',
        canViewContent: !!(tenantRole || isPlatformAdmin)
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!(user?.id && currentTenant?.id),
  });
};

/**
 * Hook to track content customization state
 */
export const useContentCustomizationState = (
  contentType: 'concept' | 'learning_goal' | 'exercise',
  contentId: string
) => {
  const { currentTenant } = useTenant();
  
  // This would be used to track if content is being edited, has unsaved changes, etc.
  // For now, we'll keep it simple and expand as needed
  return {
    isCustomizing: false,
    hasUnsavedChanges: false,
    customizationLevel: 'platform' as 'platform' | 'tenant' | 'teacher'
  };
};

// ============================================================
// UTILITY HOOKS
// ============================================================

/**
 * Hook to determine content hierarchy context
 */
export const useContentHierarchy = () => {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const { data: permissions } = useContentPermissions();
  
  return {
    currentScope: permissions?.isPlatformAdmin ? 'platform' : 
                  permissions?.tenantRole === 'tenant_admin' ? 'tenant' : 'teacher',
    availableScopes: permissions?.isPlatformAdmin ? ['platform', 'tenant', 'teacher'] :
                     permissions?.tenantRole === 'tenant_admin' ? ['tenant', 'teacher'] : ['teacher'],
    inheritanceChain: ['platform', 'tenant', 'teacher'],
    currentContext: {
      userId: user?.id,
      tenantId: currentTenant?.id,
      role: permissions?.tenantRole,
      isPlatformAdmin: permissions?.isPlatformAdmin || false
    }
  };
};

export type {
  EffectiveConcept,
  EffectiveLearningGoal,
  EffectiveExercise,
  ContentOverride,
  TenantContentSummary
};