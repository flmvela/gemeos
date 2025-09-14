import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Building, 
  CreditCard, 
  Settings, 
  Users, 
  Globe,
  Crown,
  CheckCircle,
  AlertCircle,
  Music,
  Brain,
  Languages
} from 'lucide-react';

const domains = [
  { id: 1, name: 'Music Theory', description: 'Comprehensive music theory curriculum', students: 142, status: 'active', icon: Music },
  { id: 2, name: 'Music Composition', description: 'Creative composition and songwriting', students: 89, status: 'active', icon: Music },
  { id: 3, name: 'Performance Skills', description: 'Live performance and stage presence', students: 58, status: 'active', icon: Music },
  { id: 4, name: 'Language Arts', description: 'Literature and writing skills', students: 0, status: 'available', icon: Languages },
  { id: 5, name: 'STEM Foundations', description: 'Science, technology, engineering, math', students: 0, status: 'available', icon: Brain },
];

interface TenantSettingsProps {
  activeSection: string;
}

export function TenantSettings({ activeSection }: TenantSettingsProps) {
  const [formData, setFormData] = useState({
    academyName: 'Harmony Music Academy',
    address: '123 Music Lane, San Francisco, CA 94102',
    phone: '+1 (555) 123-4567',
    email: 'admin@harmonymusic.edu',
    website: 'www.harmonymusic.edu',
    description: 'Premier music education institution specializing in classical and contemporary music training.',
    notifications: true,
    autoEnrollment: false,
    publicProfile: true
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (activeSection === 'billing') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Billing & Plans</h2>
            <p className="text-gray-600">Manage your subscription and billing information</p>
          </div>
          <Badge className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white border-0">
            <Crown className="w-4 h-4 mr-1" />
            Premium Plan
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Current Plan */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Premium Plan</h3>
                  <p className="text-gray-600">Full access to all features</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">$299</div>
                  <div className="text-sm text-gray-500">/month</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Students included</span>
                  <span className="text-gray-900">500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Teachers included</span>
                  <span className="text-gray-900">25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Domains access</span>
                  <span className="text-gray-900">All domains</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next billing</span>
                  <span className="text-gray-900">March 15, 2025</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current usage</span>
                    <span className="text-gray-900">289/500 students</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] h-2 rounded-full" style={{ width: '58%' }} />
                  </div>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] hover:from-[#7c3aed] hover:to-[#db2777] text-white border-0">
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-5 bg-blue-600 rounded text-white flex items-center justify-center text-xs font-bold">
                      VISA
                    </div>
                    <span className="text-gray-900">•••• •••• •••• 4242</span>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-300">Active</Badge>
                </div>
                <div className="text-sm text-gray-600">Expires 12/2027</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardholder">Cardholder Name</Label>
                <Input id="cardholder" defaultValue="Harmony Music Academy" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing-email">Billing Email</Label>
                <Input id="billing-email" defaultValue="billing@harmonymusic.edu" />
              </div>

              <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                Update Payment Method
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Billing History */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Billing History</CardTitle>
            <CardDescription className="text-gray-600">Your recent payment history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { date: 'Feb 15, 2025', amount: '$299.00', status: 'paid', invoice: 'INV-2025-02-001' },
                { date: 'Jan 15, 2025', amount: '$299.00', status: 'paid', invoice: 'INV-2025-01-001' },
                { date: 'Dec 15, 2024', amount: '$299.00', status: 'paid', invoice: 'INV-2024-12-001' },
              ].map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium text-gray-900">{payment.invoice}</div>
                      <div className="text-sm text-gray-600">{payment.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{payment.amount}</div>
                    <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === 'domains') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Domain Management</h2>
          <p className="text-gray-600">Manage learning domains available to your academy</p>
        </div>

        <div className="grid gap-6">
          {domains.map((domain) => (
            <Card key={domain.id} className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <domain.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{domain.name}</h3>
                      <p className="text-gray-600">{domain.description}</p>
                      {domain.students > 0 && (
                        <p className="text-sm text-blue-600 mt-1">{domain.students} students enrolled</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={
                      domain.status === 'active' 
                        ? 'bg-green-100 text-green-700 border-green-300' 
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                    }>
                      {domain.status}
                    </Badge>
                    <Button 
                      variant={domain.status === 'active' ? 'outline' : 'default'}
                      className={domain.status === 'active' 
                        ? 'border-gray-300 text-gray-700 hover:bg-gray-50' 
                        : 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white border-0'
                      }
                    >
                      {domain.status === 'active' ? 'Manage' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tenant Configuration</h2>
        <p className="text-gray-600">Manage your academy settings and preferences</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              Academy Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="academy-name">Academy Name</Label>
              <Input 
                id="academy-name" 
                value={formData.academyName}
                onChange={(e) => handleInputChange('academyName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea 
                id="address" 
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input 
                id="website" 
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-purple-600" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Email Notifications</Label>
                <p className="text-sm text-gray-600">Receive updates about your academy</p>
              </div>
              <Switch 
                checked={formData.notifications}
                onCheckedChange={(checked) => handleInputChange('notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Auto Enrollment</Label>
                <p className="text-sm text-gray-600">Automatically enroll new students in default classes</p>
              </div>
              <Switch 
                checked={formData.autoEnrollment}
                onCheckedChange={(checked) => handleInputChange('autoEnrollment', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base">Public Profile</Label>
                <p className="text-sm text-gray-600">Allow your academy to be discoverable</p>
              </div>
              <Switch 
                checked={formData.publicProfile}
                onCheckedChange={(checked) => handleInputChange('publicProfile', checked)}
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="space-y-2">
                <Label>Time Zone</Label>
                <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                  <option>Pacific Standard Time (PST)</option>
                  <option>Eastern Standard Time (EST)</option>
                  <option>Central Standard Time (CST)</option>
                  <option>Mountain Standard Time (MST)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
          Cancel
        </Button>
        <Button className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white border-0">
          Save Changes
        </Button>
      </div>
    </div>
  );
}