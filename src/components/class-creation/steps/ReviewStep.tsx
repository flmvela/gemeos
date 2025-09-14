/**
 * Review Step
 * Review and confirm all class details before creation
 * Matches the design pattern of teacher creation wizard
 */

import React from 'react';
import { 
  BookOpen, Users, Calendar, MapPin, Clock, Mail, 
  AlertCircle, Check, ChevronRight, Edit2, 
  GraduationCap, Video, CalendarDays, X
} from 'lucide-react';
import { useClassWizardStore } from '@/stores/class-wizard.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { getDifficultyLevel } from '@/types/class-concepts.types';
import { format } from 'date-fns';

export function ReviewStep() {
  const { data, setCurrentStep, errors } = useClassWizardStore();
  const domainData = data.domain.availableDomains.find(
    d => d.id === data.domain.selectedDomainId
  );

  const goToStep = (step: any) => {
    setCurrentStep(step);
  };

  // Format session schedule for display
  const getSessionScheduleDisplay = () => {
    const session = data.sessions?.[0];
    if (!session) return 'Not configured';

    // Determine session type based on presence of recurrence
    const sessionType = data.recurrence ? 'recurring' : 'single';
    
    if (sessionType === 'single') {
      if (session.sessionDate) {
        const date = new Date(session.sessionDate);
        return `${format(date, 'EEEE, MMMM d, yyyy')} at ${session.startTime}`;
      }
    } else if (sessionType === 'recurring') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = session.dayOfWeek ? 
        days[['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(session.dayOfWeek)] 
        : '';
      
      const timeSlot = session.startTime || '15:00';
      const [hour, minute] = timeSlot.split(':');
      const displayHour = parseInt(hour) === 0 ? 12 : parseInt(hour) > 12 ? parseInt(hour) - 12 : parseInt(hour);
      const ampm = parseInt(hour) < 12 ? 'AM' : 'PM';
      const timeDisplay = `${displayHour}:${minute} ${ampm}`;
      
      const pattern = data.recurrence?.pattern || 'weekly';
      const patternText = pattern === 'weekly' ? 'Every week' : 
                         pattern === 'bi-weekly' ? 'Every 2 weeks' : 
                         'Monthly';
      
      return `${patternText} on ${dayName} at ${timeDisplay}`;
    }
    return 'Not configured';
  };

  // Calculate total sessions
  const getTotalSessions = () => {
    const sessionType = data.recurrence ? 'recurring' : 'single';
    if (sessionType === 'single') return 1;
    if (data.recurrence?.endType === 'occurrences') {
      return data.recurrence.occurrences || 0;
    }
    return 'Ongoing';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Review & Create</h3>
        <p className="text-muted-foreground">Review your class details before creating</p>
      </div>

      {errors.review && errors.review.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errors.review.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Domain & Configuration */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Class Details
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep('configuration')}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Class Name</p>
              <p className="font-medium">{data.configuration.className || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Domain</p>
              <p className="font-medium">{domainData?.name || 'Not selected'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Difficulty Levels</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.configuration.difficultyLevelIds.map(levelId => {
                  const level = domainData?.difficultyLevels.find(l => l.id === levelId);
                  if (!level) return null;
                  const diffInfo = getDifficultyLevel(level.level_order);
                  return (
                    <Badge
                      key={levelId}
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: diffInfo.color,
                        color: diffInfo.color,
                        backgroundColor: `${diffInfo.color}15`
                      }}
                    >
                      {diffInfo.icon} {level.level_name}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Class Size</p>
              <p className="font-medium">
                {data.configuration.minStudents ? 
                  `${data.configuration.minStudents}-${data.configuration.maxStudents} students` :
                  `Up to ${data.configuration.maxStudents} students`
                }
              </p>
            </div>
          </div>
          {data.configuration.description && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{data.configuration.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep('sessions')}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Schedule</p>
              <p className="font-medium">{getSessionScheduleDisplay()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Sessions</p>
              <p className="font-medium">{getTotalSessions()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
              <div className="flex items-center gap-2">
                {data.sessions?.[0]?.location === 'online' && <Video className="h-4 w-4" />}
                {data.sessions?.[0]?.location === 'in-person' && <MapPin className="h-4 w-4" />}
                {data.sessions?.[0]?.location === 'hybrid' && <Users className="h-4 w-4" />}
                <p className="font-medium capitalize">{data.sessions?.[0]?.location || 'Online'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Duration</p>
              <p className="font-medium">
                {data.sessions?.[0]?.duration ? 
                  `${data.sessions[0].duration} minutes` : 
                  '60 minutes'
                }
              </p>
            </div>
          </div>
          {data.sessions?.[0]?.locationAddress && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
              <p className="text-sm">{data.sessions[0].locationAddress}</p>
            </div>
          )}
          {data.sessions?.[0]?.meetingLink && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Meeting Link</p>
              <p className="text-sm text-primary">{data.sessions[0].meetingLink}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToStep('students')}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Enrollment Type</p>
              <Badge variant={data.students.enrollmentType === 'open' ? 'default' : 'secondary'}>
                {data.students.enrollmentType === 'open' ? 'Open Enrollment' : 'Invite Only'}
              </Badge>
            </div>
            {data.students.enrollmentType === 'open' && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Class Code</p>
                <p className="font-mono font-medium text-lg">
                  {data.students.enrollmentCode || 'AUTO-GENERATED'}
                </p>
              </div>
            )}
            {data.students.enrollmentType === 'invite-only' && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Invited Students</p>
                <p className="font-medium">{data.students.studentEmails?.length || 0} students</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Send Invitations</p>
              <p className="font-medium">
                {data.students.sendInvitesImmediately ? 'Immediately' : 'Later'}
              </p>
            </div>
          </div>
          
          {data.students.defaultCustomMessage && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Welcome Message</p>
              <p className="text-sm italic">"{data.students.defaultCustomMessage}"</p>
            </div>
          )}

          {(data.students.studentEmails?.length || 0) > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Student Emails</p>
              <div className="max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {(data.students.studentEmails || []).slice(0, 5).map((email, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Mail className="h-3 w-3 mr-1" />
                      {email}
                    </Badge>
                  ))}
                  {(data.students.studentEmails?.length || 0) > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{(data.students.studentEmails?.length || 0) - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Settings Summary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Additional Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {data.configuration.allowsStudentMessages ? 
                <Check className="h-4 w-4 text-green-600" /> : 
                <X className="h-4 w-4 text-muted-foreground" />
              }
              <span className="text-sm">Student messaging {data.configuration.allowsStudentMessages ? 'enabled' : 'disabled'}</span>
            </div>
            <div className="flex items-center gap-2">
              {data.sessions?.[0]?.sendCalendarInvites ? 
                <Check className="h-4 w-4 text-green-600" /> : 
                <X className="h-4 w-4 text-muted-foreground" />
              }
              <span className="text-sm">Calendar invites {data.sessions?.[0]?.sendCalendarInvites ? 'will be sent' : 'disabled'}</span>
            </div>
            {data.students.includeParentInvite && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Parent/guardian notifications enabled</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons Info */}
      <Alert className="border-primary/50 bg-primary/5">
        <GraduationCap className="h-4 w-4 text-primary" />
        <AlertDescription className="text-primary">
          <strong>Ready to create your class!</strong> Click "Create Class" to finalize. 
          {data.students.sendInvitesImmediately && (data.students.studentEmails?.length || 0) > 0 && 
            ` Invitations will be sent to ${data.students.studentEmails?.length || 0} student${(data.students.studentEmails?.length || 0) !== 1 ? 's' : ''}.`
          }
        </AlertDescription>
      </Alert>
    </div>
  );
}