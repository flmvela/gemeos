import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Lock, Mail, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface InvitationData {
  id: string;
  studentEmail: string;
  className: string;
  teacherName: string;
  customMessage?: string;
}

export default function StudentSetupPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
  
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    verifyInvitation();
  }, [token]);

  const verifyInvitation = async () => {
    if (!token) {
      setError('Invalid invitation link');
      setVerifying(false);
      return;
    }

    console.log('🔍 Verifying invitation with token:', token);

    try {
      // First try to find by invitation_token
      console.log('🔍 Searching by invitation_token...');
      let { data: invitation, error: inviteError } = await supabase
        .from('class_student_invitations')
        .select(`
          id,
          student_email,
          student_first_name,
          student_last_name,
          invitation_token,
          invitation_status,
          expires_at,
          custom_message,
          class_id
        `)
        .eq('invitation_token', token)
        .maybeSingle(); // Use maybeSingle to avoid error when not found

      console.log('🔍 Search by invitation_token result:', { found: !!invitation, error: inviteError });

      // If not found by invitation_token, try by ID (for backward compatibility)
      if (!invitation) {
        console.log('🔍 Searching by ID...');
        const { data: invitationById, error: idError } = await supabase
          .from('class_student_invitations')
          .select(`
            id,
            student_email,
            student_first_name,
            student_last_name,
            invitation_token,
            invitation_status,
            expires_at,
            custom_message,
            class_id
          `)
          .eq('id', token)
          .maybeSingle(); // Use maybeSingle to avoid error when not found
        
        console.log('🔍 Search by ID result:', { found: !!invitationById, error: idError });
        
        invitation = invitationById;
        inviteError = idError;
      }

      if (!invitation) {
        console.error('❌ Invitation not found:', { 
          token, 
          tokenLength: token.length,
          isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token),
          error: inviteError 
        });
        
        // Let's also check if there are any invitations at all for debugging
        const { data: allInvitations } = await supabase
          .from('class_student_invitations')
          .select('id, invitation_token, student_email')
          .limit(5);
        
        console.log('🔍 Sample invitations in DB:', allInvitations);
        
        setError('Invalid or expired invitation');
        setVerifying(false);
        return;
      }

      console.log('✅ Invitation found:', { 
        id: invitation.id, 
        email: invitation.student_email,
        status: invitation.invitation_status,
        hasToken: !!invitation.invitation_token
      });

      // Fetch class and teacher info separately to avoid nested query issues
      let className = 'Your Class';
      let teacherName = 'Your Teacher';
      
      if (invitation.class_id) {
        const { data: classData } = await supabase
          .from('classes')
          .select(`
            name,
            teacher_id
          `)
          .eq('id', invitation.class_id)
          .single();
        
        if (classData) {
          className = classData.name;
          
          // Fetch teacher info
          if (classData.teacher_id) {
            const { data: teacherData } = await supabase
              .from('teachers')
              .select('first_name, last_name')
              .eq('id', classData.teacher_id)
              .single();
            
            if (teacherData) {
              teacherName = `${teacherData.first_name} ${teacherData.last_name}`;
            }
          }
        }
      }

      // Add the class and teacher info to the invitation object
      invitation = {
        ...invitation,
        classes: {
          name: className,
          teachers: {
            first_name: teacherName.split(' ')[0] || 'Unknown',
            last_name: teacherName.split(' ')[1] || 'Teacher'
          }
        }
      };

      // Check if invitation is already accepted
      if (invitation.invitation_status === 'accepted') {
        setError('This invitation has already been accepted');
        setVerifying(false);
        return;
      }

      // Check if invitation is expired
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        setError('This invitation has expired');
        setVerifying(false);
        return;
      }

      // Use teacher-provided names if available, otherwise parse email to suggest names
      const emailParts = invitation.student_email.split('@')[0].split('.');
      
      setInvitationData({
        id: invitation.id,
        studentEmail: invitation.student_email,
        className: invitation.classes?.name || 'Unknown Class',
        teacherName: invitation.classes?.teachers 
          ? `${invitation.classes.teachers.first_name} ${invitation.classes.teachers.last_name}`
          : 'Unknown Teacher',
        customMessage: invitation.custom_message
      });
      
      // Pre-fill with teacher-provided names or suggested names from email
      setFormData(prev => ({
        ...prev,
        firstName: invitation.student_first_name || emailParts[0]?.charAt(0).toUpperCase() + emailParts[0]?.slice(1) || '',
        lastName: invitation.student_last_name || emailParts[1]?.charAt(0).toUpperCase() + emailParts[1]?.slice(1) || ''
      }));
      
    } catch (error) {
      console.error('Error verifying invitation:', error);
      setError('Failed to verify invitation');
    } finally {
      setVerifying(false);
    }
  };

  const validatePassword = (password: string): string[] => {
    const errors = [];
    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number');
    return errors;
  };

  const handlePasswordChange = (password: string) => {
    setFormData(prev => ({ ...prev, password }));
    setPasswordErrors(validatePassword(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationData) return;
    
    // Validate form
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your first and last name',
        variant: 'destructive'
      });
      return;
    }
    
    if (passwordErrors.length > 0) {
      toast({
        title: 'Error',
        description: 'Please fix password errors',
        variant: 'destructive'
      });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitationData.studentEmail,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'student'
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Create student record (students don't have tenant associations)
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: authData.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: invitationData.studentEmail,
          tenant_id: null, // Students don't belong to tenants
          status: 'active'
        })
        .select()
        .single();

      if (studentError) {
        console.error('Error creating student record:', studentError);
        toast({
          title: 'Warning',
          description: 'Account created but student profile could not be saved. Please contact support.',
          variant: 'destructive'
        });
        // Continue even if student record fails - we can fix this later
      } else {
        console.log('✅ Student record created:', studentData.id);
      }

      // Update invitation status
      const { error: updateError } = await supabase
        .from('class_student_invitations')
        .update({
          invitation_status: 'accepted',
          responded_at: new Date().toISOString(),
          student_id: studentData?.id
        })
        .eq('id', invitationData.id);

      if (updateError) {
        console.error('Error updating invitation:', updateError);
      }

      // Create enrollment record if student was created
      if (studentData) {
        const { data: invitation } = await supabase
          .from('class_student_invitations')
          .select('class_id')
          .eq('id', invitationData.id)
          .single();

        if (invitation?.class_id) {
          const { error: enrollmentError } = await supabase
            .from('class_student_enrollments')
            .insert({
              class_id: invitation.class_id,
              student_id: studentData.id,
              enrollment_date: new Date().toISOString(),
              status: 'active'
            });

          if (enrollmentError) {
            console.error('Error creating enrollment:', enrollmentError);
          }
        }
      }

      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitationData.studentEmail,
        password: formData.password
      });

      if (signInError) {
        toast({
          title: 'Account created successfully',
          description: 'Please sign in with your new credentials',
        });
        navigate('/login');
      } else {
        toast({
          title: 'Welcome!',
          description: 'Your account has been created successfully',
        });
        navigate('/student/dashboard');
      }
    } catch (error: any) {
      console.error('Error setting up student account:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to set up account',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-center">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate('/login')} variant="outline">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] rounded-full mx-auto mb-4">
            <User className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-center">Welcome to {invitationData?.className}!</CardTitle>
          <CardDescription className="text-center">
            Set up your student account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitationData?.customMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>Message from {invitationData.teacherName}:</strong>
              </p>
              <p className="text-sm text-blue-800 mt-2">{invitationData.customMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>Account email: <strong>{invitationData?.studentEmail}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
              />
              {passwordErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordErrors.map((error, index) => (
                    <p key={index} className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </p>
                  ))}
                </div>
              )}
              {formData.password && passwordErrors.length === 0 && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                  <CheckCircle className="w-3 h-3" />
                  Password meets all requirements
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Create Account & Join Class
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Button variant="link" className="p-0" onClick={() => navigate('/login')}>
              Sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}