/**
 * RBAC Middleware for Supabase Edge Functions
 * Simple permission checking utility for API routes
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

export interface RBACMiddlewareOptions {
  resource: string;
  action?: string;
  tenantRequired?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  tenantId?: string | null;
}

/**
 * Extract user from authorization header
 */
export async function extractUser(
  request: Request, 
  supabase: SupabaseClient
): Promise<AuthUser | null> {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) return null;

    const token = authorization.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) return null;

    return {
      id: user.id,
      email: user.email || '',
    };
  } catch (error) {
    console.error('Error extracting user:', error);
    return null;
  }
}

/**
 * Check if user has permission for resource/action
 */
export async function checkPermission(
  supabase: SupabaseClient,
  userId: string,
  resource: string,
  action: string = 'read',
  tenantId?: string | null
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('check_permission', {
        p_tenant_id: tenantId || null,
        p_resource_key: resource,
        p_action: action
      });

    if (error) {
      console.error('Permission check error:', error);
      return false;
    }

    return Boolean(data);
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
}

/**
 * RBAC middleware function
 */
export async function requirePermission(
  request: Request,
  options: RBACMiddlewareOptions
): Promise<{ authorized: boolean; user: AuthUser | null; error?: string }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return { authorized: false, user: null, error: 'Configuration error' };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Extract user from request
    const user = await extractUser(request, supabase);
    if (!user) {
      return { authorized: false, user: null, error: 'Authentication required' };
    }

    // Get tenant from request body if needed
    let tenantId: string | null = null;
    if (options.tenantRequired) {
      try {
        const body = await request.clone().json();
        tenantId = body.tenantId || null;
      } catch {
        // Ignore JSON parse errors for non-JSON requests
      }
    }

    // Check permission
    const hasPermission = await checkPermission(
      supabase,
      user.id,
      options.resource,
      options.action || 'read',
      tenantId
    );

    if (!hasPermission) {
      return { authorized: false, user, error: 'Insufficient permissions' };
    }

    return { authorized: true, user: { ...user, tenantId } };
  } catch (error) {
    console.error('RBAC middleware error:', error);
    return { 
      authorized: false, 
      user: null, 
      error: error instanceof Error ? error.message : 'Authorization failed' 
    };
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: string, status: number = 403): Response {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
  };

  return new Response(
    JSON.stringify({ error }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
}

/**
 * Example usage:
 * 
 * ```typescript
 * import { requirePermission, createErrorResponse } from '../_shared/rbac-middleware.ts';
 * 
 * serve(async (req) => {
 *   // Check permissions
 *   const { authorized, user, error } = await requirePermission(req, {
 *     resource: 'api:send_email',
 *     action: 'create',
 *     tenantRequired: true
 *   });
 * 
 *   if (!authorized) {
 *     return createErrorResponse(error || 'Access denied');
 *   }
 * 
 *   // Continue with function logic...
 *   // user.id and user.tenantId are available
 * });
 * ```
 */