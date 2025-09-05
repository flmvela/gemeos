/**
 * Students Step
 * Add and manage student invitations
 */

import React, { useState } from 'react';
import { UserPlus, Mail, Trash2, Edit, Users } from 'lucide-react';
import { useStudentsStep } from '@/stores/class-wizard.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { StudentInformation } from '@/stores/class-wizard.store';

interface StudentDialogProps {
  student?: StudentInformation;
  studentIndex?: number;
  onSave: (student: StudentInformation, index?: number) => void;
  trigger: React.ReactNode;
  defaultMessage?: string;
}

function StudentDialog({ student, studentIndex, onSave, trigger, defaultMessage }: StudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<StudentInformation>(() => ({
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    email: student?.email || '',
    customMessage: student?.customMessage || defaultMessage || ''
  }));

  const handleSave = () => {
    onSave(formData, studentIndex);
    setOpen(false);
    
    // Reset form if adding new student
    if (!student) {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        customMessage: defaultMessage || ''
      });
    }
  };

  const isEditing = student !== undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Student' : 'Add New Student'}
          </DialogTitle>
          <DialogDescription>
            Add student information and customize their invitation message.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john.doe@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customMessage">Custom Invitation Message (Optional)</Label>
            <Textarea
              id="customMessage"
              value={formData.customMessage || ''}
              onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
              placeholder="Add a personal message that will be included in the invitation email..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              This message will be included in the invitation email sent to the student.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? 'Update Student' : 'Add Student'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StudentsStep() {
  const { data, update, addStudent, updateStudent, removeStudent } = useStudentsStep();

  const handleSaveStudent = (studentData: StudentInformation, index?: number) => {
    if (index !== undefined) {
      updateStudent(index, studentData);
    } else {
      addStudent(studentData);
    }
  };

  const getStudentInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleDefaultMessageChange = (message: string) => {
    update({ defaultCustomMessage: message });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium mb-2">Add Students</h4>
        <p className="text-muted-foreground">
          Add students who will be invited to join your class. Each student will receive an invitation email.
        </p>
      </div>

      {/* Default Message Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-5 w-5" />
            Default Invitation Message
          </CardTitle>
          <CardDescription>
            This message will be pre-filled for each student invitation. You can customize it for individual students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.defaultCustomMessage}
            onChange={(e) => handleDefaultMessageChange(e.target.value)}
            placeholder="Welcome to my class! I'm excited to have you join us for this learning journey..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Add Student Button */}
      <div className="flex justify-start">
        <StudentDialog
          onSave={handleSaveStudent}
          defaultMessage={data.defaultCustomMessage}
          trigger={
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Student
            </Button>
          }
        />
      </div>

      {/* Students List */}
      {data.students.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="font-medium text-sm text-muted-foreground">
              Students to Invite ({data.students.length})
            </h5>
            <Badge variant="outline">
              {data.students.length} invitation{data.students.length !== 1 ? 's' : ''} will be sent
            </Badge>
          </div>
          
          <div className="space-y-3">
            {data.students.map((student, index) => (
              <Card key={student.id || index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm">
                          {getStudentInitials(student.firstName, student.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1">
                        <div>
                          <h6 className="font-medium">
                            {student.firstName} {student.lastName}
                          </h6>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </p>
                        </div>
                        
                        {student.customMessage && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <p className="text-muted-foreground font-medium mb-1">Custom message:</p>
                            <p className="line-clamp-2">{student.customMessage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <StudentDialog
                        student={student}
                        studentIndex={index}
                        onSave={handleSaveStudent}
                        defaultMessage={data.defaultCustomMessage}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeStudent(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardHeader className="text-center py-8">
            <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">No Students Added Yet</CardTitle>
            <CardDescription>
              Click "Add Student" above to start building your class roster.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Students Summary */}
      {data.students.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Invitation Summary</h4>
          <div className="space-y-1 text-sm text-green-800">
            <p><strong>{data.students.length}</strong> student{data.students.length !== 1 ? 's' : ''} will be invited</p>
            <p><strong>Invitations will be sent to:</strong></p>
            <ul className="ml-4 space-y-1">
              {data.students.slice(0, 5).map((student, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-600 rounded-full" />
                  {student.firstName} {student.lastName} ({student.email})
                </li>
              ))}
              {data.students.length > 5 && (
                <li className="text-green-700 italic">
                  ...and {data.students.length - 5} more
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}