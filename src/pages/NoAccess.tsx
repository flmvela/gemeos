import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, LogOut, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function NoAccess() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleRequestAccess = () => {
    // In a real implementation, this would send a request to admins
    window.location.href = `mailto:support@gemeos.ai?subject=Access Request&body=User ${user?.email} is requesting access to the Gemeos platform.`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-4 rounded-full">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">No Access to Platform</CardTitle>
          <CardDescription className="text-lg mt-2">
            Your account doesn't have access to any tenants
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Logged in as:</strong>
            </p>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Why am I seeing this?</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Your account exists but hasn't been assigned to any tenant</li>
              <li>You may be a new user waiting for approval</li>
              <li>Your tenant access may have been revoked</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-sm">What can I do?</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Contact your tenant administrator for access</li>
              <li>Request access using the button below</li>
              <li>Sign out and try a different account</li>
            </ul>
          </div>

          <div className="space-y-3 pt-4">
            <Button 
              onClick={handleRequestAccess}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <Mail className="mr-2 h-4 w-4" />
              Request Access
            </Button>
            
            <Button 
              onClick={handleSignOut}
              variant="outline"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}