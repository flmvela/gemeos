import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAllPagePermissions, useUpdatePagePermissions } from '@/hooks/usePagePermissions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const roles = ['admin', 'teacher', 'student'] as const;

export default function PagePermissions() {
  const { data: pages, isLoading } = useAllPagePermissions();
  const { updatePermission, isLoading: isUpdating } = useUpdatePagePermissions();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handlePermissionChange = async (pageId: string, role: string, checked: boolean) => {
    try {
      await updatePermission(pageId, role, checked);
      queryClient.invalidateQueries({ queryKey: ['all-page-permissions'] });
      toast({
        title: "Permission Updated",
        description: `Successfully ${checked ? 'enabled' : 'disabled'} ${role} access.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permission. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPermissionStatus = (pagePermissions: any[], role: string) => {
    const permission = pagePermissions.find(p => p.role === role);
    return permission?.is_active || false;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="flex space-x-8">
                {roles.map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Page Permissions</h1>
        <p className="text-muted-foreground">
          Manage which user roles can access different pages in the application.
        </p>
      </div>

      <div className="space-y-4">
        {pages?.map((page) => (
          <Card key={page.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{page.description}</CardTitle>
                  <CardDescription>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {page.path}
                    </code>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-8">
                {roles.map((role) => {
                  const isActive = getPermissionStatus(page.permissions, role);
                  return (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${page.id}-${role}`}
                        checked={isActive}
                        disabled={isUpdating}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(page.id, role, !!checked)
                        }
                      />
                      <label
                        htmlFor={`${page.id}-${role}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        <Badge 
                          variant={isActive ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {isActive ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <X className="h-3 w-3 mr-1" />
                          )}
                          {role}
                        </Badge>
                      </label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}