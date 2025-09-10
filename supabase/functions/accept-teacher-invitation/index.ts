import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AcceptInvitationRequest {
  token: string;
  password: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { token, password }: AcceptInvitationRequest = await req.json();
    
    if (!token || !password) {
      throw new Error('Token and password are required');
    }

    // Find the invitation
    const { data: invitation, error: invError } = await supabase
      .from('invitations')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();

    if (invError || !invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      throw new Error('Invitation has expired');
    }

    // Extract metadata
    const metadata = invitation.metadata || {};

    let userId: string;

    // Try to create the user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: metadata.firstName,
        last_name: metadata.lastName,
        role: 'teacher',
        tenant_id: invitation.tenant_id
      }
    });

    if (authError) {
      // Check if user already exists
      if (authError.message?.includes('already been registered')) {
        // Get existing user
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === invitation.email);
        
        if (!existingUser) {
          throw new Error('Failed to find existing user');
        }
        
        userId = existingUser.id;
        
        // Update user's password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          userId,
          { password }
        );
        
        if (updateError) {
          throw new Error(`Failed to update password: ${updateError.message}`);
        }
      } else {
        throw new Error(`Failed to create user: ${authError.message}`);
      }
    } else {
      if (!authData.user) {
        throw new Error('No user data returned');
      }
      userId = authData.user.id;
    }

    // Check if teacher profile already exists
    const { data: existingTeacher } = await supabase
      .from('teachers')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', invitation.tenant_id)
      .maybeSingle();
    
    let teacher;
    if (existingTeacher) {
      teacher = existingTeacher;
    } else {
      // Create teacher profile using service role (bypasses RLS)
      const { data: newTeacher, error: teacherError } = await supabase
        .from('teachers')
        .insert({
          user_id: userId,
          tenant_id: invitation.tenant_id,
          first_name: metadata.firstName,
          last_name: metadata.lastName,
          phone_number: metadata.phoneNumber,
          status: 'active',
          created_by: metadata.createdBy || invitation.invited_by
        })
        .select()
        .single();

      if (teacherError) {
        console.error('Teacher creation error:', teacherError);
        throw new Error(`Failed to create teacher profile: ${teacherError.message}`);
      }
      teacher = newTeacher;
    }

    // Add to user_tenants (if not exists)
    const { error: userTenantError } = await supabase
      .from('user_tenants')
      .insert({
        user_id: userId,
        tenant_id: invitation.tenant_id,
        role_id: invitation.role_id,
        email: invitation.email,
        status: 'active',
        is_primary: true,
        joined_at: new Date().toISOString()
      });

    // Ignore duplicate key errors
    if (userTenantError && userTenantError.code !== '23505') {
      console.error('User tenant error:', userTenantError);
      throw new Error(`Failed to add user to tenant: ${userTenantError.message}`);
    }

    // Process domains from metadata (only if teacher was just created)
    if (metadata.domains && !existingTeacher) {
      const { data: existingDomains } = await supabase
        .from('teacher_domains')
        .select('domain_id')
        .eq('teacher_id', teacher.id);
      
      const existingDomainIds = new Set(existingDomains?.map(d => d.domain_id) || []);
      
      // Primary domain
      if (metadata.domains.primaryDomain && !existingDomainIds.has(metadata.domains.primaryDomain.id)) {
        await supabase
          .from('teacher_domains')
          .insert({
            teacher_id: teacher.id,
            domain_id: metadata.domains.primaryDomain.id,
            is_primary: true,
            certification_level: metadata.domains.primaryDomain.certificationLevel || 'intermediate',
            max_students: metadata.domains.maxStudents,
            preferred_class_size: metadata.domains.preferredClassSize
          });
      }

      // Additional domains
      if (metadata.domains.additionalDomains?.length > 0) {
        const additionalDomainsData = metadata.domains.additionalDomains
          .filter(domain => !existingDomainIds.has(domain.id))
          .map(domain => ({
            teacher_id: teacher.id,
            domain_id: domain.id,
            is_primary: false,
            certification_level: domain.certificationLevel || 'beginner'
          }));

        if (additionalDomainsData.length > 0) {
          await supabase
            .from('teacher_domains')
            .insert(additionalDomainsData);
        }
      }
    }

    // Process schedule from metadata (only if teacher was just created)
    if (metadata.schedule?.weeklyAvailability && !existingTeacher) {
      const scheduleData = Object.entries(metadata.schedule.weeklyAvailability)
        .filter(([_, daySchedule]: [string, any]) => daySchedule.enabled)
        .map(([day, daySchedule]: [string, any]) => ({
          teacher_id: teacher.id,
          day_of_week: day,
          start_time: daySchedule.startTime,
          end_time: daySchedule.endTime,
          is_available: true
        }));

      if (scheduleData.length > 0) {
        await supabase
          .from('teacher_schedules')
          .insert(scheduleData);
      }
    }

    // Update invitation status
    await supabase
      .from('invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    // Generate session for the user
    const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: invitation.email,
      options: {
        redirectTo: `${req.headers.get('origin')}/teacher/dashboard`
      }
    });

    if (sessionError) {
      console.error('Session generation error:', sessionError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Teacher account created successfully',
        userId,
        teacherId: teacher.id,
        email: invitation.email,
        redirectUrl: '/teacher/dashboard'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Accept invitation error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to accept invitation',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});