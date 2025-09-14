import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  UserPlus, 
  Plus,
  Activity,
  Calendar,
  Music,
  Languages,
  Brain,
  Clock,
  CheckCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const progressData = [
  { name: 'Week 1', students: 45, completion: 78 },
  { name: 'Week 2', students: 52, completion: 82 },
  { name: 'Week 3', students: 48, completion: 85 },
  { name: 'Week 4', students: 56, completion: 88 },
];

const domainData = [
  { name: 'Music Theory', value: 35, color: '#06b6d4' },
  { name: 'Performance', value: 25, color: '#8b5cf6' },
  { name: 'Composition', value: 22, color: '#ec4899' },
  { name: 'Music History', value: 18, color: '#f59e0b' },
];

const recentActivities = [
  { type: 'teacher', message: 'Sarah Chen completed Piano Masterclass training', time: '2 hours ago', color: 'bg-blue-100 text-blue-700' },
  { type: 'student', message: '5 new student registrations', time: '4 hours ago', color: 'bg-green-100 text-green-700' },
  { type: 'class', message: 'Advanced Composition class scheduled', time: '6 hours ago', color: 'bg-purple-100 text-purple-700' },
  { type: 'system', message: 'Monthly usage report generated', time: '1 day ago', color: 'bg-gray-100 text-gray-700' },
];

const teachers = [
  { id: 1, name: 'Sarah Chen', subject: 'Piano & Music Theory', students: 24, status: 'online' },
  { id: 2, name: 'Marcus Rodriguez', subject: 'Guitar & Composition', students: 18, status: 'online' },
  { id: 3, name: 'Emma Thompson', subject: 'Violin & Orchestra', students: 15, status: 'away' },
  { id: 4, name: 'David Kim', subject: 'Music Production', students: 12, status: 'offline' },
];

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">12</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Students</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">289</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +23 from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Active Domains</CardTitle>
            <BookOpen className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">6</div>
            <p className="text-xs text-gray-600 mt-1">Music & Academic</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Monthly Usage</CardTitle>
            <Activity className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">87%</div>
            <Progress value={87} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Progress Chart */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Student Progress Overview</CardTitle>
              <CardDescription className="text-gray-600">
                Weekly completion rates and active students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(0,0,0,0.6)" />
                  <YAxis stroke="rgba(0,0,0,0.6)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid rgba(0,0,0,0.2)',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line type="monotone" dataKey="students" stroke="#06b6d4" strokeWidth={3} />
                  <Line type="monotone" dataKey="completion" stroke="#8b5cf6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Domain Distribution */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Learning Domains Distribution</CardTitle>
              <CardDescription className="text-gray-600">
                Student enrollment across different subjects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={domainData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {domainData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {domainData.map((domain) => (
                  <div key={domain.name} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: domain.color }}
                    />
                    <span className="text-sm text-gray-700">{domain.name}</span>
                    <span className="text-sm text-gray-500">{domain.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Quick Actions</CardTitle>
              <CardDescription className="text-gray-600">
                Manage your academy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white border-0">
                <UserPlus className="w-4 h-4 mr-2" />
                Add New Teacher
              </Button>
              <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300">
                <Plus className="w-4 h-4 mr-2" />
                Add New Student
              </Button>
              <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300">
                <BookOpen className="w-4 h-4 mr-2" />
                Create New Class
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Recent Activity</CardTitle>
              <CardDescription className="text-gray-600">
                Latest updates from your academy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${activity.color.split(' ')[0]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Faculty Overview */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Faculty Status</CardTitle>
              <CardDescription className="text-gray-600">
                Current teacher availability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white text-xs">
                      {teacher.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{teacher.name}</div>
                    <div className="text-xs text-gray-500 truncate">{teacher.subject}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-900">{teacher.students}</div>
                    <div className="text-xs text-gray-500">students</div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    teacher.status === 'online' ? 'bg-green-400' : 
                    teacher.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                  }`} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}