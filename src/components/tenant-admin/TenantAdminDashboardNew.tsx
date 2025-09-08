/**
 * New Tenant Admin Dashboard Component
 * Based on Harmony Music Academy design with modern glass morphism cards
 */

import React from 'react';
import { 
  Users, 
  BookOpen,
  Mail,
  GraduationCap,
  Plus,
  UserPlus,
  Bell,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

interface Teacher {
  id: string;
  name: string;
  initials: string;
  status: 'online' | 'away' | 'offline';
  domains: string[];
  classes: number;
  students: number;
  notifications: number;
  avatarColor: 'primary' | 'secondary' | 'tertiary';
}

export function TenantAdminDashboardNew() {
  // Mock data based on the dashboard image
  const kpiData = {
    teachers: { value: 12, change: '+2 from last month', trend: 'up' },
    students: { value: 289, change: '+23 from last month', trend: 'up' },
    classes: { value: 28, change: '+5 this month', trend: 'up' },
    messages: { value: 7, label: 'Unread messages' }
  };

  const teachers: Teacher[] = [
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
    },
    {
      id: '4',
      name: 'David Kim',
      initials: 'DK',
      status: 'offline',
      domains: ['Music Production', 'Audio Engineering'],
      classes: 3,
      students: 12,
      notifications: 0,
      avatarColor: 'primary'
    },
    {
      id: '5',
      name: 'Lisa Wang',
      initials: 'LW',
      status: 'online',
      domains: ['Jazz Performance'],
      classes: 1,
      students: 8,
      notifications: 1,
      avatarColor: 'secondary'
    }
  ];

  const getAvatarGradient = (color: string) => {
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

  const getStatusDotColor = (status: string) => {
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
            <Badge className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white px-2 py-1 rounded-full text-xs font-medium">
              Premium Plan
            </Badge>
          </div>
          <Avatar className="h-10 w-10 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white text-sm rounded-full flex items-center justify-center font-medium">
            HA
          </Avatar>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Teachers */}
        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Teachers</div>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{kpiData.teachers.value}</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {kpiData.teachers.change}
            </p>
          </CardContent>
        </Card>

        {/* Students */}
        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Students</div>
            <GraduationCap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{kpiData.students.value}</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {kpiData.students.change}
            </p>
          </CardContent>
        </Card>

        {/* Classes */}
        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Classes</div>
            <BookOpen className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{kpiData.classes.value}</div>
            <p className="text-xs text-blue-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              {kpiData.classes.change}
            </p>
          </CardContent>
        </Card>

        {/* New Messages */}
        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">New Messages</div>
            <Mail className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{kpiData.messages.value}</div>
            <p className="text-xs text-amber-600 mt-1">
              {kpiData.messages.label}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:from-[#0891b2] hover:to-[#7c3aed] px-4 py-2 rounded-md font-medium transition-all duration-200">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Teacher
        </Button>
        <Button variant="outline" className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md font-medium transition-all duration-200">
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* Teachers Overview */}
      <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Teachers Overview</CardTitle>
          <p className="text-sm text-gray-600">Manage your academy faculty and track their progress</p>
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
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className={`h-8 w-8 ${getAvatarGradient(teacher.avatarColor)} text-white text-xs rounded-full flex items-center justify-center font-medium`}>
                            {teacher.initials}
                          </Avatar>
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
                          <Badge key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                            {domain}
                          </Badge>
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
                            <Bell className="w-5 h-5 text-amber-500" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                          </div>
                        ) : (
                          <Bell className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}