import { useState, useEffect } from 'react';
import { supabase, apiCall } from '../utils/supabase/client';
import { AdminDashboard } from './pages/AdminDashboard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Eye, EyeOff } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  institution: string;
}

export function ModernAuth() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    name: '',
    institution: '',
    role: 'educator'
  });

  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: ''
  });

  useEffect(() => {
    // Check for existing session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.access_token);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Existing session:', session?.user?.email);
      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.access_token);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const fetchUserProfile = async (accessToken?: string) => {
    setProfileLoading(true);
    try {
      console.log('Fetching user profile...');
      const token = accessToken || (await supabase.auth.getSession()).data.session?.access_token;
      
      if (!token) {
        console.error('No access token available');
        setProfileLoading(false);
        return;
      }

      const response = await apiCall('/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profile fetched:', data.profile);
        setUserProfile(data.profile);
        
        // Clear any previous error messages on successful profile fetch
        if (message.includes('Error')) {
          setMessage('');
        }
      } else {
        const errorData = await response.json();
        console.error('Profile fetch failed:', errorData);
        setMessage(`Profile error: ${errorData.error || 'Failed to load profile'}`);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage('Error loading user profile. Please try signing in again.');
    }
    setProfileLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('Creating account for:', registerData.email, 'with role:', registerData.role);
      const response = await apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(registerData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Account created successfully! Signing you in...');
        // Now sign in
        const { error } = await supabase.auth.signInWithPassword({
          email: registerData.email,
          password: registerData.password
        });
        
        if (error) {
          setMessage(`Sign in error: ${error.message}`);
        }
      } else {
        setMessage(data.error || 'Signup failed');
      }
    } catch (error) {
      setMessage('Error during signup');
      console.error('Signup error:', error);
    }
    
    setLoading(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('Signing in:', loginData.email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (error) {
        setMessage(`Sign in error: ${error.message}`);
      } else {
        console.log('Sign in successful for:', data.user?.email);
        setMessage('Signed in successfully!');
      }
    } catch (error) {
      setMessage('Error during sign in');
      console.error('Sign in error:', error);
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordData.email);
      
      if (error) {
        setMessage(`Reset password error: ${error.message}`);
      } else {
        setMessage('Password reset email sent! Check your inbox.');
      }
    } catch (error) {
      setMessage('Error sending reset email');
      console.error('Reset password error:', error);
    }
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    console.log('Signing out...');
    await supabase.auth.signOut();
    setMessage('Signed out successfully!');
    setUser(null);
    setUserProfile(null);
  };

  // Debug info
  console.log('Current state:', {
    user: user?.email,
    userProfile: userProfile?.role,
    profileLoading
  });

  // Show loading while profile is being fetched
  if (user && profileLoading) {
    return (
      <Card className="w-full max-w-md mx-auto bg-white border-0">
        <CardContent className="py-8">
          <div className="text-center">
            <div className="h-8 w-8 bg-gradient-to-r from-sky-600 to-cyan-600 rounded-full animate-pulse mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show admin dashboard for admin users
  if (user && userProfile?.role === 'admin') {
    console.log('Rendering admin dashboard for:', user.email);
    return <AdminDashboard user={user} onSignOut={handleSignOut} />;
  }

  // Show regular user interface for non-admin users
  if (user && userProfile) {
    return (
      <Card className="w-full max-w-md mx-auto bg-white border-0">
        <CardHeader>
          <CardTitle>Welcome to Gemeos!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-medium">{userProfile.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center justify-center space-x-2 mt-2">
              <span className="text-sm text-muted-foreground capitalize">Role:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                userProfile.role === 'admin' ? 'bg-red-100 text-red-800' :
                userProfile.role === 'educator' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {userProfile.role}
              </span>
            </div>
            {userProfile.institution && (
              <p className="text-sm text-muted-foreground mt-1">{userProfile.institution}</p>
            )}
          </div>
          
          {userProfile.role === 'educator' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">Educator Portal</h3>
              <p className="text-sm text-blue-800">Access curriculum creation tools, student analytics, and personalized learning resources.</p>
            </div>
          )}
          
          {userProfile.role === 'student' && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-900 mb-2">Student Dashboard</h3>
              <p className="text-sm text-green-800">Continue your learning journey with AI-powered personalized curricula.</p>
            </div>
          )}

          <div className="space-y-2">
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              Sign Out
            </Button>
            
            {userProfile.role !== 'admin' && (
              <div className="space-y-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => fetchUserProfile()}
                  className="w-full text-xs"
                >
                  Refresh Profile
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={async () => {
                    try {
                      setMessage('Updating role to admin...');
                      const token = (await supabase.auth.getSession()).data.session?.access_token;
                      const response = await apiCall('/auth/fix-profile', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ role: 'admin' })
                      });
                      
                      if (response.ok) {
                        const data = await response.json();
                        setUserProfile(data.profile);
                        setMessage('Role updated to admin!');
                      } else {
                        const errorData = await response.json();
                        setMessage(`Error: ${errorData.error}`);
                      }
                    } catch (error) {
                      console.error('Update role error:', error);
                      setMessage('Error updating role');
                    }
                  }}
                  className="w-full text-xs text-red-600"
                >
                  Set Role to Admin
                </Button>
              </div>
            )}
          </div>

          {message && (
            <Alert>
              <AlertDescription className="whitespace-pre-wrap">{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show error state if user exists but no profile
  if (user && !userProfile && !profileLoading) {
    const fixProfile = async (role = 'admin') => {
      try {
        setMessage('Creating profile...');
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const response = await apiCall('/auth/fix-profile', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ role })
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.profile);
          setMessage('Profile created successfully!');
        } else {
          const errorData = await response.json();
          setMessage(`Error: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Fix profile error:', error);
        setMessage('Error creating profile');
      }
    };

    return (
      <Card className="w-full max-w-md mx-auto bg-white border-0">
        <CardHeader>
          <CardTitle>Profile Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Your account needs a profile setup. Click below to create your admin profile.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Button onClick={() => fixProfile('admin')} className="w-full bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white border-0">
              Create Admin Profile
            </Button>
            <Button onClick={() => fixProfile('educator')} variant="outline" className="w-full">
              Create Educator Profile
            </Button>
            <Button onClick={() => fetchUserProfile()} variant="ghost" className="w-full">
              Retry Loading Profile
            </Button>
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              Sign Out
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>User: {user.email}</p>
            <p>Choose your role to continue to the appropriate dashboard.</p>
          </div>
          
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show authentication form for non-authenticated users
  return (
    <Card className="w-full max-w-lg mx-auto bg-white border-0 shadow-xl">
      <CardContent className="p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="login" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
              Login
            </TabsTrigger>
            <TabsTrigger value="forgot" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
              Forgot Password
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white">
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Login to your account</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  placeholder="Enter your email"
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    placeholder="Enter your password"
                    className="bg-gray-50 border-gray-200 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleSignIn} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white border-0"
              >
                {loading ? 'Signing In...' : 'Login'}
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">Demo credentials</span>
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground space-y-1">
              <p><strong>Admin:</strong> admin@gemeos.ai / admin123</p>
              <p><strong>Educator:</strong> educator@school.edu / educator123</p>
            </div>
          </TabsContent>

          <TabsContent value="forgot" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Reset your password</h2>
              <p className="text-sm text-muted-foreground mt-2">Enter your email to receive a reset link</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotPasswordData.email}
                  onChange={(e) => setForgotPasswordData({...forgotPasswordData, email: e.target.value})}
                  placeholder="Enter your email"
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              <Button 
                onClick={handleForgotPassword} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white border-0"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="register" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Create your account</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  placeholder="Enter your email"
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    placeholder="Enter your password"
                    className="bg-gray-50 border-gray-200 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-name">Full Name</Label>
                <Input
                  id="register-name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                  placeholder="Enter your full name"
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-institution">Institution</Label>
                <Input
                  id="register-institution"
                  value={registerData.institution}
                  onChange={(e) => setRegisterData({...registerData, institution: e.target.value})}
                  placeholder="Enter your institution"
                  className="bg-gray-50 border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-role">Role</Label>
                <Select value={registerData.role} onValueChange={(value) => setRegisterData({...registerData, role: value})}>
                  <SelectTrigger className="bg-gray-50 border-gray-200">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="educator">Educator</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSignUp} 
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white border-0"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {message && (
          <Alert className="mt-4">
            <AlertDescription className="whitespace-pre-wrap">{message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}