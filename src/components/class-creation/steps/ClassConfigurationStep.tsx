/**
 * Class Configuration Step
 * Configure class details, difficulty levels, and settings
 * Matches the design pattern of teacher creation wizard
 */

import React from 'react';
import { Users, MessageCircle, Clock, GraduationCap, AlertCircle, Check } from 'lucide-react';
import { useConfigurationStep, useClassWizardStore } from '@/stores/class-wizard.store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { getDifficultyLevel } from '@/types/class-concepts.types';

export function ClassConfigurationStep() {
  const { data, update, errors } = useConfigurationStep();
  const domainData = useClassWizardStore(state => state.data.domain);
  const selectedDomain = domainData.availableDomains.find(
    d => d.id === domainData.selectedDomainId
  );

  const handleInputChange = (field: string, value: any) => {
    update({ [field]: value });
  };

  const handleDifficultyToggle = (levelId: string) => {
    const currentIds = data.difficultyLevelIds || [];
    const newIds = currentIds.includes(levelId)
      ? currentIds.filter(id => id !== levelId)
      : [...currentIds, levelId];
    
    // Update difficulty progression based on selection
    if (newIds.length === 0) {
      update({ 
        difficultyLevelIds: newIds,
        difficultyProgression: 'single'
      });
    } else if (newIds.length === 1) {
      update({ 
        difficultyLevelIds: newIds,
        difficultyProgression: 'single'
      });
    } else {
      // Check if levels are sequential
      const levelOrders = newIds
        .map(id => selectedDomain?.difficultyLevels.find(l => l.id === id)?.level_order || 0)
        .sort((a, b) => a - b);
      
      let isSequential = true;
      for (let i = 1; i < levelOrders.length; i++) {
        if (levelOrders[i] - levelOrders[i-1] !== 1) {
          isSequential = false;
          break;
        }
      }
      
      update({ 
        difficultyLevelIds: newIds,
        difficultyProgression: isSequential ? 'sequential' : 'mixed'
      });
    }
  };

  // Auto-generate class name when difficulty levels change
  React.useEffect(() => {
    if (data.difficultyLevelIds.length > 0 && selectedDomain && !data.className) {
      const firstLevel = selectedDomain.difficultyLevels.find(
        l => l.id === data.difficultyLevelIds[0]
      );
      if (firstLevel) {
        const levelText = data.difficultyLevelIds.length > 1 
          ? `${firstLevel.level_name}+` 
          : firstLevel.level_name;
        update({ className: `${levelText} ${selectedDomain.name}` });
      }
    }
  }, [data.difficultyLevelIds, selectedDomain]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Class Configuration</h3>
        <p className="text-muted-foreground">Set up your class details and difficulty levels</p>
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

      {/* Class Name and Description */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="className">
            Class Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="className"
            value={data.className}
            onChange={(e) => handleInputChange('className', e.target.value)}
            placeholder="e.g., Beginner Piano, Advanced Mathematics"
            className="text-base"
          />
          <p className="text-sm text-muted-foreground">
            This name will be displayed to students
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
            className="resize-none"
          />
        </div>
      </div>

      {/* Difficulty Levels Selection */}
      <div className="space-y-3">
        <div>
          <Label className="text-base">
            Difficulty Level(s) <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            Select one or more difficulty levels. Students will progress through selected levels.
          </p>
        </div>

        {selectedDomain ? (
          <div className="space-y-2">
            {selectedDomain.difficultyLevels.map((level) => {
              const isSelected = data.difficultyLevelIds.includes(level.id);
              // Safely get difficulty info, with fallback if level_order is undefined
              const difficultyInfo = level.level_order 
                ? getDifficultyLevel(level.level_order) 
                : { color: '#666', icon: '📚', label: level.level_name || 'Unknown' };
              
              return (
                <div
                  key={level.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground/50'
                  }`}
                  onClick={() => handleDifficultyToggle(level.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleDifficultyToggle(level.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="px-2 py-0.5"
                      style={{ 
                        borderColor: difficultyInfo.color,
                        color: difficultyInfo.color,
                        backgroundColor: `${difficultyInfo.color}15`
                      }}
                    >
                      {difficultyInfo.icon} {level.level_name || `Level ${level.level_order}`}
                    </Badge>
                    <div>
                      <p className="font-medium">{level.level_name}</p>
                      {level.description && (
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a domain first to see available difficulty levels.
            </AlertDescription>
          </Alert>
        )}

        {data.difficultyLevelIds.length > 1 && (
          <Alert className="border-primary/50 bg-primary/5">
            <GraduationCap className="h-4 w-4 text-primary" />
            <AlertDescription className="text-primary">
              <strong>Progression Mode:</strong> {
                data.difficultyProgression === 'sequential' 
                  ? 'Students will progress through levels in order'
                  : 'Mixed difficulty levels - suitable for differentiated learning'
              }
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Class Type */}
      <div className="space-y-3">
        <Label className="text-base">Class Type</Label>
        <RadioGroup
          value={data.frequency}
          onValueChange={(value) => handleInputChange('frequency', value)}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <label
              htmlFor="weekly"
              className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                data.frequency === 'weekly' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <RadioGroupItem value="weekly" id="weekly" />
              <div className="flex-1">
                <p className="font-medium">Weekly</p>
                <p className="text-xs text-muted-foreground">Meets every week</p>
              </div>
            </label>
            
            <label
              htmlFor="bi-weekly"
              className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                data.frequency === 'bi-weekly' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <RadioGroupItem value="bi-weekly" id="bi-weekly" />
              <div className="flex-1">
                <p className="font-medium">Bi-weekly</p>
                <p className="text-xs text-muted-foreground">Every 2 weeks</p>
              </div>
            </label>
            
            <label
              htmlFor="monthly"
              className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                data.frequency === 'monthly' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <RadioGroupItem value="monthly" id="monthly" />
              <div className="flex-1">
                <p className="font-medium">Monthly</p>
                <p className="text-xs text-muted-foreground">Once a month</p>
              </div>
            </label>
          </div>
        </RadioGroup>
      </div>

      {/* Class Size */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="maxStudents">
            Maximum Students <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-4">
            <Slider
              id="maxStudents"
              min={1}
              max={100}
              step={1}
              value={[data.maxStudents]}
              onValueChange={([value]) => handleInputChange('maxStudents', value)}
              className="flex-1"
            />
            <div className="w-20">
              <Input
                type="number"
                min={1}
                max={100}
                value={data.maxStudents}
                onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value) || 1)}
                className="text-center"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Set the maximum number of students (1-100)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minStudents">Minimum Students (Optional)</Label>
          <div className="flex items-center gap-4">
            <Slider
              id="minStudents"
              min={1}
              max={data.maxStudents}
              step={1}
              value={[data.minStudents || 1]}
              onValueChange={([value]) => handleInputChange('minStudents', value)}
              className="flex-1"
            />
            <div className="w-20">
              <Input
                type="number"
                min={1}
                max={data.maxStudents}
                value={data.minStudents || 1}
                onChange={(e) => handleInputChange('minStudents', parseInt(e.target.value) || 1)}
                className="text-center"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Class will only start with this minimum enrollment
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <Label className="text-base">Additional Settings</Label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Allow Student Messages</p>
                <p className="text-sm text-muted-foreground">
                  Students can send you direct messages
                </p>
              </div>
            </div>
            <Switch
              checked={data.allowsStudentMessages}
              onCheckedChange={(checked) => handleInputChange('allowsStudentMessages', checked)}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      {data.className && data.difficultyLevelIds.length > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Configuration complete:</strong> {data.className} • {
              data.difficultyLevelIds.length === 1 ? '1 level' : `${data.difficultyLevelIds.length} levels`
            } • Max {data.maxStudents} students
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}