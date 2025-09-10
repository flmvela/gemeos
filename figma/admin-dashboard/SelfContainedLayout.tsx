import React, { useState } from 'react';

// Simple SVG Icons - no external dependencies
const HomeIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const SettingsIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UsersIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const GraduationCapIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
  </svg>
);

const SchoolIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);



const ChevronRightIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const MenuIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const XIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const BookOpenIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const TrendingUpIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const ActivityIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UserPlusIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v6M21 12h-6" />
  </svg>
);

const PlusIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const MailIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const BellIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const SearchIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ListIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const BarChartIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const EditIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const ServerIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);

// Simple components
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = "default",
  className = "",
  ...props 
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  variant?: "default" | "outline";
  className?: string;
  [key: string]: any;
}) => {
  const baseClasses = "px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center justify-center";
  const variants = {
    default: "bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:from-[#0891b2] hover:to-[#7c3aed]",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const Avatar = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-full flex items-center justify-center font-medium ${className}`}>
    {children}
  </div>
);

type MenuItem = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  page: string;
  items?: {
    title: string;
    page: string;
  }[];
};

const navigationItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: HomeIcon,
    page: 'dashboard'
  },
  {
    title: 'Platform Admin Dashboard',
    icon: ServerIcon,
    page: 'platform-admin'
  },
  {
    title: 'Settings & Setup',
    icon: SettingsIcon,
    page: 'settings',
    items: [
      { title: 'Tenant Configuration', page: 'tenant-config' },
      { title: 'Billing & Plans', page: 'billing' },
      { title: 'Domain Management', page: 'domains' }
    ]
  },
  {
    title: 'Teacher Management',
    icon: GraduationCapIcon,
    page: 'teachers',
    items: [
      { title: 'View All Teachers', page: 'manage-teachers' },
      { title: 'Add New Teacher', page: 'create-teacher' },
      { title: 'Teacher Analytics', page: 'teacher-analytics' }
    ]
  },
  {
    title: 'Class Management',
    icon: SchoolIcon,
    page: 'classes',
    items: [
      { title: 'All Classes', page: 'manage-classes' },
      { title: 'Create Class', page: 'create-class' },
      { title: 'Class Schedules', page: 'schedules' }
    ]
  },
  {
    title: 'Student Overview',
    icon: UsersIcon,
    page: 'students',
    items: [
      { title: 'All Students', page: 'all-students' },
      { title: 'Student Progress', page: 'student-progress' },
      { title: 'Enrollment', page: 'enrollment' }
    ]
  }
];

// Platform Admin Dashboard Component
function PlatformAdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'statistics'>('list');

  const tenants = [
    {
      id: 1,
      name: 'Harmony Music Academy',
      teachers: 12,
      classes: 28,
      students: 289,
      hasNotifications: true,
      location: 'San Francisco, CA'
    },
    {
      id: 2,
      name: 'Elite Learning Institute',
      teachers: 8,
      classes: 15,
      students: 156,
      hasNotifications: false,
      location: 'New York, NY'
    },
    {
      id: 3,
      name: 'Creative Arts School',
      teachers: 15,
      classes: 32,
      students: 402,
      hasNotifications: true,
      location: 'Los Angeles, CA'
    },
    {
      id: 4,
      name: 'Global Education Hub',
      teachers: 22,
      classes: 45,
      students: 678,
      hasNotifications: false,
      location: 'Chicago, IL'
    },
    {
      id: 5,
      name: 'Future Skills Academy',
      teachers: 6,
      classes: 12,
      students: 89,
      hasNotifications: true,
      location: 'Austin, TX'
    }
  ];

  // Filter tenants based on search term
  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals for cards
  const totalTenants = tenants.length;
  const totalTeachers = tenants.reduce((sum, tenant) => sum + tenant.teachers, 0);
  const totalStudents = tenants.reduce((sum, tenant) => sum + tenant.students, 0);
  const totalClasses = tenants.reduce((sum, tenant) => sum + tenant.classes, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Tenants Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Tenants</div>
            <ServerIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalTenants}</div>
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
            <div className="text-2xl font-bold text-gray-900">{totalTeachers}</div>
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
            <div className="text-2xl font-bold text-gray-900">{totalStudents}</div>
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
            <div className="text-2xl font-bold text-gray-900">{totalClasses}</div>
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
            <div className="text-2xl font-bold text-gray-900">23</div>
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
                <Button className="flex items-center">
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
                    {filteredTenants.length === 0 && (
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

// Dashboard Component
function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const teachers = [
    { 
      id: 1, 
      name: 'Sarah Chen', 
      domains: ['Piano', 'Music Theory'], 
      classes: 3, 
      students: 24, 
      hasNotifications: true,
      status: 'online' 
    },
    { 
      id: 2, 
      name: 'Marcus Rodriguez', 
      domains: ['Guitar', 'Composition'], 
      classes: 2, 
      students: 18, 
      hasNotifications: false,
      status: 'online' 
    },
    { 
      id: 3, 
      name: 'Emma Thompson', 
      domains: ['Violin', 'Orchestra'], 
      classes: 2, 
      students: 15, 
      hasNotifications: true,
      status: 'away' 
    },
    { 
      id: 4, 
      name: 'David Kim', 
      domains: ['Music Production', 'Audio Engineering'], 
      classes: 3, 
      students: 12, 
      hasNotifications: false,
      status: 'offline' 
    },
    { 
      id: 5, 
      name: 'Lisa Wang', 
      domains: ['Jazz Performance'], 
      classes: 1, 
      students: 8, 
      hasNotifications: true,
      status: 'online' 
    },
  ];

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.domains.some(domain => domain.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Teachers Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Teachers</div>
            <GraduationCapIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">12</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUpIcon className="w-3 h-3 mr-1" />
              +2 from last month
            </p>
          </CardContent>
        </Card>

        {/* Students Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Students</div>
            <UsersIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">289</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUpIcon className="w-3 h-3 mr-1" />
              +23 from last month
            </p>
          </CardContent>
        </Card>

        {/* Classes Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Classes</div>
            <SchoolIcon className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">28</div>
            <p className="text-xs text-blue-600 flex items-center mt-1">
              <TrendingUpIcon className="w-3 h-3 mr-1" />
              +5 this month
            </p>
          </CardContent>
        </Card>

        {/* New Messages Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">New Messages</div>
            <MailIcon className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">7</div>
            <p className="text-xs text-amber-600 mt-1">Unread messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Action Buttons */}
      <div className="flex gap-4 mb-6 items-center">
        {/* Search Field */}
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search teachers by name or domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button className="flex items-center">
            <UserPlusIcon className="w-4 h-4 mr-2" />
            Add Teacher
          </Button>
          <Button variant="outline" className="flex items-center">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Class
          </Button>
        </div>
      </div>

      {/* Teachers List */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Teachers Overview</h3>
          <p className="text-gray-600 text-sm">Manage your academy faculty and track their progress</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Teacher Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Domains Taught</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Classes</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Students</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Notifications</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white text-sm">
                          {teacher.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{teacher.name}</div>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              teacher.status === 'online' ? 'bg-green-400' : 
                              teacher.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                            }`} />
                            <span className="text-xs text-gray-500 capitalize">{teacher.status}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {teacher.domains.map((domain, index) => (
                          <Badge key={index} className="bg-blue-100 text-blue-800 text-xs">
                            {domain}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <SchoolIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{teacher.classes}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <UsersIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{teacher.students}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        {teacher.hasNotifications ? (
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
                  </tr>
                ))}
                {filteredTeachers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <SearchIcon className="w-8 h-8 text-gray-300 mb-2" />
                        <p>No teachers found matching "{searchTerm}"</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search terms</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SelfContainedLayoutProps {
  onNavigateToWelcome: () => void;
}

export function SelfContainedLayout({ onNavigateToWelcome }: SelfContainedLayoutProps) {
  const [activePage, setActivePage] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['teachers', 'classes']);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleMenu = (menuPage: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuPage)
        ? prev.filter(p => p !== menuPage)
        : [...prev, menuPage]
    );
  };

  const handlePageChange = (page: string) => {
    setActivePage(page);
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'platform-admin':
        return <PlatformAdminDashboard />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">Coming Soon</div>
              <div className="text-gray-600">This section is under development</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar */}
      <div 
        className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 flex-shrink-0`}
        style={{
          background: 'linear-gradient(180deg, #030213 0%, #1e1b4b 50%, #312e81 100%)'
        }}
      >
        <div className="h-full flex flex-col border-r border-white/10">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className={`flex items-center space-x-3 ${!sidebarOpen && 'justify-center'}`}>
                <button
                  onClick={onNavigateToWelcome}
                  className="text-2xl font-bold bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent hover:from-[#0891b2] hover:to-[#7c3aed] transition-all duration-200 hover:scale-105 cursor-pointer"
                >
                  {sidebarOpen ? 'Gemeos' : 'G'}
                </button>
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white/60 hover:text-white transition-colors"
              >
                {sidebarOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
              </button>
            </div>
            {sidebarOpen && (
              <div className="mt-4 p-3 bg-white/5 rounded-lg backdrop-blur-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white">
                    HA
                  </Avatar>
                  <div>
                    <div className="text-white font-medium">Harmony Music Academy</div>
                    <div className="text-white/60 text-sm">San Francisco, CA</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 p-2 overflow-y-auto">
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <div key={item.page}>
                  <button
                    onClick={() => {
                      if (item.items) {
                        toggleMenu(item.page);
                      } else {
                        handlePageChange(item.page);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                      activePage === item.page || (item.items && item.items.some(subItem => subItem.page === activePage))
                        ? 'bg-white/15 text-white font-medium'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      {sidebarOpen && <span>{item.title}</span>}
                    </div>
                    {sidebarOpen && item.items && (
                      <ChevronRightIcon className={`w-4 h-4 transition-transform ${expandedMenus.includes(item.page) ? 'rotate-90' : ''}`} />
                    )}
                  </button>
                  {sidebarOpen && item.items && expandedMenus.includes(item.page) && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.items.map((subItem) => (
                        <button
                          key={subItem.page}
                          onClick={() => handlePageChange(subItem.page)}
                          className={`w-full text-left p-2 rounded-md transition-all duration-200 ${
                            activePage === subItem.page
                              ? 'bg-white/12 text-white font-medium'
                              : 'text-white/60 hover:text-white hover:bg-white/8'
                          }`}
                        >
                          {subItem.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Usage Stats */}
          {sidebarOpen && (
            <div className="p-4 border-t border-white/10">
              <div className="p-3 bg-white/5 rounded-lg backdrop-blur-lg">
                <div className="text-white/60 text-xs mb-2">Usage This Month</div>
                <div className="text-white text-lg font-bold">289/500 Students</div>
                <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                  <div className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] h-2 rounded-full" style={{ width: '58%' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {navigationItems.find(item => 
                  item.page === activePage || 
                  item.items?.some(subItem => subItem.page === activePage)
                )?.title || 'Dashboard'}
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage your music academy with AI-powered tools
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">Harmony Music Academy</div>
                <div className="text-xs text-gray-500">Premium Plan</div>
              </div>
              <Avatar className="h-8 w-8 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white">
                HA
              </Avatar>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="h-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}