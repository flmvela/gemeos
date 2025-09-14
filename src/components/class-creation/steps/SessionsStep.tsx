/**
 * Sessions Step
 * Configure class sessions and schedule
 * Matches the design pattern of teacher creation wizard
 */

import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Video, Users, CalendarDays, AlertCircle, Info } from 'lucide-react';
import { useSessionsStep, useClassWizardStore } from '@/stores/class-wizard.store';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, addWeeks, addMonths, setHours, setMinutes } from 'date-fns';

// Time slot options
const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return {
    value: `${hour.toString().padStart(2, '0')}:${minute}`,
    label: `${displayHour}:${minute} ${ampm}`
  };
});

// Duration options
const durationOptions = [
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
  { value: '150', label: '2.5 hours' },
  { value: '180', label: '3 hours' },
];

// Days of week
const daysOfWeek = [
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
  { value: 'sunday', label: 'Sunday', short: 'Sun' },
];

export function SessionsStep() {
  const { data, update, errors } = useSessionsStep();
  const configData = useClassWizardStore(state => state.data.configuration);
  
  // Initialize sessions if empty on component mount
  React.useEffect(() => {
    if (!data?.sessions || data.sessions.length === 0) {
      // Initialize with a default session
      update({
        sessions: [{
          dayOfWeek: 'monday',
          startTime: '15:00',
          duration: 60,
          location: 'online'
        }],
        sessionType: 'recurring',
        recurrence: {
          pattern: configData?.frequency || 'weekly',
          endType: 'occurrences',
          occurrences: 12
        }
      });
    }
  }, []);
  
  // Initialize with default values if data.sessions is undefined or empty
  const firstSession = data?.sessions?.[0];
  const [selectedDay, setSelectedDay] = useState<string>(firstSession?.dayOfWeek || 'monday');
  const [selectedTime, setSelectedTime] = useState<string>(firstSession?.startTime || '15:00');
  const [selectedDuration, setSelectedDuration] = useState<string>(firstSession?.duration?.toString() || '60');

  const handleSessionTypeChange = (value: 'single' | 'recurring') => {
    update({ sessionType: value });
    
    // Initialize session data based on type
    if (value === 'single') {
      update({
        sessions: [{
          sessionDate: format(new Date(), 'yyyy-MM-dd'),
          startTime: '15:00',
          duration: 60,
          location: data.location || 'online'
        }],
        recurrence: undefined
      });
    } else {
      update({
        sessions: [{
          dayOfWeek: 'monday',
          startTime: '15:00',
          duration: 60,
          location: data.location || 'online'
        }],
        recurrence: {
          pattern: configData.frequency || 'weekly',
          endType: 'occurrences',
          occurrences: 12
        }
      });
    }
  };

  const handleRecurringSessionUpdate = () => {
    update({
      sessions: [{
        dayOfWeek: selectedDay,
        startTime: selectedTime,
        duration: parseInt(selectedDuration),
        location: data?.location || 'online'
      }]
    });
  };

  const handleRecurrenceUpdate = (field: string, value: any) => {
    update({
      recurrence: {
        ...data.recurrence,
        [field]: value
      }
    });
  };

  const handleLocationChange = (value: 'online' | 'in-person' | 'hybrid') => {
    update({ 
      location: value,
      sessions: (data?.sessions || []).map(s => ({ ...s, location: value }))
    });
  };

  // Calculate session preview
  const getSessionPreview = () => {
    if (data?.sessionType === 'single') {
      const session = data?.sessions?.[0];
      if (session?.sessionDate) {
        const date = new Date(session.sessionDate);
        return [`${format(date, 'EEEE, MMMM d, yyyy')} at ${session.startTime}`];
      }
      return [];
    } else if (data?.sessionType === 'recurring' && data?.recurrence) {
      const previews: string[] = [];
      const startDate = new Date();
      const dayIndex = daysOfWeek.findIndex(d => d.value === selectedDay);
      
      // Find next occurrence of the selected day
      let nextDate = new Date(startDate);
      while (nextDate.getDay() !== (dayIndex === 6 ? 0 : dayIndex + 1)) {
        nextDate.setDate(nextDate.getDate() + 1);
      }

      // Generate preview based on pattern
      const maxPreviews = Math.min(data.recurrence.occurrences || 4, 4);
      for (let i = 0; i < maxPreviews; i++) {
        previews.push(format(nextDate, 'MMM d, yyyy'));
        
        if (data.recurrence.pattern === 'weekly') {
          nextDate = addWeeks(nextDate, 1);
        } else if (data.recurrence.pattern === 'bi-weekly') {
          nextDate = addWeeks(nextDate, 2);
        } else if (data.recurrence.pattern === 'monthly') {
          nextDate = addMonths(nextDate, 1);
        }
      }
      
      return previews;
    }
    return [];
  };

  const sessionPreviews = getSessionPreview();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Schedule Sessions</h3>
        <p className="text-muted-foreground">Configure when and where your class will meet</p>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Session Type Selection */}
      <div className="space-y-3">
        <Label className="text-base">Session Type</Label>
        <RadioGroup
          value={data.sessionType}
          onValueChange={handleSessionTypeChange}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label
              htmlFor="single"
              className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                data.sessionType === 'single' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <RadioGroupItem value="single" id="single" />
              <div className="flex-1">
                <p className="font-medium">Single Session</p>
                <p className="text-xs text-muted-foreground">One-time class session</p>
              </div>
            </label>
            
            <label
              htmlFor="recurring"
              className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                data.sessionType === 'recurring' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <RadioGroupItem value="recurring" id="recurring" />
              <div className="flex-1">
                <p className="font-medium">Recurring Sessions</p>
                <p className="text-xs text-muted-foreground">Regular class schedule</p>
              </div>
            </label>
          </div>
        </RadioGroup>
      </div>

      {/* Session Schedule Configuration */}
      {data.sessionType === 'recurring' ? (
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-base">Class Schedule</Label>
            
            {/* Day Selection */}
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Day of Week</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map(day => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Selection */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(slot => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleRecurringSessionUpdate}
              className="w-full sm:w-auto"
            >
              <Clock className="h-4 w-4 mr-2" />
              Apply Schedule
            </Button>
          </div>

          {/* Recurrence Pattern */}
          <div className="space-y-3">
            <Label className="text-base">Recurrence Pattern</Label>
            
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Repeats {data.recurrence?.pattern || configData.frequency || 'weekly'}
                </span>
              </div>

              <div className="space-y-3">
                <Label>End After</Label>
                <RadioGroup
                  value={data.recurrence?.endType || 'occurrences'}
                  onValueChange={(value) => handleRecurrenceUpdate('endType', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="occurrences" id="occurrences" />
                    <Label htmlFor="occurrences" className="flex items-center gap-2 cursor-pointer">
                      <span>After</span>
                      <Input
                        type="number"
                        min={1}
                        max={52}
                        value={data.recurrence?.occurrences || 12}
                        onChange={(e) => handleRecurrenceUpdate('occurrences', parseInt(e.target.value) || 1)}
                        className="w-16 h-8"
                        disabled={data.recurrence?.endType !== 'occurrences'}
                      />
                      <span>sessions</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="date" id="endDate" />
                    <Label htmlFor="endDate" className="flex items-center gap-2 cursor-pointer">
                      <span>On date</span>
                      <Input
                        type="date"
                        value={data.recurrence?.endDate || ''}
                        onChange={(e) => handleRecurrenceUpdate('endDate', e.target.value)}
                        className="w-40 h-8"
                        disabled={data.recurrence?.endType !== 'date'}
                      />
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Label className="text-base">Session Date & Time</Label>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sessionDate">Date</Label>
              <Input
                type="date"
                id="sessionDate"
                value={data.sessions?.[0]?.sessionDate || ''}
                onChange={(e) => update({
                  sessions: [{
                    ...(data.sessions?.[0] || {}),
                    sessionDate: e.target.value
                  }]
                })}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTime">Start Time</Label>
              <Select 
                value={data.sessions?.[0]?.startTime || '15:00'}
                onValueChange={(value) => update({
                  sessions: [{
                    ...(data.sessions?.[0] || {}),
                    startTime: value
                  }]
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map(slot => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Location Type */}
      <div className="space-y-3">
        <Label className="text-base">Location Type</Label>
        <RadioGroup
          value={data.location || 'online'}
          onValueChange={handleLocationChange}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <label
              htmlFor="online"
              className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                data.location === 'online' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <RadioGroupItem value="online" id="online" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <p className="font-medium">Online</p>
                </div>
                <p className="text-xs text-muted-foreground">Virtual sessions</p>
              </div>
            </label>
            
            <label
              htmlFor="in-person"
              className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                data.location === 'in-person' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <RadioGroupItem value="in-person" id="in-person" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <p className="font-medium">In-Person</p>
                </div>
                <p className="text-xs text-muted-foreground">Physical location</p>
              </div>
            </label>
            
            <label
              htmlFor="hybrid"
              className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                data.location === 'hybrid' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <RadioGroupItem value="hybrid" id="hybrid" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <p className="font-medium">Hybrid</p>
                </div>
                <p className="text-xs text-muted-foreground">Both options</p>
              </div>
            </label>
          </div>
        </RadioGroup>
      </div>

      {/* Location Details */}
      {data.location === 'in-person' || data.location === 'hybrid' ? (
        <div className="space-y-2">
          <Label htmlFor="locationAddress">
            Location Address {data.location === 'in-person' && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id="locationAddress"
            value={data.locationAddress || ''}
            onChange={(e) => update({ locationAddress: e.target.value })}
            placeholder="Enter the physical address or room number"
          />
        </div>
      ) : null}

      {/* Meeting Link */}
      {data.location === 'online' || data.location === 'hybrid' ? (
        <div className="space-y-2">
          <Label htmlFor="meetingLink">Meeting Link (Optional)</Label>
          <Input
            id="meetingLink"
            value={data.meetingLink || ''}
            onChange={(e) => update({ meetingLink: e.target.value })}
            placeholder="https://zoom.us/j/..."
            type="url"
          />
          <p className="text-sm text-muted-foreground">
            You can add this later or send it separately to students
          </p>
        </div>
      ) : null}

      {/* Additional Settings */}
      <div className="space-y-4">
        <Label className="text-base">Additional Settings</Label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Send Calendar Invites</p>
                <p className="text-sm text-muted-foreground">
                  Automatically send calendar invitations to students
                </p>
              </div>
            </div>
            <Switch
              checked={data.sendCalendarInvites ?? true}
              onCheckedChange={(checked) => update({ sendCalendarInvites: checked })}
            />
          </div>
        </div>
      </div>

      {/* Session Preview */}
      {sessionPreviews.length > 0 && (
        <Alert className="border-primary/50 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            <strong>Session Preview:</strong>
            <div className="mt-2 space-y-1">
              {data.sessionType === 'recurring' ? (
                <>
                  <p>Every {daysOfWeek.find(d => d.value === selectedDay)?.label} at {timeSlots.find(t => t.value === selectedTime)?.label}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sessionPreviews.map((preview, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {preview}
                      </Badge>
                    ))}
                    {(data.recurrence?.occurrences || 0) > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{(data.recurrence?.occurrences || 0) - 4} more
                      </Badge>
                    )}
                  </div>
                </>
              ) : (
                <p>{sessionPreviews[0]}</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}