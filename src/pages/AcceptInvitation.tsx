import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Building2,
  UserPlus,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { invitationService, type Invitation } from '@/services/invitation.service';

interface PasswordStrength {
  score: number;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
  };
}

const AcceptInvitation: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get URL parameters
  const tenantSlug = searchParams.get('tenant');
  const invitationId = searchParams.get('invitationId');
  const token = searchParams.get('token');

  // Component state
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    requirements: {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
    },
  });

  // Load invitation on mount
  useEffect(() => {
    loadInvitation();
  }, [token, invitationId, tenantSlug]);

  // Calculate password strength whenever password changes
  useEffect(() => {
    calculatePasswordStrength(password);
  }, [password]);

  const loadInvitation = async () => {
    // Try to get invitation ID from either token or invitationId parameter
    const invitationIdToUse = token || invitationId;
    
    try {
      setIsLoading(true);
      let invitationData: any = null;
      
      if (invitationIdToUse) {
        // Try with the provided token/invitation ID first
        try {
          invitationData = await invitationService.getInvitationByToken(invitationIdToUse);
        } catch (error) {
          console.log('🔍 Failed to load invitation by token:', error);
          // Continue to fallback logic
        }
      }
      
      // If no invitation found and we have a tenant ID, try fallback method
      if (!invitationData && tenantSlug) {
        console.log('🔍 No invitation found with token, trying tenant fallback:', tenantSlug);
        console.log('🔍 Available URL parameters:', { token, invitationId, tenantSlug });
        invitationData = await invitationService.getPendingInvitationByTenant(tenantSlug);
        console.log('🔍 Tenant fallback result:', invitationData ? 'Found invitation' : 'No invitation found');
      }
      
      if (!invitationData) {
        setError('Invitation not found. The link may be invalid or has already been used.');
        setIsLoading(false);
        return;
      }

      // Check if invitation is expired
      if (new Date(invitationData.expires_at) < new Date()) {
        setError('This invitation has expired. Please contact your administrator for a new invitation.');
        setIsLoading(false);
        return;
      }

      // Check if invitation is still pending
      if (invitationData.status !== 'pending') {
        setError('This invitation has already been used or cancelled.');
        setIsLoading(false);
        return;
      }

      setInvitation(invitationData);
      setError('');
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Failed to load invitation. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePasswordStrength = (pwd: string) => {
    const requirements = {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
    };

    const score = Object.values(requirements).filter(Boolean).length;

    setPasswordStrength({
      score,
      requirements,
    });
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score === 0) return 'bg-gray-200';
    if (passwordStrength.score === 1) return 'bg-red-500';
    if (passwordStrength.score === 2) return 'bg-orange-500';
    if (passwordStrength.score === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score === 0) return '';
    if (passwordStrength.score === 1) return 'Weak';
    if (passwordStrength.score === 2) return 'Fair';
    if (passwordStrength.score === 3) return 'Good';
    return 'Strong';
  };

  const validateForm = (): boolean => {
    // Check password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Check all password requirements
    if (passwordStrength.score < 4) {
      setError('Please meet all password requirements');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !invitation) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Create a new user account with the invitation email and password
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
      });

      if (signUpError) {
        throw new Error(`Failed to create account: ${signUpError.message}`);
      }

      if (!signUpData.user) {
        throw new Error('Failed to create user account');
      }

      console.log('✅ Created user account:', signUpData.user.email);

      // If email confirmation is required, we might need to handle that
      // For now, let's try to sign in immediately
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password: password,
      });

      if (signInError) {
        throw new Error(`Failed to sign in: ${signInError.message}`);
      }

      if (!signInData.user) {
        throw new Error('Failed to authenticate user');
      }

      // Accept the invitation (this will add user to tenant)
      await invitationService.acceptInvitation(invitation.id, signInData.user.id);

      // Show success message
      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 2000);
      
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to activate account. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Error state (expired or invalid invitation)
  if (!invitation && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Invalid Invitation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
              <div className="text-center">
                <Link to="/welcome">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Activated Successfully!</h1>
          <p className="text-gray-600 mb-6">
            Welcome to {invitation?.tenant?.name}. You're being redirected to your dashboard...
          </p>
          <div className="animate-pulse text-sm text-gray-500">
            Redirecting to dashboard...
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Accept Invitation Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Accept Invitation</CardTitle>
            <CardDescription className="text-gray-600">
              Set your password to activate your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Invitation Context */}
            {invitation && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <Building2 className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Organization: <strong>{invitation.tenant?.name}</strong></span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Shield className="w-4 h-4 mr-2 text-blue-600" />
                  <span>Role: <strong>{invitation.role?.display_name || invitation.role_name}</strong></span>
                </div>
                <div className="text-xs text-gray-600">
                  Invited by Administrator
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Password strength</span>
                      <span className="text-xs font-medium text-gray-700">{getPasswordStrengthText()}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className={`text-xs flex items-center ${passwordStrength.requirements.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        At least 8 characters
                      </div>
                      <div className={`text-xs flex items-center ${passwordStrength.requirements.hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        One uppercase letter
                      </div>
                      <div className={`text-xs flex items-center ${passwordStrength.requirements.hasLowercase ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        One lowercase letter
                      </div>
                      <div className={`text-xs flex items-center ${passwordStrength.requirements.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        One number
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-medium border-0"
                disabled={isSubmitting || passwordStrength.score < 4}
              >
                {isSubmitting ? 'Setting Password...' : 'Set Password & Accept Invitation'}
              </Button>
            </form>

            {/* Help Text */}
            <div className="text-center text-sm text-gray-500">
              Need help? Contact your administrator or{' '}
              <Link to="/support" className="text-blue-600 hover:underline">
                support team
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AcceptInvitation;