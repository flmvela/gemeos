import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar } from '../components/ui/avatar';
import { 
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  Plus as PlusIcon,
  List as ListIcon,
  BarChart as BarChartIcon,
  Edit as EditIcon,
  Server as ServerIcon,
  Users as UsersIcon,
  GraduationCap as GraduationCapIcon,
  School as SchoolIcon,
  Mail as MailIcon,
  Bell as BellIcon,
  Activity as ActivityIcon,
  Loader2 as LoaderIcon
} from 'lucide-react';
import { platformAdminService, type PlatformDashboardStats, type TenantHeaderInfo } from '../services/platform-admin.service';
import { tenantService } from '../services/tenant.service';
import type { Tenant } from '../types/auth.types';
import { useAuth } from '../hooks/useAuth';
import { UserDropdown } from '../components/UserDropdown';

// Platform Admin Dashboard Component
export default function PlatformAdminDashboard() {
  const { session, isPlatformAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'statistics'>('list');
  const [stats, setStats] = useState<PlatformDashboardStats>({
    tenants: 0,
    teachers: 0,
    students: 0,
    classes: 0,
    newMessages: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);
  const [tenantHeaderInfo, setTenantHeaderInfo] = useState<TenantHeaderInfo>({
    name: 'Loading...',
    initials: '--',
    subscription_tier: 'loading'
  });

  // Load dashboard statistics and tenants
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingStats(true);
        setIsLoadingTenants(true);
        
        // Load stats, tenants, and header info in parallel
        const [dashboardStats, tenantsData, headerInfo] = await Promise.all([
          platformAdminService.getDashboardStats(),
          tenantService.getTenants(),
          platformAdminService.getTenantHeaderInfo()
        ]);
        
        setStats(dashboardStats);
        setTenants(tenantsData);
        setTenantHeaderInfo(headerInfo);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoadingStats(false);
        setIsLoadingTenants(false);
      }
    };

    loadData();
  }, []);

  // Set page title
  useEffect(() => {
    document.title = 'Platform Admin Dashboard - Gemeos';
    
    // Add canonical URL for SEO
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', window.location.origin + '/admin/dashboard');
      document.head.appendChild(link);
    } else {
      canonical.setAttribute('href', window.location.origin + '/admin/dashboard');
    }
  }, []);

  // Generate mock data for additional columns
  const generateMockTenantData = (tenant: Tenant, index: number) => {
    const mockLocations = [
      'San Francisco, CA',
      'New York, NY', 
      'Los Angeles, CA',
      'Chicago, IL',
      'Austin, TX',
      'Seattle, WA',
      'Boston, MA',
      'Denver, CO'
    ];
    
    return {
      ...tenant,
      teachers: Math.floor(Math.random() * 25) + 5, // 5-30 teachers
      classes: Math.floor(Math.random() * 40) + 10, // 10-50 classes
      students: Math.floor(Math.random() * 600) + 50, // 50-650 students
      hasNotifications: Math.random() > 0.6, // 40% chance of notifications
      location: mockLocations[index % mockLocations.length]
    };
  };

  // Generate header info based on user role
  const getHeaderInfo = () => {
    if (isPlatformAdmin) {
      // Platform Admin: Show first letters of first and last name, or first letter of email
      const email = session?.email || '';
      const emailParts = email.split('@')[0]; // Get part before @
      const nameParts = emailParts.split(/[._-]/); // Split by common email separators
      
      let initials = '';
      let displayName = 'Platform Admin';
      
      if (nameParts.length >= 2) {
        // If we have multiple parts, use first letter of first and last
        initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        displayName = nameParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
      } else {
        // Fallback to first letter of email
        initials = email[0]?.toUpperCase() || 'PA';
        displayName = emailParts.charAt(0).toUpperCase() + emailParts.slice(1);
      }
      
      return {
        name: displayName,
        initials,
        subscription_tier: null // Platform admin doesn't have subscription tier
      };
    } else {
      // Tenant User: Show tenant info
      return {
        name: tenantHeaderInfo.name,
        initials: tenantHeaderInfo.initials,
        subscription_tier: tenantHeaderInfo.subscription_tier
      };
    }
  };

  const headerInfo = getHeaderInfo();

  // Enhance tenants with mock data and filter based on search term
  const enhancedTenants = tenants.map((tenant, index) => generateMockTenantData(tenant, index));
  const filteredTenants = enhancedTenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tenant.location && tenant.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Platform Admin Dashboard</h1>
          <p className="text-gray-600">Manage your music academy with AI-powered tools</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{headerInfo.name}</p>
            {headerInfo.subscription_tier && (
              <Badge className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                headerInfo.subscription_tier === 'premium' 
                  ? 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white'
                  : headerInfo.subscription_tier === 'basic'
                  ? 'bg-blue-100 text-blue-800'
                  : headerInfo.subscription_tier === 'enterprise'
                  ? 'bg-purple-100 text-purple-800'
                  : headerInfo.subscription_tier === 'free'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {headerInfo.subscription_tier} Plan
              </Badge>
            )}
          </div>
          <UserDropdown />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Tenants Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Tenants</div>
            <ServerIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex items-center space-x-2">
                <LoaderIcon className="h-4 w-4 animate-spin text-gray-400" />
                <div className="text-2xl font-bold text-gray-400">--</div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-900">{stats.tenants}</div>
            )}
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUpIcon className="w-3 h-3 mr-1" />
              +1 this month
            </p>
          </CardContent>
        </Card>

        {/* Teachers Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Teachers</div>
            <GraduationCapIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex items-center space-x-2">
                <LoaderIcon className="h-4 w-4 animate-spin text-gray-400" />
                <div className="text-2xl font-bold text-gray-400">--</div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-900">{stats.teachers}</div>
            )}
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUpIcon className="w-3 h-3 mr-1" />
              +5 this month
            </p>
          </CardContent>
        </Card>

        {/* Students Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Students</div>
            <UsersIcon className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex items-center space-x-2">
                <LoaderIcon className="h-4 w-4 animate-spin text-gray-400" />
                <div className="text-2xl font-bold text-gray-400">--</div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-900">{stats.students}</div>
            )}
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUpIcon className="w-3 h-3 mr-1" />
              +47 this month
            </p>
          </CardContent>
        </Card>

        {/* Classes Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Classes</div>
            <SchoolIcon className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex items-center space-x-2">
                <LoaderIcon className="h-4 w-4 animate-spin text-gray-400" />
                <div className="text-2xl font-bold text-gray-400">--</div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-900">{stats.classes}</div>
            )}
            <p className="text-xs text-blue-600 flex items-center mt-1">
              <TrendingUpIcon className="w-3 h-3 mr-1" />
              +8 this month
            </p>
          </CardContent>
        </Card>

        {/* New Messages Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">New Messages</div>
            <MailIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex items-center space-x-2">
                <LoaderIcon className="h-4 w-4 animate-spin text-gray-400" />
                <div className="text-2xl font-bold text-gray-400">--</div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-900">{stats.newMessages}</div>
            )}
            <p className="text-xs text-amber-600 mt-1">From all tenants</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Section with View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {viewMode === 'list' ? 'Tenant Management' : 'Platform Statistics'}
              </h3>
              <p className="text-gray-600 text-sm">
                {viewMode === 'list' 
                  ? 'Manage tenants and monitor their activity across the platform'
                  : 'Analytics and insights across all tenants'
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              {viewMode === 'list' && (
                <Button className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:from-[#0891b2] hover:to-[#7c3aed] px-4 py-2 rounded-md font-medium transition-all duration-200">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Tenant
                </Button>
              )}
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="List View"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('statistics')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'statistics'
                      ? 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Statistics View"
                >
                  <BarChartIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'list' ? (
            <div className="space-y-4">
              {/* Search Field */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tenants by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                />
              </div>

              {/* Tenants Table */}
              <div className="overflow-x-auto">
                {isLoadingTenants ? (
                  <div className="flex justify-center items-center py-12">
                    <LoaderIcon className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">Loading tenants...</span>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Tenant Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900"># Teachers</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900"># Classes</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900"># Students</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Notifications</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTenants.map((tenant) => (
                        <tr key={tenant.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white text-sm">
                                {tenant.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">{tenant.name}</div>
                                <div className="text-xs text-gray-500">{tenant.location}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <GraduationCapIcon className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-gray-900">{tenant.teachers}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <SchoolIcon className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-gray-900">{tenant.classes}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <UsersIcon className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-gray-900">{tenant.students}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center">
                              {tenant.hasNotifications ? (
                                <div className="relative">
                                  <BellIcon className="w-5 h-5 text-amber-500" />
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                  </div>
                                </div>
                              ) : (
                                <BellIcon className="w-5 h-5 text-gray-300" />
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                              <EditIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!isLoadingTenants && filteredTenants.length === 0 && tenants.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                              <ServerIcon className="w-12 h-12 text-gray-300 mb-4" />
                              <p className="text-lg font-medium">No tenants yet</p>
                              <p className="text-sm text-gray-400 mt-1">Get started by creating your first tenant</p>
                            </div>
                          </td>
                        </tr>
                      )}
                      {!isLoadingTenants && filteredTenants.length === 0 && tenants.length > 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                              <SearchIcon className="w-8 h-8 text-gray-300 mb-2" />
                              <p>No tenants found matching "{searchTerm}"</p>
                              <p className="text-sm text-gray-400 mt-1">Try adjusting your search terms</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            // Statistics View
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* AI vs Teacher Created Exercises Chart */}
                <Card>
                  <CardHeader>
                    <h4 className="text-lg font-semibold text-gray-900">Exercise Creation - Last 4 Weeks</h4>
                    <p className="text-gray-600 text-sm">AI-generated vs Teacher-created exercises</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative">
                      <div className="text-center">
                        <BarChartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <div className="space-y-2">
                          <div className="flex items-center justify-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] rounded"></div>
                              <span className="text-sm text-gray-700">AI Created: 2,847</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-gray-400 rounded"></div>
                              <span className="text-sm text-gray-700">Teacher Created: 1,203</span>
                            </div>
                          </div>
                          <p className="text-gray-500 text-sm">70% AI-generated content</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Learning Plan Adherence Chart */}
                <Card>
                  <CardHeader>
                    <h4 className="text-lg font-semibold text-gray-900">Learning Plan Progress</h4>
                    <p className="text-gray-600 text-sm">Student adherence to designed learning paths</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative">
                      <div className="text-center">
                        <ActivityIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                              <span className="text-sm text-gray-700">Not on track: 10% (161 students)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                              <span className="text-sm text-gray-700">On track: 60% (967 students)</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                              <span className="text-sm text-gray-700">Over performing: 30% (486 students)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Platform Metrics */}
              <div className="grid lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <h4 className="font-semibold text-gray-900">Platform Usage</h4>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Daily Active Users</span>
                        <span className="text-sm font-medium text-gray-900">1,247</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Weekly Active Users</span>
                        <span className="text-sm font-medium text-gray-900">4,892</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg. Session Duration</span>
                        <span className="text-sm font-medium text-gray-900">24m 35s</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h4 className="font-semibold text-gray-900">Content Metrics</h4>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Exercises</span>
                        <span className="text-sm font-medium text-gray-900">4,050</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completion Rate</span>
                        <span className="text-sm font-medium text-gray-900">87.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg. Score</span>
                        <span className="text-sm font-medium text-gray-900">84.6%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h4 className="font-semibold text-gray-900">System Health</h4>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Uptime</span>
                        <span className="text-sm font-medium text-green-600">99.98%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Response Time</span>
                        <span className="text-sm font-medium text-gray-900">127ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">API Calls/min</span>
                        <span className="text-sm font-medium text-gray-900">2,847</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}