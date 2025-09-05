/**
 * Teacher Management Component
 * Comprehensive interface for managing teachers within a tenant
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreVertical,
  CheckCircle,
  XCircle,
  Mail,
  Globe,
  Activity
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { tenantAdminService, type Teacher, type TeacherFilters } from '@/services/tenantAdmin.service';
import { AddTeacherModal } from './AddTeacherModal';
import { AssignDomainsModal } from './AssignDomainsModal';

export function TeacherManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TeacherFilters['status'] | 'all'>('all');
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [assignDomainsTeacher, setAssignDomainsTeacher] = useState<Teacher | null>(null);

  // Fetch teachers
  const { data: teachers = [], isLoading, error } = useQuery({
    queryKey: ['teachers', statusFilter],
    queryFn: () => tenantAdminService.getTeachers(
      statusFilter !== 'all' ? { status: statusFilter } : undefined
    ),
  });

  // Suspend teacher mutation
  const suspendMutation = useMutation({
    mutationFn: (teacherId: string) => tenantAdminService.suspendTeacher(teacherId),
    onSuccess: () => {
      toast({
        title: 'Teacher Suspended',
        description: 'The teacher account has been suspended.',
      });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to suspend teacher.',
        variant: 'destructive',
      });
    },
  });

  // Reactivate teacher mutation
  const reactivateMutation = useMutation({
    mutationFn: (teacherId: string) => tenantAdminService.reactivateTeacher(teacherId),
    onSuccess: () => {
      toast({
        title: 'Teacher Reactivated',
        description: 'The teacher account has been reactivated.',
      });
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reactivate teacher.',
        variant: 'destructive',
      });
    },
  });

  // Bulk suspend mutation
  const bulkSuspendMutation = useMutation({
    mutationFn: (teacherIds: string[]) => tenantAdminService.bulkSuspendTeachers(teacherIds),
    onSuccess: () => {
      toast({
        title: 'Teachers Suspended',
        description: `${selectedTeachers.length} teacher(s) have been suspended.`,
      });
      setSelectedTeachers([]);
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to suspend teachers.',
        variant: 'destructive',
      });
    },
  });

  // Filter teachers based on search
  const filteredTeachers = teachers.filter(teacher => {
    const searchLower = searchTerm.toLowerCase();
    return (
      teacher.email.toLowerCase().includes(searchLower) ||
      teacher.first_name.toLowerCase().includes(searchLower) ||
      teacher.last_name.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTeachers(filteredTeachers.map(t => t.user_id));
    } else {
      setSelectedTeachers([]);
    }
  };

  const handleSelectTeacher = (teacherId: string, checked: boolean) => {
    if (checked) {
      setSelectedTeachers([...selectedTeachers, teacherId]);
    } else {
      setSelectedTeachers(selectedTeachers.filter(id => id !== teacherId));
    }
  };

  const handleBulkSuspend = () => {
    if (selectedTeachers.length > 0) {
      bulkSuspendMutation.mutate(selectedTeachers);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load teachers. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Teacher Management</h2>
          <p className="text-muted-foreground">Manage teacher accounts and permissions</p>
        </div>
        <Button onClick={() => setShowAddTeacher(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teachers.filter(t => t.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teachers.filter(t => t.status === 'suspended').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Select 
                value={statusFilter} 
                onValueChange={(value) => setStatusFilter(value as any)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                </SelectContent>
              </Select>
              {selectedTeachers.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleBulkSuspend}
                  disabled={bulkSuspendMutation.isPending}
                >
                  Suspend Selected ({selectedTeachers.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedTeachers.length === filteredTeachers.length && filteredTeachers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Domains</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading teachers...
                  </TableCell>
                </TableRow>
              ) : filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No teachers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.user_id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTeachers.includes(teacher.user_id)}
                        onCheckedChange={(checked) => 
                          handleSelectTeacher(teacher.user_id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {teacher.first_name} {teacher.last_name}
                    </TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={teacher.status === 'active' ? 'default' : 
                                teacher.status === 'suspended' ? 'destructive' : 
                                'secondary'}
                      >
                        {teacher.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span>{teacher.domains?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setAssignDomainsTeacher(teacher)}
                          >
                            <Globe className="mr-2 h-4 w-4" />
                            Manage Domains
                          </DropdownMenuItem>
                          {teacher.status === 'active' ? (
                            <DropdownMenuItem 
                              onClick={() => suspendMutation.mutate(teacher.user_id)}
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => reactivateMutation.mutate(teacher.user_id)}
                              className="text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Reactivate
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
        </CardContent>
      </Card>

      {/* Modals */}
      {showAddTeacher && (
        <AddTeacherModal
          onClose={() => setShowAddTeacher(false)}
          onSuccess={() => {
            setShowAddTeacher(false);
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
          }}
        />
      )}

      {assignDomainsTeacher && (
        <AssignDomainsModal
          teacher={assignDomainsTeacher}
          onClose={() => setAssignDomainsTeacher(null)}
          onSuccess={() => {
            setAssignDomainsTeacher(null);
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
          }}
        />
      )}
    </div>
  );
}