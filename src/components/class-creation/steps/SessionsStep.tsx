/**
 * Sessions Step
 * Add and manage class sessions with scheduling
 */

import React, { useState } from 'react';
import { Calendar, Clock, Plus, Trash2, Edit } from 'lucide-react';
import { useSessionsStep } from '@/stores/class-wizard.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ClassSession } from '@/stores/class-wizard.store';

// Time zones for selection
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

interface SessionDialogProps {
  session?: ClassSession;
  sessionIndex?: number;
  onSave: (session: ClassSession, index?: number) => void;
  trigger: React.ReactNode;
}

function SessionDialog({ session, sessionIndex, onSave, trigger }: SessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ClassSession>(() => ({
    sessionName: session?.sessionName || '',
    sessionDate: session?.sessionDate || '',
    startTime: session?.startTime || '',
    endTime: session?.endTime || '',
    timeZone: session?.timeZone || 'UTC'
  }));

  const handleSave = () => {
    onSave(formData, sessionIndex);
    setOpen(false);
  };

  const isEditing = session !== undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Session' : 'Add New Session'}
          </DialogTitle>
          <DialogDescription>
            Set up the schedule for this class session. All times will be displayed in the selected time zone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="sessionName">Session Name (Optional)</Label>
            <Input
              id="sessionName"
              value={formData.sessionName || ''}
              onChange={(e) => setFormData({ ...formData, sessionName: e.target.value })}
              placeholder="e.g., Introduction to Algebra, Lab Session 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionDate">Date *</Label>
              <Input
                id="sessionDate"
                type="date"
                value={formData.sessionDate}
                onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]} // Prevent past dates
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeZone">Time Zone *</Label>
              <Select 
                value={formData.timeZone} 
                onValueChange={(value) => setFormData({ ...formData, timeZone: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timeZones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {isEditing ? 'Update Session' : 'Add Session'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SessionsStep() {
  const { sessions, addSession, updateSession, removeSession } = useSessionsStep();

  const handleSaveSession = (sessionData: ClassSession, index?: number) => {
    if (index !== undefined) {
      updateSession(index, sessionData);
    } else {
      addSession(sessionData);
    }
  };

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

  const getDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium mb-2">Schedule Class Sessions</h4>
        <p className="text-muted-foreground">
          Add one or more sessions for your class. Each session represents a meeting time where you'll teach your students.
        </p>
      </div>

      {/* Add Session Button */}
      <div className="flex justify-start">
        <SessionDialog
          onSave={handleSaveSession}
          trigger={
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Session
            </Button>
          }
        />
      </div>

      {/* Sessions List */}
      {sessions.length > 0 ? (
        <div className="space-y-4">
          <h5 className="font-medium text-sm text-muted-foreground">
            Scheduled Sessions ({sessions.length})
          </h5>
          
          <div className="space-y-3">
            {sessions.map((session, index) => {
              const { date, time } = formatDateTime(session.sessionDate, session.startTime, session.timeZone);
              const duration = getDuration(session.startTime, session.endTime);
              
              return (
                <Card key={session.id || index} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            Session {index + 1}
                          </Badge>
                          {session.sessionName && (
                            <h6 className="font-medium">{session.sessionName}</h6>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{time}</span>
                            <Badge variant="secondary" className="text-xs">
                              {duration}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <SessionDialog
                          session={session}
                          sessionIndex={index}
                          onSave={handleSaveSession}
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
                          onClick={() => removeSession(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardHeader className="text-center py-8">
            <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">No Sessions Added Yet</CardTitle>
            <CardDescription>
              Click "Add Session" above to schedule your first class session.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Schedule Summary */}
      {sessions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Schedule Summary</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <p><strong>{sessions.length}</strong> session{sessions.length !== 1 ? 's' : ''} scheduled</p>
            {sessions.length > 0 && (
              <>
                <p><strong>First Session:</strong> {formatDateTime(sessions[0].sessionDate, sessions[0].startTime, sessions[0].timeZone).date}</p>
                <p><strong>Latest Session:</strong> {formatDateTime(sessions[sessions.length - 1].sessionDate, sessions[sessions.length - 1].startTime, sessions[sessions.length - 1].timeZone).date}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}