/**
 * Tenant Wizard Store
 * Manages state for the tenant creation/editing wizard
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface BasicInfo {
  name: string;
  slug: string;
  description?: string;
  status: 'active' | 'trial' | 'suspended' | 'inactive';
  subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise';
}

export interface DomainAssignment {
  selectedDomainIds: string[];
  domainSettings: Map<string, { max_teachers: number; max_students: number }>;
}

export interface GlobalLimits {
  global_max_teachers: number;
  global_max_students: number;
  enforce_limits: boolean;
}

export interface AdminInvitation {
  email: string;
  role: 'tenant_admin';
  sendImmediately: boolean;
}

export interface TenantSettings {
  features: Record<string, boolean>;
  customization: Record<string, string | boolean | number>;
}

export interface WizardData {
  basic: BasicInfo;
  domains: DomainAssignment;
  limits: GlobalLimits;
  admins: {
    invitations: AdminInvitation[];
  };
  settings: TenantSettings;
}

export type WizardStep = 'basic' | 'domains' | 'limits' | 'admins' | 'settings';

interface TenantWizardState {
  // Current wizard data
  data: WizardData;
  
  // Wizard navigation
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
  
  // UI state
  isOpen: boolean;
  isLoading: boolean;
  mode: 'create' | 'edit';
  editingTenantId?: string;
  
  // Validation
  errors: Record<string, string[]>;
  
  // Actions
  setCurrentStep: (step: WizardStep) => void;
  markStepComplete: (step: WizardStep) => void;
  markStepIncomplete: (step: WizardStep) => void;
  
  // Data updates
  updateBasicInfo: (basic: Partial<BasicInfo>) => void;
  updateDomainAssignment: (domains: Partial<DomainAssignment>) => void;
  updateGlobalLimits: (limits: Partial<GlobalLimits>) => void;
  updateAdminInvitations: (admins: Partial<{ invitations: AdminInvitation[] }>) => void;
  updateSettings: (settings: Partial<TenantSettings>) => void;
  
  // Wizard control
  openCreateWizard: () => void;
  openEditWizard: (tenantId: string, existingData: Partial<WizardData>) => void;
  closeWizard: () => void;
  resetWizard: () => void;
  
  // Page-based modes (new)
  initializeCreateMode: () => void;
  initializeEditMode: (tenantId: string, existingData: Partial<WizardData>) => void;
  
  // Validation
  validateStep: (step: WizardStep) => Promise<boolean>;
  setErrors: (errors: Record<string, string[]>) => void;
  clearErrors: () => void;
  
  // Loading state
  setLoading: (loading: boolean) => void;
}

const initialData: WizardData = {
  basic: {
    name: '',
    slug: '',
    description: '',
    status: 'active',
    subscription_tier: 'free'
  },
  domains: {
    selectedDomainIds: [],
    domainSettings: new Map()
  },
  limits: {
    global_max_teachers: 50,
    global_max_students: 500,
    enforce_limits: true
  },
  admins: {
    invitations: []
  },
  settings: {
    features: {
      analytics: true,
      reporting: true,
      advanced_permissions: false,
      custom_branding: false
    },
    customization: {
      theme: 'default',
      logo_url: '',
      primary_color: '#2563eb'
    }
  }
};

export const useTenantWizardStore = create<TenantWizardState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        data: initialData,
        currentStep: 'basic',
        completedSteps: new Set(),
        isOpen: false,
        isLoading: false,
        mode: 'create',
        editingTenantId: undefined,
        errors: {},

        // Navigation actions
        setCurrentStep: (step) => {
          set({ currentStep: step }, false, 'setCurrentStep');
        },

        markStepComplete: (step) => {
          set(
            (state) => ({
              completedSteps: new Set([...state.completedSteps, step])
            }),
            false,
            'markStepComplete'
          );
        },

        markStepIncomplete: (step) => {
          set(
            (state) => {
              const newCompleted = new Set(state.completedSteps);
              newCompleted.delete(step);
              return { completedSteps: newCompleted };
            },
            false,
            'markStepIncomplete'
          );
        },

        // Data update actions
        updateBasicInfo: (basic) => {
          set(
            (state) => ({
              data: {
                ...state.data,
                basic: { ...state.data.basic, ...basic }
              }
            }),
            false,
            'updateBasicInfo'
          );

          // Auto-generate slug from name if name changes and slug is empty
          if (basic.name && !get().data.basic.slug) {
            const slug = basic.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');
            
            set(
              (state) => ({
                data: {
                  ...state.data,
                  basic: { ...state.data.basic, slug }
                }
              }),
              false,
              'autoGenerateSlug'
            );
          }
        },

        updateDomainAssignment: (domains) => {
          set(
            (state) => ({
              data: {
                ...state.data,
                domains: { ...state.data.domains, ...domains }
              }
            }),
            false,
            'updateDomainAssignment'
          );
        },

        updateGlobalLimits: (limits) => {
          set(
            (state) => ({
              data: {
                ...state.data,
                limits: { ...state.data.limits, ...limits }
              }
            }),
            false,
            'updateGlobalLimits'
          );
        },

        updateAdminInvitations: (admins) => {
          set(
            (state) => ({
              data: {
                ...state.data,
                admins: { ...state.data.admins, ...admins }
              }
            }),
            false,
            'updateAdminInvitations'
          );
        },

        updateSettings: (settings) => {
          set(
            (state) => ({
              data: {
                ...state.data,
                settings: { ...state.data.settings, ...settings }
              }
            }),
            false,
            'updateSettings'
          );
        },

        // Wizard control
        openCreateWizard: () => {
          set({
            isOpen: true,
            mode: 'create',
            editingTenantId: undefined,
            currentStep: 'basic',
            completedSteps: new Set(),
            data: { ...initialData },
            errors: {}
          }, false, 'openCreateWizard');
        },

        openEditWizard: (tenantId, existingData) => {
          set({
            isOpen: true,
            mode: 'edit',
            editingTenantId: tenantId,
            currentStep: 'basic',
            completedSteps: new Set(['basic', 'domains', 'limits', 'admins', 'settings']),
            data: { ...initialData, ...existingData },
            errors: {}
          }, false, 'openEditWizard');
        },

        closeWizard: () => {
          set({
            isOpen: false,
            currentStep: 'basic',
            completedSteps: new Set(),
            errors: {}
          }, false, 'closeWizard');
        },

        resetWizard: () => {
          set({
            data: initialData,
            currentStep: 'basic',
            completedSteps: new Set(),
            errors: {},
            editingTenantId: undefined
          }, false, 'resetWizard');
        },

        // Page-based modes (new)
        initializeCreateMode: () => {
          set({
            isOpen: false, // Page mode doesn't use modal
            mode: 'create',
            editingTenantId: undefined,
            currentStep: 'basic',
            completedSteps: new Set(),
            data: { ...initialData },
            errors: {}
          }, false, 'initializeCreateMode');
        },

        initializeEditMode: (tenantId, existingData) => {
          set({
            isOpen: false, // Page mode doesn't use modal
            mode: 'edit',
            editingTenantId: tenantId,
            currentStep: 'basic',
            completedSteps: new Set(['basic', 'domains', 'limits', 'admins', 'settings']),
            data: { ...initialData, ...existingData },
            errors: {}
          }, false, 'initializeEditMode');
        },

        // Validation
        validateStep: async (step) => {
          console.log(`🔍 [QA] Validating step: ${step}`);
          const { data } = get();
          const errors: string[] = [];

          switch (step) {
            case 'basic':
              if (!data.basic.name.trim()) errors.push('Tenant name is required');
              if (!data.basic.slug.trim()) errors.push('Tenant slug is required');
              if (data.basic.slug.length < 3) errors.push('Slug must be at least 3 characters');
              if (!/^[a-z0-9-]+$/.test(data.basic.slug)) {
                errors.push('Slug can only contain lowercase letters, numbers, and hyphens');
              }
              
              // Check slug uniqueness
              if (data.basic.slug.trim()) {
                try {
                  const { tenantService } = await import('../services/tenant.service');
                  const isAvailable = await tenantService.isSlugAvailable(data.basic.slug);
                  if (!isAvailable) {
                    errors.push('This slug is already taken. Please choose a different one.');
                  }
                } catch (error) {
                  console.error('Error checking slug availability:', error);
                  errors.push('Unable to verify slug availability. Please try again.');
                }
              }
              break;

            case 'domains':
              if (data.domains.selectedDomainIds.length === 0) {
                errors.push('At least one domain must be selected');
              }
              break;

            case 'limits':
              if (data.limits.global_max_teachers < 1) {
                errors.push('Maximum teachers must be at least 1');
              }
              if (data.limits.global_max_students < 1) {
                errors.push('Maximum students must be at least 1');
              }
              break;

            case 'admins':
              if (data.admins.invitations.length === 0) {
                errors.push('At least one tenant admin invitation is required');
              }
              
              for (const invitation of data.admins.invitations) {
                if (!invitation.email.trim()) {
                  errors.push('All admin invitations must have valid email addresses');
                  break;
                }
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(invitation.email)) {
                  errors.push(`Invalid email address: ${invitation.email}`);
                }
              }
              break;

            case 'settings':
              // Settings are optional, so always valid
              break;
          }

          console.log(`🔍 [QA] Validation results for ${step}:`, {
            valid: errors.length === 0,
            errorCount: errors.length,
            errors: errors
          });

          if (errors.length > 0) {
            set(
              (state) => ({
                errors: { ...state.errors, [step]: errors }
              }),
              false,
              'setValidationErrors'
            );
            return false;
          } else {
            set(
              (state) => {
                const newErrors = { ...state.errors };
                delete newErrors[step];
                return { errors: newErrors };
              },
              false,
              'clearValidationErrors'
            );
            return true;
          }
        },

        setErrors: (errors) => {
          set({ errors }, false, 'setErrors');
        },

        clearErrors: () => {
          set({ errors: {} }, false, 'clearErrors');
        },

        // Loading state
        setLoading: (isLoading) => {
          set({ isLoading }, false, 'setLoading');
        }
      }),
      {
        name: 'tenant-wizard-store',
        // Don't persist sensitive data like admin emails
        partialize: (state) => ({
          currentStep: state.currentStep,
          completedSteps: Array.from(state.completedSteps),
          data: {
            ...state.data,
            admins: { invitations: [] } // Reset admin invitations on page reload for security
          }
        }),
        onRehydrateStorage: () => (state) => {
          if (state && Array.isArray(state.completedSteps)) {
            state.completedSteps = new Set(state.completedSteps);
          }
        }
      }
    ),
    { name: 'tenant-wizard' }
  )
);

// Helper hooks for specific wizard steps
export const useBasicInfoStep = () => {
  const data = useTenantWizardStore((state) => state.data.basic);
  const update = useTenantWizardStore((state) => state.updateBasicInfo);
  const errors = useTenantWizardStore((state) => state.errors.basic || []);
  const validate = useTenantWizardStore((state) => state.validateStep);
  
  return { data, update, errors, validate: () => validate('basic') };
};

export const useDomainsStep = () => {
  const data = useTenantWizardStore((state) => state.data.domains);
  const update = useTenantWizardStore((state) => state.updateDomainAssignment);
  const errors = useTenantWizardStore((state) => state.errors.domains || []);
  const validate = useTenantWizardStore((state) => state.validateStep);
  
  return { data, update, errors, validate: () => validate('domains') };
};

export const useLimitsStep = () => {
  const data = useTenantWizardStore((state) => state.data.limits);
  const update = useTenantWizardStore((state) => state.updateGlobalLimits);
  const errors = useTenantWizardStore((state) => state.errors.limits || []);
  const validate = useTenantWizardStore((state) => state.validateStep);
  
  return { data, update, errors, validate: () => validate('limits') };
};

export const useAdminsStep = () => {
  const data = useTenantWizardStore((state) => state.data.admins);
  const update = useTenantWizardStore((state) => state.updateAdminInvitations);
  const errors = useTenantWizardStore((state) => state.errors.admins || []);
  const validate = useTenantWizardStore((state) => state.validateStep);
  
  return { data, update, errors, validate: () => validate('admins') };
};

export const useSettingsStep = () => {
  const data = useTenantWizardStore((state) => state.data.settings);
  const update = useTenantWizardStore((state) => state.updateSettings);
  const errors = useTenantWizardStore((state) => state.errors.settings || []);
  const validate = useTenantWizardStore((state) => state.validateStep);
  
  return { data, update, errors, validate: () => validate('settings') };
};