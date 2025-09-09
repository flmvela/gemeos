/**
 * Teacher Schedule Step Component
 * Third step in the teacher creation wizard
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';
import { useTeacherWizardStore } from '@/stores/teacher-wizard.store';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export const TeacherScheduleStep: React.FC = () => {
  const { data, updateData } = useTeacherWizardStore();
  const schedule = data.schedule;

  const handleAvailabilityChange = (day: typeof DAYS[number], field: string, value: any) => {
    updateData('schedule', {
      availability: {
        ...schedule.availability,
        [day]: {
          ...schedule.availability[day],
          [field]: value
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <Calendar className="h-4 w-4 text-gray-500" />
          Weekly Availability
        </Label>
        <p className="text-sm text-muted-foreground">
          Set the teacher's regular working hours
        </p>
      </div>

      <div className="space-y-3">
        {DAYS.map(day => (
          <Card key={day}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Switch
                    checked={schedule.availability[day].available}
                    onCheckedChange={(checked) => handleAvailabilityChange(day, 'available', checked)}
                  />
                  <Label className="capitalize w-24">{day}</Label>
                  
                  {schedule.availability[day].available && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={schedule.availability[day].start || '09:00'}
                        onValueChange={(value) => handleAvailabilityChange(day, 'start', value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm">to</span>
                      <Select
                        value={schedule.availability[day].end || '17:00'}
                        onValueChange={(value) => handleAvailabilityChange(day, 'end', value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-500" />
            Min Class Duration (minutes)
          </Label>
          <Input
            type="number"
            value={schedule.minClassDuration}
            onChange={(e) => updateData('schedule', { minClassDuration: parseInt(e.target.value) || 60 })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Max Classes Per Day</Label>
          <Input
            type="number"
            value={schedule.maxClassesPerDay}
            onChange={(e) => updateData('schedule', { maxClassesPerDay: parseInt(e.target.value) || 6 })}
          />
        </div>
      </div>
    </div>
  );
};