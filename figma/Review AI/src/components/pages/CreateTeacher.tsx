import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  UserPlus, 
  Upload, 
  Mail, 
  Phone, 
  MapPin,
  GraduationCap,
  Music,
  Calendar,
  Settings,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

const availableSubjects = [
  'Piano', 'Guitar', 'Violin', 'Drums', 'Voice', 'Music Theory', 
  'Composition', 'Music Production', 'Orchestra', 'Jazz', 'Classical', 'Contemporary'
];

const availableDomains = [
  { id: 'music-theory', name: 'Music Theory', description: 'Fundamental music concepts' },
  { id: 'performance', name: 'Performance Skills', description: 'Live performance techniques' },
  { id: 'composition', name: 'Music Composition', description: 'Creative composition and songwriting' },
  { id: 'production', name: 'Music Production', description: 'Digital audio workstation skills' },
];

export function CreateTeacher() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    subjects: [] as string[],
    domains: [] as string[],
    startDate: '',
    employmentType: 'full-time',
    hourlyRate: '',
    maxStudents: '25',
    availability: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    }
  });

  const [step, setStep] = useState(1);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleDomainToggle = (domainId: string) => {
    setFormData(prev => ({
      ...prev,
      domains: prev.domains.includes(domainId)
        ? prev.domains.filter(d => d !== domainId)
        : [...prev.domains, domainId]
    }));
  };

  const handleAvailabilityChange = (day: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      availability: { ...prev.availability, [day]: checked }
    }));
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && formData.phone;
      case 2:
        return formData.subjects.length > 0 && formData.domains.length > 0;
      case 3:
        return formData.startDate && formData.employmentType;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="relative inline-block">
                <Avatar className="h-24 w-24">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white text-lg">
                      {formData.firstName[0]}{formData.lastName[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
                <Button 
                  size="sm" 
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">Upload profile picture</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input 
                  id="firstName" 
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input 
                  id="lastName" 
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="teacher@harmonymusic.edu"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  id="phone" 
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea 
                  id="address" 
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter full address"
                  className="pl-10"
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea 
                id="bio" 
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about the teacher's experience and qualifications"
                rows={4}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Teaching Subjects *</Label>
                <p className="text-sm text-gray-600 mb-3">Select the subjects this teacher can teach</p>
                <div className="grid grid-cols-3 gap-3">
                  {availableSubjects.map((subject) => (
                    <div key={subject} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subject-${subject}`}
                        checked={formData.subjects.includes(subject)}
                        onCheckedChange={() => handleSubjectToggle(subject)}
                      />
                      <Label htmlFor={`subject-${subject}`} className="text-sm font-normal">
                        {subject}
                      </Label>
                    </div>
                  ))}
                </div>
                {formData.subjects.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Selected subjects:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.subjects.map((subject) => (
                        <Badge key={subject} className="bg-blue-100 text-blue-700 border-blue-300">
                          {subject}
                          <button
                            onClick={() => handleSubjectToggle(subject)}
                            className="ml-1 hover:bg-blue-200 rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-base font-medium">Domain Access *</Label>
                <p className="text-sm text-gray-600 mb-3">Select which learning domains this teacher can access</p>
                <div className="space-y-3">
                  {availableDomains.map((domain) => (
                    <div key={domain.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                      <Checkbox
                        id={`domain-${domain.id}`}
                        checked={formData.domains.includes(domain.id)}
                        onCheckedChange={() => handleDomainToggle(domain.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor={`domain-${domain.id}`} className="font-medium">
                          {domain.name}
                        </Label>
                        <p className="text-sm text-gray-600">{domain.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    id="startDate" 
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type *</Label>
                <select
                  id="employmentType"
                  value={formData.employmentType}
                  onChange={(e) => handleInputChange('employmentType', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <Input 
                  id="hourlyRate" 
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                  placeholder="50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStudents">Maximum Students</Label>
                <Input 
                  id="maxStudents" 
                  type="number"
                  value={formData.maxStudents}
                  onChange={(e) => handleInputChange('maxStudents', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Availability</Label>
                <p className="text-sm text-gray-600 mb-3">Select the days this teacher is available</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(formData.availability).map(([day, available]) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox
                        id={`availability-${day}`}
                        checked={available}
                        onCheckedChange={(checked) => handleAvailabilityChange(day, checked as boolean)}
                      />
                      <Label htmlFor={`availability-${day}`} className="capitalize">
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Add New Teacher</h2>
        <p className="text-gray-600">Create a new teacher account and set up their profile</p>
      </div>

      {/* Progress Steps */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= num 
                    ? 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > num ? <CheckCircle className="w-4 h-4" /> : num}
                </div>
                {num < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > num ? 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-center">
            <div className="text-center">
              <h3 className="font-medium text-gray-900">
                {step === 1 && 'Basic Information'}
                {step === 2 && 'Teaching Subjects & Domains'}
                {step === 3 && 'Employment Details'}
              </h3>
              <p className="text-sm text-gray-600">
                {step === 1 && 'Enter the teacher\'s personal information'}
                {step === 2 && 'Select subjects and domains they can teach'}
                {step === 3 && 'Set employment terms and availability'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Previous
        </Button>
        
        <div className="flex space-x-3">
          <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            Save as Draft
          </Button>
          
          {step < 3 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white border-0"
            >
              Next Step
            </Button>
          ) : (
            <Button
              disabled={!canProceed()}
              className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white border-0"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create Teacher
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}