import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const teachers = [
  {
    id: 1,
    name: 'Sarah Chen',
    email: 'sarah.chen@harmonymusic.edu',
    phone: '+1 (555) 123-4567',
    subjects: ['Piano', 'Music Theory'],
    students: 24,
    classes: 6,
    joinDate: '2023-08-15',
    status: 'active',
    lastLogin: '2 hours ago',
    completionRate: 94,
    avatar: 'SC'
  },
  {
    id: 2,
    name: 'Marcus Rodriguez',
    email: 'marcus.rodriguez@harmonymusic.edu',
    phone: '+1 (555) 234-5678',
    subjects: ['Guitar', 'Composition'],
    students: 18,
    classes: 4,
    joinDate: '2023-09-01',
    status: 'active',
    lastLogin: '1 hour ago',
    completionRate: 89,
    avatar: 'MR'
  },
  {
    id: 3,
    name: 'Emma Thompson',
    email: 'emma.thompson@harmonymusic.edu',
    phone: '+1 (555) 345-6789',
    subjects: ['Violin', 'Orchestra'],
    students: 15,
    classes: 3,
    joinDate: '2023-07-20',
    status: 'away',
    lastLogin: '3 days ago',
    completionRate: 92,
    avatar: 'ET'
  },
  {
    id: 4,
    name: 'David Kim',
    email: 'david.kim@harmonymusic.edu',
    phone: '+1 (555) 456-7890',
    subjects: ['Music Production', 'Audio Engineering'],
    students: 12,
    classes: 3,
    joinDate: '2023-10-05',
    status: 'inactive',
    lastLogin: '1 week ago',
    completionRate: 76,
    avatar: 'DK'
  },
  {
    id: 5,
    name: 'Lisa Wang',
    email: 'lisa.wang@harmonymusic.edu',
    phone: '+1 (555) 567-8901',
    subjects: ['Voice', 'Performance'],
    students: 20,
    classes: 5,
    joinDate: '2023-06-10',
    status: 'active',
    lastLogin: '30 minutes ago',
    completionRate: 96,
    avatar: 'LW'
  }
];

const analyticsData = [
  { name: 'Jan', teachers: 8, students: 180 },
  { name: 'Feb', teachers: 10, students: 220 },
  { name: 'Mar', teachers: 12, students: 289 },
];

interface ManageTeachersProps {
  activeSection: string;
}

export function ManageTeachers({ activeSection }: ManageTeachersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || teacher.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (activeSection === 'teacher-analytics') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teacher Analytics</h2>
          <p className="text-gray-600">Performance insights and metrics for your teaching staff</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Teachers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{teachers.length}</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +2 this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Average Students per Teacher</CardTitle>
              <UserCheck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">18</div>
              <p className="text-xs text-gray-600 mt-1">Across all subjects</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Active Teachers</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{teachers.filter(t => t.status === 'active').length}</div>
              <p className="text-xs text-gray-600 mt-1">Currently teaching</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Avg. Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">89%</div>
              <p className="text-xs text-green-600 mt-1">+3% from last month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Growth Chart */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Teacher & Student Growth</CardTitle>
              <CardDescription className="text-gray-600">
                Monthly growth trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData}>
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
                  <Line type="monotone" dataKey="teachers" stroke="#06b6d4" strokeWidth={3} />
                  <Line type="monotone" dataKey="students" stroke="#8b5cf6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Top Performing Teachers</CardTitle>
              <CardDescription className="text-gray-600">
                Based on completion rates and student feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teachers
                  .sort((a, b) => b.completionRate - a.completionRate)
                  .slice(0, 5)
                  .map((teacher, index) => (
                    <div key={teacher.id} className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {index + 1}
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white text-xs">
                          {teacher.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                        <div className="text-xs text-gray-500">{teacher.subjects.join(', ')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{teacher.completionRate}%</div>
                        <div className="text-xs text-gray-500">{teacher.students} students</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Teachers</h2>
          <p className="text-gray-600">View and manage your teaching staff</p>
        </div>
        <Button className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white border-0">
          Add New Teacher
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search teachers by name, email, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="away">Away</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teachers Table */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Teachers ({filteredTeachers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completion Rate</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher) => (
                <TableRow key={teacher.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white text-xs">
                          {teacher.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">{teacher.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {teacher.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.subjects.map((subject) => (
                        <Badge key={subject} className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1 text-gray-400" />
                      {teacher.students}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      {teacher.classes}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      teacher.status === 'active' 
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : teacher.status === 'away'
                        ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                    }>
                      <div className={`w-2 h-2 rounded-full mr-1 ${
                        teacher.status === 'active' ? 'bg-green-400' :
                        teacher.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                      }`} />
                      {teacher.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900">{teacher.completionRate}%</div>
                      <div className="w-12 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] h-1.5 rounded-full" 
                          style={{ width: `${teacher.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {teacher.lastLogin}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}