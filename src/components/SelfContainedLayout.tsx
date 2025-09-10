import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Settings, 
  FileText, 
  Upload, 
  UserPlus, 
  ChevronDown, 
  ChevronRight 
} from 'lucide-react';

const SelfContainedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [teacherManagementOpen, setTeacherManagementOpen] = useState(false);
  const [classManagementOpen, setClassManagementOpen] = useState(false);

  // Custom SVG Icons
  const DashboardIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7" height="7" fill="currentColor" opacity="0.8"/>
      <rect x="14" y="3" width="7" height="7" fill="currentColor" opacity="0.8"/>
      <rect x="3" y="14" width="7" height="7" fill="currentColor" opacity="0.8"/>
      <rect x="14" y="14" width="7" height="7" fill="currentColor" opacity="0.8"/>
    </svg>
  );

  const TenantsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );

  const TeachersIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );

  const ClassesIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="currentColor" opacity="0.8"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="currentColor" opacity="0.8"/>
    </svg>
  );

  const StudentsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );

  const kpiData = {
    teachers: { value: 12, change: '+2 from last month', trend: 'up' },
    students: { value: 289, change: '+23 from last month', trend: 'up' },
    classes: { value: 28, change: '+5 this month', trend: 'up' },
    messages: { value: 7, label: 'Unread messages' }
  };

  const teachers = [
    {
      id: '1',
      name: 'Sarah Chen',
      initials: 'SC',
      status: 'online',
      domains: ['Piano', 'Music Theory'],
      classes: 3,
      students: 24,
      notifications: 1,
      avatarColor: 'primary'
    },
    {
      id: '2', 
      name: 'Marcus Rodriguez',
      initials: 'MR',
      status: 'online',
      domains: ['Guitar', 'Composition'],
      classes: 2,
      students: 18,
      notifications: 0,
      avatarColor: 'secondary'
    },
    {
      id: '3',
      name: 'Emma Thompson', 
      initials: 'ET',
      status: 'away',
      domains: ['Violin', 'Orchestra'],
      classes: 2,
      students: 15,
      notifications: 1,
      avatarColor: 'tertiary'
    }
  ];

  const getAvatarGradient = (color) => {
    switch (color) {
      case 'primary':
        return 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6]';
      case 'secondary':
        return 'bg-gradient-to-r from-[#8b5cf6] to-[#ec4899]';
      case 'tertiary':
        return 'bg-gradient-to-r from-[#f59e0b] to-[#d97706]';
      default:
        return 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6]';
    }
  };

  const getStatusDotColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-400';
      case 'away':
        return 'bg-yellow-400';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-[#1a1b3a] text-white transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] rounded-lg flex items-center justify-center text-sm font-bold">
                  G
                </div>
                <span className="font-semibold">Gemeos</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4">
          <nav className="space-y-2 px-3">
            {/* Dashboard */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#2d2e5f] text-white">
              <DashboardIcon />
              {sidebarOpen && <span className="font-medium">Dashboard</span>}
            </div>

            {/* Admin Dashboard */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
              <Home size={16} />
              {sidebarOpen && <span>Admin Dashboard</span>}
            </div>

            {/* Tenants */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
              <TenantsIcon />
              {sidebarOpen && <span>Tenants</span>}
            </div>

            {/* Teacher Management */}
            <div>
              <div 
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => setTeacherManagementOpen(!teacherManagementOpen)}
              >
                <TeachersIcon />
                {sidebarOpen && (
                  <>
                    <span className="flex-1">Teacher Management</span>
                    {teacherManagementOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </>
                )}
              </div>
              {sidebarOpen && teacherManagementOpen && (
                <div className="ml-8 mt-1 space-y-1">
                  <div className="px-3 py-1 text-sm text-gray-300 hover:text-white cursor-pointer">Teachers</div>
                </div>
              )}
            </div>

            {/* Class Management */}
            <div>
              <div 
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => setClassManagementOpen(!classManagementOpen)}
              >
                <ClassesIcon />
                {sidebarOpen && (
                  <>
                    <span className="flex-1">Class Management</span>
                    {classManagementOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </>
                )}
              </div>
              {sidebarOpen && classManagementOpen && (
                <div className="ml-8 mt-1 space-y-1">
                  <div className="px-3 py-1 text-sm text-gray-300 hover:text-white cursor-pointer">Classes</div>
                </div>
              )}
            </div>

            {/* Students */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
              <StudentsIcon />
              {sidebarOpen && <span>Students</span>}
            </div>

            {/* Domain Administration */}
            <div className="pt-4">
              {sidebarOpen && <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Domain Administration</div>}
              
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <BookOpen size={16} />
                {sidebarOpen && <span>Domain Administration</span>}
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <GraduationCap size={16} />
                {sidebarOpen && <span>Learning Goals</span>}
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <Users size={16} />
                {sidebarOpen && <span>AI Guidance</span>}
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <FileText size={16} />
                {sidebarOpen && <span>Guidance Editor</span>}
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <BookOpen size={16} />
                {sidebarOpen && <span>Examples</span>}
              </div>
            </div>

            {/* System */}
            <div className="pt-4">
              {sidebarOpen && <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">System</div>}
              
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <Settings size={16} />
                {sidebarOpen && <span>Access control</span>}
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <Users size={16} />
                {sidebarOpen && <span>Access Management</span>}
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <Settings size={16} />
                {sidebarOpen && <span>AI Settings</span>}
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <Settings size={16} />
                {sidebarOpen && <span>Feedback Settings</span>}
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <Upload size={16} />
                {sidebarOpen && <span>File Upload</span>}
              </div>
            </div>

            {/* Authentication */}
            <div className="pt-4">
              {sidebarOpen && <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Authentication</div>}
              
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <UserPlus size={16} />
                {sidebarOpen && <span>Login</span>}
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <UserPlus size={16} />
                {sidebarOpen && <span>Register</span>}
              </div>

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <Settings size={16} />
                {sidebarOpen && <span>Forgot Password</span>}
              </div>
            </div>

            {/* Development */}
            <div className="pt-4">
              {sidebarOpen && <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Development</div>}
              
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                <FileText size={16} />
                {sidebarOpen && <span>Download Card Demo</span>}
              </div>
            </div>
          </nav>
        </div>

        {/* Usage Stats */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-700">
            <div className="text-sm text-gray-400 mb-2">Students</div>
            <div className="text-lg font-semibold text-white">289/500</div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] h-2 rounded-full" style={{width: '57.8%'}}></div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
              <p className="text-gray-600">Manage your music academy with AI-powered tools</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Harmony Music Academy</p>
                <div className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white px-2 py-1 rounded-full text-xs font-medium">
                  Premium Plan
                </div>
              </div>
              <div className="h-10 w-10 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white text-sm rounded-full flex items-center justify-center font-medium">
                HA
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Teachers */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                <div className="text-sm font-medium text-gray-700">Teachers</div>
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="px-6 pb-6">
                <div className="text-2xl font-bold text-gray-900">{kpiData.teachers.value}</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  {kpiData.teachers.change}
                </p>
              </div>
            </div>

            {/* Students */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                <div className="text-sm font-medium text-gray-700">Students</div>
                <GraduationCap className="h-4 w-4 text-purple-600" />
              </div>
              <div className="px-6 pb-6">
                <div className="text-2xl font-bold text-gray-900">{kpiData.students.value}</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  {kpiData.students.change}
                </p>
              </div>
            </div>

            {/* Classes */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                <div className="text-sm font-medium text-gray-700">Classes</div>
                <BookOpen className="h-4 w-4 text-pink-600" />
              </div>
              <div className="px-6 pb-6">
                <div className="text-2xl font-bold text-gray-900">{kpiData.classes.value}</div>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  {kpiData.classes.change}
                </p>
              </div>
            </div>

            {/* New Messages */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                <div className="text-sm font-medium text-gray-700">New Messages</div>
                <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="px-6 pb-6">
                <div className="text-2xl font-bold text-gray-900">{kpiData.messages.value}</div>
                <p className="text-xs text-amber-600 mt-1">
                  {kpiData.messages.label}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:from-[#0891b2] hover:to-[#7c3aed] px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add Teacher
            </button>
            <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Class
            </button>
          </div>

          {/* Teachers Overview */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">Teachers Overview</h2>
              <p className="text-sm text-gray-600">Manage your academy faculty and track their progress</p>
            </div>
            <div className="px-6 pb-6">
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
                    {teachers.map((teacher) => (
                      <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className={`h-8 w-8 ${getAvatarGradient(teacher.avatarColor)} text-white text-xs rounded-full flex items-center justify-center font-medium`}>
                                {teacher.initials}
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white ${getStatusDotColor(teacher.status)}`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{teacher.name}</p>
                              <p className="text-xs text-gray-500 capitalize">{teacher.status}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 flex-wrap">
                            {teacher.domains.map((domain, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                                {domain}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{teacher.classes}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{teacher.students}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center">
                            {teacher.notifications > 0 ? (
                              <div className="relative">
                                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-10-5 10h5zm0 0v4a2 2 0 11-4 0v-4" />
                                </svg>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                              </div>
                            ) : (
                              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-10-5 10h5zm0 0v4a2 2 0 11-4 0v-4" />
                              </svg>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfContainedLayout;