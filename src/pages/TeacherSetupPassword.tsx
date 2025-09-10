/**
 * Teacher Password Setup Page
 * Allows teachers to set their password after receiving an invitation
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { teacherService } from '@/services/teacher.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters long', test: (pw) => pw.length >= 8 },
  { label: 'Contains at least one uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Contains at least one lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { label: 'Contains at least one number', test: (pw) => /[0-9]/.test(pw) },
  { label: 'Contains at least one special character', test: (pw) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) },
];

export default function TeacherSetupPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teacherEmail, setTeacherEmail] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);

  // Get token from URL
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid or missing invitation link');
        setIsVerifying(false);
        return;
      }

      try {
        // Look up the invitation by token
        const { data: invitation, error: invError } = await supabase
          .from('invitations')
          .select(`
            *,
            tenant:tenants(name)
          `)
          .eq('invitation_token', token)
          .eq('status', 'pending')
          .single();

        if (invError || !invitation) {
          console.error('Invitation lookup error:', invError);
          setError('This invitation link is invalid or has expired. Please contact your administrator for a new invitation.');
          setIsVerifying(false);
          return;
        }

        // Check if invitation has expired
        if (new Date(invitation.expires_at) < new Date()) {
          setError('This invitation has expired. Please contact your administrator for a new invitation.');
          setIsVerifying(false);
          return;
        }

        // Store invitation email and tenant name
        setTeacherEmail(invitation.email);
        setTenantName(invitation.tenant?.name || 'Gemeos Academy');

        setIsVerifying(false);
      } catch (err) {
        console.error('Error verifying token:', err);
        setError('Failed to verify invitation link. Please try again or contact support.');
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive'
      });
      return;
    }

    const allRequirementsMet = passwordRequirements.every(req => req.test(password));
    if (!allRequirementsMet) {
      toast({
        title: 'Password requirements not met',
        description: 'Please ensure your password meets all the requirements.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!token) {
        throw new Error('Invalid invitation token');
      }

      // Use the teacher service to accept the invitation and create the account
      const result = await teacherService.acceptTeacherInvitation(token, password);
      
      if (result.success) {
        // Try to sign in with the new password
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: result.email,
          password: password
        });

        if (authError) {
          // If sign in fails, still show success but ask them to log in
          toast({
            title: 'Account created successfully!',
            description: 'Please log in with your new password.',
          });
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        } else {
          toast({
            title: 'Welcome to Gemeos!',
            description: 'Your account has been created and you are now logged in.',
          });
          setTimeout(() => {
            navigate('/teacher/dashboard');
          }, 1500);
        }
      } else {
        throw new Error('Failed to accept invitation');
      }

    } catch (err) {
      console.error('Error setting password:', err);
      setError(err instanceof Error ? err.message : 'Failed to set password. Please try again.');
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-gray-600">Verifying your invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !teacherEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] rounded-full">
              <Lock className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Set Your Password</CardTitle>
          <CardDescription className="text-center">
            Welcome to {tenantName || 'Gemeos Academy'}! 
            {teacherEmail && (
              <span className="block mt-1 font-medium text-gray-700">{teacherEmail}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password requirements */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
              {passwordRequirements.map((req, index) => {
                const isMet = password.length > 0 && req.test(password);
                return (
                  <div key={index} className="flex items-center gap-2">
                    {isMet ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className={`text-sm ${isMet ? 'text-green-600' : 'text-gray-600'}`}>
                      {req.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed]"
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Password...
                </>
              ) : (
                'Set Password & Continue'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}