/**
 * Edit Teacher Page
 * Allows tenant admins to edit teacher information
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Phone, BookOpen, Calendar, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDomains } from '@/hooks/useDomains';
import { useAuth } from '@/hooks/useAuth';

interface TeacherData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  status: 'active' | 'inactive' | 'on_leave';
  bio?: string;
}

interface TeacherDomain {
  domain_id: string;
  is_primary: boolean;
  certification_level: string;
  domains: {
    id: string;
    name: string;
  };
}

export function EditTeacherPage() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenantData } = useAuth();
  const { domains, loading: domainsLoading } = useDomains(tenantData?.tenant_id);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacher, setTeacher] = useState<TeacherData | null>(null);
  const [teacherDomains, setTeacherDomains] = useState<string[]>([]);
  const [primaryDomainId, setPrimaryDomainId] = useState<string>('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    status: 'active' as const,
    bio: ''
  });

  // Fetch teacher data
  useEffect(() => {
    const fetchTeacher = async () => {
      if (!teacherId) return;

      try {
        setLoading(true);

        // Fetch teacher basic info
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', teacherId)
          .single();

        if (teacherError) throw teacherError;

        // Fetch teacher's email from user_tenants
        const { data: userTenantData, error: userTenantError } = await supabase
          .from('user_tenants')
          .select('email')
          .eq('user_id', teacherData.user_id)
          .single();

        if (userTenantError) throw userTenantError;

        const fullTeacher = {
          ...teacherData,
          email: userTenantData.email
        };

        setTeacher(fullTeacher);
        setFormData({
          first_name: teacherData.first_name || '',
          last_name: teacherData.last_name || '',
          phone_number: teacherData.phone_number || '',
          status: teacherData.status || 'active',
          bio: teacherData.bio || ''
        });

        // Fetch teacher's assigned domains (without join to avoid foreign key issues)
        const { data: domainsData, error: domainsError } = await supabase
          .from('teacher_domains')
          .select('domain_id, is_primary, certification_level')
          .eq('teacher_id', teacherId);

        if (domainsError) {
          console.error('Error fetching teacher domains:', domainsError);
        } else if (domainsData && domainsData.length > 0) {
          console.log('Fetched teacher domains:', domainsData);
          const assignedDomainIds = domainsData.map(td => td.domain_id);
          setTeacherDomains(assignedDomainIds);
          
          const primaryDomain = domainsData.find(td => td.is_primary);
          if (primaryDomain) {
            setPrimaryDomainId(primaryDomain.domain_id);
          }
        } else {
          console.log('No domains assigned to teacher');
        }
      } catch (error) {
        console.error('Error fetching teacher:', error);
        toast({
          title: 'Error',
          description: 'Failed to load teacher information',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [teacherId, toast]);

  const handleSave = async () => {
    if (!teacherId || !teacher) return;

    try {
      setSaving(true);

      // Update teacher basic info
      const { error: updateError } = await supabase
        .from('teachers')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number,
          status: formData.status,
          bio: formData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacherId);

      if (updateError) throw updateError;

      // Update teacher domains
      // First, delete existing domain assignments
      const { error: deleteError } = await supabase
        .from('teacher_domains')
        .delete()
        .eq('teacher_id', teacherId);

      if (deleteError) {
        console.error('Error deleting existing domains:', deleteError);
        throw deleteError;
      }

      // Then insert new domain assignments
      if (teacherDomains.length > 0) {
        const domainAssignments = teacherDomains.map(domainId => ({
          teacher_id: teacherId,
          domain_id: domainId,
          is_primary: domainId === primaryDomainId,
          certification_level: 'intermediate' // Default, could be made configurable
        }));

        console.log('Inserting domain assignments:', domainAssignments);
        
        const { data: insertData, error: insertError } = await supabase
          .from('teacher_domains')
          .insert(domainAssignments)
          .select();

        if (insertError) {
          console.error('Error inserting domains:', insertError);
          throw insertError;
        } else {
          console.log('Successfully inserted domains:', insertData);
        }
      }

      toast({
        title: 'Success',
        description: 'Teacher information updated successfully'
      });

      navigate('/tenant/dashboard');
    } catch (error) {
      console.error('Error saving teacher:', error);
      toast({
        title: 'Error',
        description: 'Failed to save teacher information',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleDomain = (domainId: string) => {
    setTeacherDomains(prev => {
      if (prev.includes(domainId)) {
        // If removing the primary domain, clear primary selection
        if (domainId === primaryDomainId) {
          setPrimaryDomainId('');
        }
        return prev.filter(id => id !== domainId);
      }
      return [...prev, domainId];
    });
  };

  if (loading || domainsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>Teacher not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/tenant/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Edit Teacher</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/tenant/dashboard')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={teacher.email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive' | 'on_leave') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Domains */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Assigned Learning Domains
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {domains.map((domain) => {
                const isAssigned = teacherDomains.includes(domain.id);
                const isPrimary = domain.id === primaryDomainId;
                
                return (
                  <div
                    key={domain.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isAssigned ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isAssigned}
                        onCheckedChange={() => toggleDomain(domain.id)}
                      />
                      <div>
                        <p className="font-medium">{domain.name}</p>
                        {domain.description && (
                          <p className="text-sm text-muted-foreground">{domain.description}</p>
                        )}
                      </div>
                    </div>
                    {isAssigned && (
                      <div className="flex items-center gap-2">
                        {isPrimary && (
                          <Badge variant="secondary">Primary</Badge>
                        )}
                        {!isPrimary && teacherDomains.length > 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPrimaryDomainId(domain.id)}
                          >
                            Set as Primary
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {teacherDomains.length === 0 && (
              <Alert>
                <AlertDescription>
                  Please assign at least one domain to this teacher
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}