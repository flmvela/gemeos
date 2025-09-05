/**
 * Domain Assignment Overview Component
 * Shows overall domain assignment statistics and management interface
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { domainAssignmentService } from '@/services/domain-assignment.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  BookOpen, 
  Building2, 
  Users, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye
} from 'lucide-react';

export function DomainOverview() {
  // Fetch domain assignment statistics
  const { 
    data: stats, 
    isLoading: statsLoading,
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['domain-assignment-stats'],
    queryFn: () => domainAssignmentService.getDomainAssignmentStats(),
  });

  // Fetch all domain assignments for overview
  const { 
    data: assignments = [], 
    isLoading: assignmentsLoading,
    refetch: refetchAssignments
  } = useQuery({
    queryKey: ['all-tenant-domain-assignments'],
    queryFn: () => domainAssignmentService.getAllTenantDomainAssignments(),
  });

  const isLoading = statsLoading || assignmentsLoading;

  const handleRefresh = () => {
    refetchStats();
    refetchAssignments();
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Inactive
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Domains</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats?.total_domains || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Available learning domains
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats?.total_assignments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Domain-tenant assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? '...' : stats?.active_assignments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants with Domains</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats?.tenants_with_assignments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Tenants with assigned domains
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Domain Assignments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Domain Assignments</CardTitle>
              <CardDescription>
                Overview of all tenant-domain assignments in the system
              </CardDescription>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Max Teachers</TableHead>
                  <TableHead>Max Students</TableHead>
                  <TableHead>Assigned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading assignments...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-12 w-12 opacity-50" />
                        <p className="font-medium">No domain assignments found</p>
                        <p className="text-sm">Create tenants and assign domains to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.slice(0, 10).map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="font-medium">
                          {assignment.tenant_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          {assignment.domain?.name || 'Unknown Domain'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(assignment.is_active)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{assignment.max_teachers}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{assignment.max_students}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(assignment.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {assignments.length > 10 && (
            <div className="text-sm text-muted-foreground mt-4 text-center">
              Showing first 10 of {assignments.length} assignments
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}