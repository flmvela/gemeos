import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, User, Mail, Calendar, Users, Send, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Step = 'basic' | 'parent' | 'classes' | 'review';

interface StudentData {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  studentId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  selectedClasses: string[];
  customMessage: string;
  sendInviteImmediately: boolean;
}

export default function AddStudent() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [loading, setLoading] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<Array<{id: string, name: string}>>([]);
  
  const [studentData, setStudentData] = useState<StudentData>({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    studentId: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    selectedClasses: [],
    customMessage: 'Welcome to our learning platform! You have been invited to join our class.',
    sendInviteImmediately: true
  });

  const [errors, setErrors] = useState<Partial<StudentData>>({});

  // Fetch available classes when component mounts
  useState(() => {
    const fetchClasses = async () => {
      if (!session?.user_id) return;

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
    };

    fetchClasses();
  }, [session]);

  const updateData = (field: keyof StudentData, value: any) => {
    setStudentData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateBasicInfo = () => {
    const newErrors: Partial<StudentData> = {};
    
    if (!studentData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!studentData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!studentData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateParentInfo = () => {
    const newErrors: Partial<StudentData> = {};
    
    if (studentData.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentData.parentEmail)) {
      newErrors.parentEmail = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateClassSelection = () => {
    const newErrors: Partial<StudentData> = {};
    
    if (studentData.selectedClasses.length === 0) {
      newErrors.selectedClasses = 'Please select at least one class';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 'basic':
        isValid = validateBasicInfo();
        if (isValid) setCurrentStep('parent');
        break;
      case 'parent':
        isValid = validateParentInfo();
        if (isValid) setCurrentStep('classes');
        break;
      case 'classes':
        isValid = validateClassSelection();
        if (isValid) setCurrentStep('review');
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'parent':
        setCurrentStep('basic');
        break;
      case 'classes':
        setCurrentStep('parent');
        break;
      case 'review':
        setCurrentStep('classes');
        break;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Get teacher data
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id, tenant_id')
        .eq('user_id', session?.user_id)
        .single();

      if (!teacherData) throw new Error('Teacher not found');

      // Create invitations for each selected class with student details
      const invitations = studentData.selectedClasses.map(classId => ({
        class_id: classId,
        student_email: studentData.email,
        student_first_name: studentData.firstName,
        student_last_name: studentData.lastName,
        parent_name: studentData.parentName,
        parent_email: studentData.parentEmail,
        parent_phone: studentData.parentPhone,
        invitation_status: 'pending',
        custom_message: studentData.customMessage
      }));

      const { data: createdInvitations, error: invitationError } = await supabase
        .from('class_student_invitations')
        .insert(invitations)
        .select();

      if (invitationError) throw invitationError;

      // Send invitation email if sendInviteImmediately is true
      if (studentData.sendInviteImmediately && createdInvitations && createdInvitations.length > 0) {
        console.log('📧 Sending student invitation email...');
        
        // Import email service
        const { emailService } = await import('@/services/email.service');
        
        // Get teacher info
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('first_name, last_name, tenant_id')
          .eq('user_id', session?.user_id)
          .single();
        
        if (teacherData) {
          const teacherName = `${teacherData.first_name} ${teacherData.last_name}`;
          
          // Send email for each class invitation
          for (const invitation of createdInvitations) {
            // Get class name
            const { data: classData } = await supabase
              .from('classes')
              .select('name')
              .eq('id', invitation.class_id)
              .single();
            
            try {
              // Use the invitation_token field (auto-generated UUID)
              const result = await emailService.sendStudentInvitation(
                invitation.student_email,
                invitation.invitation_token, // Use the proper invitation_token field
                classData?.name || 'Your Class',
                teacherName,
                invitation.custom_message || studentData.customMessage,
                teacherData.tenant_id
              );
              
              if (result.success) {
                console.log(`✅ Invitation email sent to ${invitation.student_email}`);
              } else {
                console.error(`❌ Failed to send invitation to ${invitation.student_email}:`, result.error);
                toast({
                  title: 'Warning',
                  description: `Student added but email could not be sent. You can resend it from the student list.`,
                  variant: 'destructive'
                });
              }
            } catch (error) {
              console.error(`Error sending invitation to ${invitation.student_email}:`, error);
            }
          }
        }
      }

      toast({
        title: 'Success',
        description: `Student ${studentData.firstName} ${studentData.lastName} has been added successfully.`,
      });

      navigate('/teacher/students');
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: 'Error',
        description: 'Failed to add student. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStepNumber = (step: Step) => {
    switch (step) {
      case 'basic': return 1;
      case 'parent': return 2;
      case 'classes': return 3;
      case 'review': return 4;
    }
  };

  const currentStepNumber = getStepNumber(currentStep);

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
                <h1 className="text-2xl font-semibold text-gray-900">Add New Student</h1>
                <p className="text-sm text-gray-600 mt-1">Invite a student to your classes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {(['basic', 'parent', 'classes', 'review'] as Step[]).map((step, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === currentStepNumber;
            const isCompleted = stepNum < currentStepNumber;
            
            return (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${isActive ? 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white' : 
                    isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                `}>
                  {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                {index < 3 && (
                  <div className={`w-24 h-1 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between max-w-2xl mx-auto mt-2">
          <span className="text-xs text-gray-600">Basic Info</span>
          <span className="text-xs text-gray-600">Parent Info</span>
          <span className="text-xs text-gray-600">Classes</span>
          <span className="text-xs text-gray-600">Review</span>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-6 pb-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {currentStep === 'basic' && 'Basic Information'}
              {currentStep === 'parent' && 'Parent/Guardian Information'}
              {currentStep === 'classes' && 'Class Assignment'}
              {currentStep === 'review' && 'Review & Send Invitation'}
            </CardTitle>
            <CardDescription>
              {currentStep === 'basic' && 'Enter the student\'s basic information'}
              {currentStep === 'parent' && 'Optional: Add parent or guardian contact details'}
              {currentStep === 'classes' && 'Select which classes to enroll the student in'}
              {currentStep === 'review' && 'Review the information and send the invitation'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Basic Information */}
            {currentStep === 'basic' && (
              <div className="space-y-4">
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
                  <p className="text-xs text-gray-500 mt-1">An invitation will be sent to this email</p>
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
                
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
                    placeholder="Auto-generated if left blank"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Parent Information */}
            {currentStep === 'parent' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="parentName">Parent/Guardian Name</Label>
                  <Input
                    id="parentName"
                    value={studentData.parentName}
                    onChange={(e) => updateData('parentName', e.target.value)}
                  />
                </div>
                
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
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    Parent information is optional but recommended for younger students.
                    Parents will receive updates about their child's progress.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Class Assignment */}
            {currentStep === 'classes' && (
              <div className="space-y-4">
                <div>
                  <Label>Select Classes</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Choose which classes the student should be enrolled in
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableClasses.map(cls => (
                      <label
                        key={cls.id}
                        className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#06b6d4] focus:ring-[#06b6d4]"
                          checked={studentData.selectedClasses.includes(cls.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateData('selectedClasses', [...studentData.selectedClasses, cls.id]);
                            } else {
                              updateData('selectedClasses', studentData.selectedClasses.filter(id => id !== cls.id));
                            }
                          }}
                        />
                        <span className="ml-3 font-medium">{cls.name}</span>
                      </label>
                    ))}
                  </div>
                  {errors.selectedClasses && (
                    <p className="text-sm text-red-500 mt-1">{errors.selectedClasses}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="customMessage">Custom Invitation Message</Label>
                  <Textarea
                    id="customMessage"
                    value={studentData.customMessage}
                    onChange={(e) => updateData('customMessage', e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendInvite"
                    className="rounded border-gray-300"
                    checked={studentData.sendInviteImmediately}
                    onChange={(e) => updateData('sendInviteImmediately', e.target.checked)}
                  />
                  <Label htmlFor="sendInvite" className="font-normal">
                    Send invitation email immediately
                  </Label>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 'review' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Student Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name</span>
                      <span className="text-sm font-medium">{studentData.firstName} {studentData.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email</span>
                      <span className="text-sm font-medium">{studentData.email}</span>
                    </div>
                    {studentData.dateOfBirth && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Date of Birth</span>
                        <span className="text-sm font-medium">{studentData.dateOfBirth}</span>
                      </div>
                    )}
                  </div>
                </div>

                {studentData.parentName && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Parent/Guardian Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Name</span>
                        <span className="text-sm font-medium">{studentData.parentName}</span>
                      </div>
                      {studentData.parentEmail && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Email</span>
                          <span className="text-sm font-medium">{studentData.parentEmail}</span>
                        </div>
                      )}
                      {studentData.parentPhone && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Phone</span>
                          <span className="text-sm font-medium">{studentData.parentPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Class Enrollment
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {studentData.selectedClasses.map(classId => {
                      const cls = availableClasses.find(c => c.id === classId);
                      return cls ? (
                        <Badge key={classId} variant="secondary">
                          {cls.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Invitation
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{studentData.customMessage}</p>
                    {studentData.sendInviteImmediately && (
                      <p className="text-sm text-green-600 mt-2 flex items-center">
                        <Send className="w-4 h-4 mr-1" />
                        Email will be sent immediately
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/teacher/students')}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                {currentStep !== 'basic' && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                  >
                    Previous
                  </Button>
                )}
                {currentStep !== 'review' ? (
                  <Button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:shadow-lg"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:shadow-lg"
                  >
                    {loading ? 'Adding Student...' : 'Add Student'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}