/**
 * Invitation List Component
 * Displays list of invitations with management actions
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationService, type InvitationFilters, type Invitation, type InvitationStatus } from '@/services/invitation.service';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Mail, 
  MoreHorizontal, 
  Users, 
  RefreshCw,
  Search,
  Filter,
  Send,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  Shield,
  UserX
} from 'lucide-react';
import { SystemRole } from '@/types/auth.types';

interface InvitationListProps {
  tenantId?: string;
  showTenantColumn?: boolean;
}

export function InvitationList({ tenantId, showTenantColumn = false }: InvitationListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<InvitationFilters>({
    tenant_id: tenantId,
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch invitations
  const { 
    data: invitations = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['invitations', filters],
    queryFn: () => invitationService.getInvitations(filters),
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => invitationService.cancelInvitation(invitationId),
    onSuccess: () => {
      toast({
        title: 'Invitation Cancelled',
        description: 'The invitation has been cancelled successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel invitation.',
        variant: 'destructive',
      });
    },
  });

  // Resend invitation mutation
  const resendInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => invitationService.resendInvitation(invitationId),
    onSuccess: () => {
      toast({
        title: 'Invitation Resent',
        description: 'The invitation has been resent with a new expiration date.',
      });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend invitation.',
        variant: 'destructive',
      });
    },
  });

  // Apply search filter
  const filteredInvitations = invitations.filter(invitation => 
    !searchTerm || 
    invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invitation.tenant?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleFilterChange = (key: keyof InvitationFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const getStatusBadge = (status: InvitationStatus) => {
    const variants = {
      pending: { variant: 'default' as const, icon: Clock, color: 'text-blue-600' },
      accepted: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      expired: { variant: 'secondary' as const, icon: AlertCircle, color: 'text-orange-600' },
      cancelled: { variant: 'destructive' as const, icon: X, color: 'text-red-600' },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status}
      </Badge>
    );
  };

  const getRoleBadge = (role: SystemRole) => {
    const colors = {
      platform_admin: 'bg-purple-100 text-purple-800',
      tenant_admin: 'bg-blue-100 text-blue-800',
      teacher: 'bg-green-100 text-green-800',
      student: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={`flex items-center gap-1 ${colors[role] || 'bg-gray-100 text-gray-800'}`}>
        <Shield className="h-3 w-3" />
        {role.replace('_', ' ')}
      </Badge>
    );
  };

  const handleCancelInvitation = (invitation: Invitation) => {
    if (confirm(`Are you sure you want to cancel the invitation for "${invitation.email}"?`)) {
      cancelInvitationMutation.mutate(invitation.id);
    }
  };

  const handleResendInvitation = (invitation: Invitation) => {
    if (confirm(`Resend invitation to "${invitation.email}"? This will extend the expiration date.`)) {
      resendInvitationMutation.mutate(invitation.id);
    }
  };

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Error loading invitations: {error.message}</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-2">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invitations..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.role || 'all'} onValueChange={(value) => handleFilterChange('role', value)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="student">Student</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => refetch()} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Invitation Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              {showTenantColumn && <TableHead>Tenant</TableHead>}
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={showTenantColumn ? 7 : 6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Loading invitations...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredInvitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showTenantColumn ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Mail className="h-12 w-12 opacity-50" />
                    <p className="font-medium">No invitations found</p>
                    {searchTerm && (
                      <p className="text-sm">Try adjusting your search or filters</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{invitation.email}</span>
                    </div>
                  </TableCell>
                  {showTenantColumn && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{invitation.tenant?.name}</div>
                          <div className="text-sm text-muted-foreground">{invitation.tenant?.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    {getRoleBadge(invitation.role_name)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(invitation.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{invitation.invited_by_user?.email || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(invitation.expires_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {invitation.status === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => handleResendInvitation(invitation)}>
                              <Send className="h-4 w-4 mr-2" />
                              Resend Invitation
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleCancelInvitation(invitation)}
                              className="text-destructive"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          </>
                        )}
                        {invitation.status === 'expired' && (
                          <DropdownMenuItem onClick={() => handleResendInvitation(invitation)}>
                            <Send className="h-4 w-4 mr-2" />
                            Send New Invitation
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {filteredInvitations.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredInvitations.length} of {invitations.length} invitations
        </div>
      )}
    </div>
  );
}