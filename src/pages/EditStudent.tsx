import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Save, User, Mail, Calendar, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  studentId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  status: string;
  enrolledClasses: string[];
}

export default function EditStudent() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<Array<{id: string, name: string}>>([]);
  
  const [studentData, setStudentData] = useState<StudentData>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    studentId: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    status: 'active',
    enrolledClasses: []
  });

  const [errors, setErrors] = useState<Partial<StudentData>>({});

  useEffect(() => {
    fetchStudentData();
    fetchClasses();
  }, [studentId, session]);

  const fetchStudentData = async () => {
    if (!studentId || !session?.user_id) return;

    try {
      setLoading(true);

      // First fetch the specific invitation to get student details
      const { data: invitation, error } = await supabase
        .from('class_student_invitations')
        .select(`
          id,
          student_email,
          student_first_name,
          student_last_name,
          parent_name,
          parent_email,
          parent_phone,
          invitation_status
        `)
        .eq('id', studentId)
        .single();

      if (error) throw error;

      if (invitation) {
        // Now fetch ALL class invitations for this student email
        const { data: allInvitations } = await supabase
          .from('class_student_invitations')
          .select('class_id')
          .eq('student_email', invitation.student_email);

        const enrolledClassIds = allInvitations?.map(inv => inv.class_id).filter(Boolean) || [];

        // Use actual names from database, fallback to email parsing
        const emailParts = invitation.student_email.split('@')[0].split('.');
        
        setStudentData({
          id: invitation.id,
          firstName: invitation.student_first_name || emailParts[0] || '',
          lastName: invitation.student_last_name || emailParts[1] || '',
          email: invitation.student_email,
          dateOfBirth: '',
          studentId: '',
          parentName: invitation.parent_name || '',
          parentEmail: invitation.parent_email || '',
          parentPhone: invitation.parent_phone || '',
          status: invitation.invitation_status,
          enrolledClasses: enrolledClassIds
        });
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      toast({
        title: 'Error',
        description: 'Failed to load student data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    if (!session?.user_id) return;

    try {
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', session.user_id)
        .single();

      if (!teacherData) return;

      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', teacherData.id)
        .eq('status', 'active');

      setAvailableClasses(classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const updateData = (field: keyof StudentData, value: any) => {
    setStudentData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const newErrors: Partial<StudentData> = {};
    
    if (!studentData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!studentData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!studentData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (studentData.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentData.parentEmail)) {
      newErrors.parentEmail = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Get teacher data
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', session?.user_id)
        .single();

      if (!teacherData) throw new Error('Teacher not found');

      // First, delete all existing invitations for this student
      const { error: deleteError } = await supabase
        .from('class_student_invitations')
        .delete()
        .eq('student_email', studentData.email)
        .in('class_id', (await supabase
          .from('classes')
          .select('id')
          .eq('teacher_id', teacherData.id)).data?.map(c => c.id) || []);

      if (deleteError) console.error('Error deleting old invitations:', deleteError);

      // Create new invitations for selected classes
      if (studentData.enrolledClasses.length > 0) {
        const invitations = studentData.enrolledClasses.map(classId => ({
          class_id: classId,
          student_email: studentData.email,
          student_first_name: studentData.firstName,
          student_last_name: studentData.lastName,
          parent_name: studentData.parentName,
          parent_email: studentData.parentEmail,
          parent_phone: studentData.parentPhone,
          invitation_status: studentData.status === 'accepted' ? 'accepted' : 'pending'
        }));

        const { error: insertError } = await supabase
          .from('class_student_invitations')
          .insert(invitations);

        if (insertError) throw insertError;
      }

      toast({
        title: 'Success',
        description: 'Student information and class assignments updated successfully',
      });

      navigate('/teacher/students');
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: 'Error',
        description: 'Failed to update student information',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/teacher/students')}
                className="h-10 w-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Edit Student</h1>
                <p className="text-sm text-gray-600 mt-1">Update student information</p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:shadow-lg"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Status Badge */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600">Status:</span>
          <Badge 
            variant={studentData.status === 'accepted' ? 'default' : 'secondary'}
            className={studentData.status === 'accepted' ? 'bg-green-100 text-green-800' : ''}
          >
            {studentData.status === 'accepted' ? 'Active' : 'Pending Invitation'}
          </Badge>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={studentData.firstName}
                  onChange={(e) => updateData('firstName', e.target.value)}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={studentData.lastName}
                  onChange={(e) => updateData('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={studentData.email}
                onChange={(e) => updateData('email', e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={studentData.dateOfBirth}
                  onChange={(e) => updateData('dateOfBirth', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  value={studentData.studentId}
                  onChange={(e) => updateData('studentId', e.target.value)}
                  placeholder="Auto-generated if blank"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parent/Guardian Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Parent/Guardian Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="parentName">Parent/Guardian Name</Label>
              <Input
                id="parentName"
                value={studentData.parentName}
                onChange={(e) => updateData('parentName', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentEmail">Parent/Guardian Email</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={studentData.parentEmail}
                  onChange={(e) => updateData('parentEmail', e.target.value)}
                  className={errors.parentEmail ? 'border-red-500' : ''}
                />
                {errors.parentEmail && (
                  <p className="text-sm text-red-500 mt-1">{errors.parentEmail}</p>
                )}
              </div>
              <div>
                <Label htmlFor="parentPhone">Parent/Guardian Phone</Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  value={studentData.parentPhone}
                  onChange={(e) => updateData('parentPhone', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Class Enrollment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Class Enrollment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableClasses.map(cls => (
                <label
                  key={cls.id}
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#06b6d4] focus:ring-[#06b6d4]"
                    checked={studentData.enrolledClasses.includes(cls.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateData('enrolledClasses', [...studentData.enrolledClasses, cls.id]);
                      } else {
                        updateData('enrolledClasses', studentData.enrolledClasses.filter(id => id !== cls.id));
                      }
                    }}
                  />
                  <span className="ml-3 font-medium">{cls.name}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Warning for Pending Students */}
        {studentData.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Invitation Pending</p>
              <p className="text-sm text-yellow-700 mt-1">
                This student has not yet accepted their invitation. Changes will be applied once they join.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}