/**
 * Review Step
 * Final review of class configuration before creation
 */

import React from 'react';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Clock, 
  Mail, 
  MessageCircle, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useClassWizardStore } from '@/stores/class-wizard.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const timeZones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'GMT (Greenwich Mean Time)' },
  { value: 'Europe/Paris', label: 'CET (Central European Time)' },
  { value: 'Asia/Tokyo', label: 'JST (Japan Standard Time)' },
  { value: 'Australia/Sydney', label: 'AEST (Australian Eastern Time)' }
];

const frequencyLabels = {
  weekly: 'Weekly',
  'bi-weekly': 'Bi-weekly',
  monthly: 'Monthly'
};

export function ReviewStep() {
  const { data, setCurrentStep } = useClassWizardStore();

  const selectedDomain = data.domain.availableDomains.find(d => d.id === data.domain.selectedDomainId);
  const selectedDifficultyLevel = selectedDomain?.difficultyLevels.find(
    level => level.id === data.configuration.difficultyLevelId
  );

  const formatDateTime = (date: string, time: string, timeZone: string) => {
    const dateObj = new Date(`${date}T${time}`);
    const timeZoneLabel = timeZones.find(tz => tz.value === timeZone)?.label || timeZone;
    
    return {
      date: dateObj.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: `${time} ${timeZoneLabel.split('(')[1]?.replace(')', '') || timeZone}`
    };
  };

  const getStudentInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getSectionStatus = (section: string): 'complete' | 'incomplete' => {
    switch (section) {
      case 'domain':
        return data.domain.selectedDomainId ? 'complete' : 'incomplete';
      case 'configuration':
        return data.configuration.className && data.configuration.difficultyLevelId ? 'complete' : 'incomplete';
      case 'sessions':
        return data.sessions.length > 0 ? 'complete' : 'incomplete';
      case 'students':
        return data.students.students.length > 0 ? 'complete' : 'incomplete';
      default:
        return 'incomplete';
    }
  };

  const StatusIcon = ({ status }: { status: 'complete' | 'incomplete' }) => {
    return status === 'complete' ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <AlertCircle className="h-5 w-5 text-orange-500" />
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium mb-2">Review Your Class</h4>
        <p className="text-muted-foreground">
          Please review all the details below before creating your class. You can go back to any step to make changes.
        </p>
      </div>

      {/* Domain & Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon status={getSectionStatus('domain')} />
            <BookOpen className="h-5 w-5" />
            Domain & Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">DOMAIN</Label>
              <p className="font-medium">{selectedDomain?.name || 'Not selected'}</p>
              {selectedDomain?.description && (
                <p className="text-sm text-muted-foreground mt-1">{selectedDomain.description}</p>
              )}
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">DIFFICULTY LEVEL</Label>
              <div className="flex items-center gap-2">
                {selectedDifficultyLevel ? (
                  <>
                    <Badge
                      variant="outline"
                      style={{ 
                        borderColor: selectedDifficultyLevel.color_code,
                        color: selectedDifficultyLevel.color_code,
                        backgroundColor: `${selectedDifficultyLevel.color_code}10`
                      }}
                    >
                      {selectedDifficultyLevel.level_name}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Level {selectedDifficultyLevel.level_order}
                    </span>
                  </>
                ) : (
                  <p>Not selected</p>
                )}
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">CLASS NAME</Label>
              <p className="font-medium">{data.configuration.className || 'Not provided'}</p>
            </div>
            
            {data.configuration.description && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">DESCRIPTION</Label>
                <p className="text-sm">{data.configuration.description}</p>
              </div>
            )}
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">FREQUENCY</Label>
                <p className="font-medium">{frequencyLabels[data.configuration.frequency]}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">MAX STUDENTS</Label>
                <p className="font-medium">{data.configuration.maxStudents}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">STUDENT MESSAGES</Label>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">
                    {data.configuration.allowsStudentMessages ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <button
              className="text-sm text-primary hover:underline"
              onClick={() => setCurrentStep('configuration')}
            >
              Edit Configuration →
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon status={getSectionStatus('sessions')} />
            <Calendar className="h-5 w-5" />
            Class Sessions ({data.sessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.sessions.length > 0 ? (
            <div className="space-y-3">
              {data.sessions.map((session, index) => {
                const { date, time } = formatDateTime(session.sessionDate, session.startTime, session.timeZone);
                
                return (
                  <div key={session.id || index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Session {index + 1}
                        </Badge>
                        {session.sessionName && (
                          <span className="font-medium text-sm">{session.sessionName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {time}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="text-right">
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={() => setCurrentStep('sessions')}
                >
                  Edit Sessions →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No sessions scheduled</p>
              <button
                className="text-sm text-primary hover:underline mt-1"
                onClick={() => setCurrentStep('sessions')}
              >
                Add Sessions →
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StatusIcon status={getSectionStatus('students')} />
            <Users className="h-5 w-5" />
            Students ({data.students.students.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.students.students.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-3">
                {data.students.students.slice(0, 5).map((student, index) => (
                  <div key={student.id || index} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getStudentInitials(student.firstName, student.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {student.email}
                      </p>
                    </div>
                    {student.customMessage && (
                      <Badge variant="outline" className="text-xs">
                        Custom message
                      </Badge>
                    )}
                  </div>
                ))}
                
                {data.students.students.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    ...and {data.students.students.length - 5} more students
                  </p>
                )}
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <strong>{data.students.students.length}</strong> invitation{data.students.students.length !== 1 ? 's' : ''} will be sent
                </div>
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={() => setCurrentStep('students')}
                >
                  Edit Students →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No students added</p>
              <button
                className="text-sm text-primary hover:underline mt-1"
                onClick={() => setCurrentStep('students')}
              >
                Add Students →
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Creation Summary */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
        <h4 className="font-semibold text-primary mb-3">Ready to Create Class</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Class will be created:</span>
            <Badge variant="outline">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Invitation emails will be sent:</span>
            <Badge variant="outline">{data.students.students.length} students</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Sessions scheduled:</span>
            <Badge variant="outline">{data.sessions.length} sessions</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

// Label component for consistent styling
function Label({ className, children, ...props }: { className?: string; children: React.ReactNode }) {
  return (
    <label className={`block text-xs font-medium text-muted-foreground uppercase tracking-wide ${className}`} {...props}>
      {children}
    </label>
  );
}