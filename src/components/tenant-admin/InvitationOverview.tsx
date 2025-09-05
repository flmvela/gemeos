/**
 * Invitation Overview Component
 * Shows invitation statistics and recent invitations
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { invitationService } from '@/services/invitation.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  X,
  RefreshCw,
  TrendingUp,
  Users
} from 'lucide-react';

interface InvitationOverviewProps {
  tenantId?: string;
}

export function InvitationOverview({ tenantId }: InvitationOverviewProps) {
  // Fetch invitation statistics
  const { 
    data: stats, 
    isLoading: statsLoading,
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['invitation-stats', tenantId],
    queryFn: () => tenantId ? invitationService.getInvitationStats(tenantId) : Promise.resolve(null),
    enabled: !!tenantId,
  });

  // Fetch recent invitations
  const { 
    data: recentInvitations = [], 
    isLoading: invitationsLoading,
    refetch: refetchInvitations
  } = useQuery({
    queryKey: ['recent-invitations', tenantId],
    queryFn: () => invitationService.getInvitations({ 
      tenant_id: tenantId,
    }),
  });

  const isLoading = statsLoading || invitationsLoading;

  const handleRefresh = () => {
    refetchStats();
    refetchInvitations();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-blue-600" />;
      case 'accepted':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'expired':
        return <AlertCircle className="h-3 w-3 text-orange-600" />;
      case 'cancelled':
        return <X className="h-3 w-3 text-red-600" />;
      default:
        return <Mail className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-blue-600';
      case 'accepted':
        return 'text-green-600';
      case 'expired':
        return 'text-orange-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats?.total_invitations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time invitations sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? '...' : stats?.pending_invitations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? '...' : stats?.accepted_invitations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully joined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {isLoading ? '...' : stats?.expired_invitations || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Need to be resent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invitations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Invitations</CardTitle>
              <CardDescription>
                Latest invitation activity{tenantId ? ' for this tenant' : ''}
              </CardDescription>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Loading invitations...
              </div>
            ) : recentInvitations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Mail className="h-12 w-12 opacity-50" />
                  <p className="font-medium">No invitations found</p>
                  <p className="text-sm">Send your first invitation to get started</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvitations.slice(0, 5).map((invitation) => (
                  <div 
                    key={invitation.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invitation.status)}
                        <span className="font-medium">{invitation.email}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {invitation.role_name.replace('_', ' ')}
                      </Badge>
                      {invitation.tenant && (
                        <Badge variant="secondary" className="text-xs">
                          {invitation.tenant.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className={getStatusColor(invitation.status)}>
                        {invitation.status}
                      </span>
                      <span>
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {recentInvitations.length > 5 && (
                  <div className="text-sm text-muted-foreground text-center pt-2 border-t">
                    Showing 5 of {recentInvitations.length} invitations
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}