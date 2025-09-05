/**
 * Global Limits Step
 * Third step of the tenant wizard for setting user limits
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, Shield, AlertTriangle, Info } from 'lucide-react';
import { useLimitsStep } from '@/stores/tenant-wizard.store';

export const GlobalLimitsStep: React.FC = () => {
  const { data, update, errors } = useLimitsStep();

  const totalDomainTeachers = 0; // TODO: Calculate from domain settings
  const totalDomainStudents = 0; // TODO: Calculate from domain settings

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="p-4 bg-muted/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium mb-1">Global User Limits</h4>
            <p className="text-sm text-muted-foreground">
              Set the maximum number of teachers and students allowed across all domains for this tenant. 
              These limits override individual domain limits when enforced.
            </p>
          </div>
        </div>
      </div>

      {/* Limit Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teachers Limit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Teacher Limit
            </CardTitle>
            <CardDescription>
              Maximum number of teachers allowed in this tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-teachers" className="text-sm font-medium">
                  Maximum Teachers *
                </Label>
                <Input
                  id="max-teachers"
                  type="number"
                  min="1"
                  max="10000"
                  placeholder="50"
                  value={data.global_max_teachers}
                  onChange={(e) => update({ 
                    global_max_teachers: Math.max(1, parseInt(e.target.value) || 1) 
                  })}
                  className={errors.some(e => e.includes('teacher')) ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 10-100 for most organizations
                </p>
              </div>

              {totalDomainTeachers > 0 && (
                <div className="p-3 bg-muted/50 rounded border">
                  <div className="text-xs text-muted-foreground mb-1">Domain-specific limits total:</div>
                  <div className="font-medium">{totalDomainTeachers} teachers</div>
                  {data.global_max_teachers < totalDomainTeachers && data.enforce_limits && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      Global limit is lower than domain totals
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Students Limit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Student Limit
            </CardTitle>
            <CardDescription>
              Maximum number of students allowed in this tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-students" className="text-sm font-medium">
                  Maximum Students *
                </Label>
                <Input
                  id="max-students"
                  type="number"
                  min="1"
                  max="100000"
                  placeholder="500"
                  value={data.global_max_students}
                  onChange={(e) => update({ 
                    global_max_students: Math.max(1, parseInt(e.target.value) || 1) 
                  })}
                  className={errors.some(e => e.includes('student')) ? 'border-destructive' : ''}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 100-5000 for most organizations
                </p>
              </div>

              {totalDomainStudents > 0 && (
                <div className="p-3 bg-muted/50 rounded border">
                  <div className="text-xs text-muted-foreground mb-1">Domain-specific limits total:</div>
                  <div className="font-medium">{totalDomainStudents} students</div>
                  {data.global_max_students < totalDomainStudents && data.enforce_limits && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      Global limit is lower than domain totals
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enforcement Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Limit Enforcement
          </CardTitle>
          <CardDescription>
            Control how strictly these limits are enforced
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="enforce-limits" className="text-sm font-medium">
                    Enforce Limits
                  </Label>
                  <Badge variant={data.enforce_limits ? "default" : "secondary"}>
                    {data.enforce_limits ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.enforce_limits 
                    ? "Users cannot exceed the configured limits" 
                    : "Limits are advisory only - users can exceed them"
                  }
                </p>
              </div>
              <Switch
                id="enforce-limits"
                checked={data.enforce_limits}
                onCheckedChange={(checked) => update({ enforce_limits: checked })}
              />
            </div>

            {!data.enforce_limits && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <div className="font-medium">Limits Not Enforced</div>
                    <div>
                      When disabled, these limits serve as guidelines only. 
                      Administrators can still add users beyond these limits.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Limits Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-2xl font-bold text-primary">
                {data.global_max_teachers.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Maximum Teachers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {data.global_max_students.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Maximum Students</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Users Allowed:</span>
              <span className="font-semibold">
                {(data.global_max_teachers + data.global_max_students).toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-muted-foreground">Enforcement:</span>
              <Badge variant={data.enforce_limits ? "default" : "secondary"}>
                {data.enforce_limits ? "Strict" : "Advisory"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">Recommendations</div>
            <ul className="space-y-1 text-xs">
              <li>• Set teacher limits based on your organization size and growth plans</li>
              <li>• Student limits should account for multiple classes and future enrollment</li>
              <li>• Enable enforcement for production tenants to prevent unexpected costs</li>
              <li>• You can adjust these limits later from the tenant settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};