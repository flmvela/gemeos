import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardUrlForUser } from '@/utils/auth-redirects';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const handleDashboardClick = () => {
    const dashboardUrl = getDashboardUrlForUser(session);
    navigate(dashboardUrl);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Please contact your administrator if you believe this is an error.
          </p>
          <div className="flex justify-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
            <Button 
              onClick={handleDashboardClick}
            >
              My Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}