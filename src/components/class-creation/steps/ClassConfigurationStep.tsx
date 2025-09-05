/**
 * Class Configuration Step
 * Configure class details, difficulty level, and settings
 */

import React from 'react';
import { Users, MessageCircle, Clock } from 'lucide-react';
import { useConfigurationStep, useClassWizardStore } from '@/stores/class-wizard.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const frequencyOptions = [
  {
    value: 'weekly',
    label: 'Weekly',
    description: 'Class meets once every week',
    icon: <Clock className="h-4 w-4" />
  },
  {
    value: 'bi-weekly',
    label: 'Bi-weekly',
    description: 'Class meets every two weeks',
    icon: <Clock className="h-4 w-4" />
  },
  {
    value: 'monthly',
    label: 'Monthly',
    description: 'Class meets once per month',
    icon: <Clock className="h-4 w-4" />
  }
] as const;

export function ClassConfigurationStep() {
  const { data, update } = useConfigurationStep();
  const selectedDomain = useClassWizardStore((state) => 
    state.data.domain.availableDomains.find(d => d.id === state.data.domain.selectedDomainId)
  );

  const handleInputChange = (field: string, value: string | number | boolean) => {
    update({ [field]: value });
  };

  const selectedDifficultyLevel = selectedDomain?.difficultyLevels.find(
    level => level.id === data.difficultyLevelId
  );

  return (
    <div className="space-y-8">
      {/* Domain Context */}
      {selectedDomain && (
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Selected Domain</Badge>
            <h4 className="font-semibold">{selectedDomain.name}</h4>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedDomain.description}
          </p>
        </div>
      )}

      {/* Class Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Class Information
          </CardTitle>
          <CardDescription>
            Set up the basic details for your class
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="className">Class Name *</Label>
            <Input
              id="className"
              value={data.className}
              onChange={(e) => handleInputChange('className', e.target.value)}
              placeholder="e.g., Advanced Mathematics, Beginner Science"
            />
            <p className="text-xs text-muted-foreground">
              A descriptive name that students will see when they join your class
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what students will learn in this class..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxStudents">Maximum Students *</Label>
            <Input
              id="maxStudents"
              type="number"
              min={1}
              max={100}
              value={data.maxStudents}
              onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              The maximum number of students who can join this class (1-100)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Level Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Difficulty Level *</CardTitle>
          <CardDescription>
            Choose the appropriate difficulty level for your students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDomain ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedDomain.difficultyLevels.map((level) => {
                const isSelected = data.difficultyLevelId === level.id;
                
                return (
                  <Card
                    key={level.id}
                    className={`cursor-pointer transition-all hover:shadow-sm ${
                      isSelected 
                        ? 'ring-2 ring-primary border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleInputChange('difficultyLevelId', level.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              style={{ 
                                borderColor: level.color_code,
                                color: level.color_code,
                                backgroundColor: `${level.color_code}10`
                              }}
                            >
                              Level {level.level_order}
                            </Badge>
                            <h4 className="font-semibold">{level.level_name}</h4>
                          </div>
                          {level.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {level.description}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <Badge variant="secondary">Selected</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Please select a domain first to see available difficulty levels.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Class Schedule & Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule & Settings
          </CardTitle>
          <CardDescription>
            Configure how often your class meets and communication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Frequency Selection */}
          <div className="space-y-3">
            <Label>Class Frequency *</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {frequencyOptions.map((option) => {
                const isSelected = data.frequency === option.value;
                
                return (
                  <Card
                    key={option.value}
                    className={`cursor-pointer transition-all hover:shadow-sm ${
                      isSelected 
                        ? 'ring-2 ring-primary border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleInputChange('frequency', option.value)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className={`p-2 rounded-lg ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          {option.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{option.label}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {option.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Badge variant="secondary" className="mt-1">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Communication Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Communication Settings</Label>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="allowsStudentMessages" className="text-sm font-medium">
                    Allow Student Messages
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Students can send you direct messages about the class
                  </p>
                </div>
              </div>
              <Switch
                id="allowsStudentMessages"
                checked={data.allowsStudentMessages}
                onCheckedChange={(checked) => handleInputChange('allowsStudentMessages', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      {data.className && selectedDifficultyLevel && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">Configuration Summary</h4>
          <div className="space-y-1 text-sm text-green-800">
            <p><strong>Class:</strong> {data.className}</p>
            <p><strong>Domain:</strong> {selectedDomain?.name}</p>
            <p><strong>Level:</strong> {selectedDifficultyLevel.level_name}</p>
            <p><strong>Frequency:</strong> {frequencyOptions.find(f => f.value === data.frequency)?.label}</p>
            <p><strong>Max Students:</strong> {data.maxStudents}</p>
            <p><strong>Student Messages:</strong> {data.allowsStudentMessages ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      )}
    </div>
  );
}