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
  Plus, 
  Calendar,
  Clock,
  Users,
  Music,
  MapPin,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const classes = [
  {
    id: 1,
    name: 'Beginner Piano Fundamentals',
    subject: 'Piano',
    teacher: 'Sarah Chen',
    teacherAvatar: 'SC',
    students: 12,
    maxStudents: 15,
    schedule: 'Mon, Wed 10:00 AM',
    duration: '60 min',
    room: 'Studio A',
    startDate: '2024-09-01',
    endDate: '2024-12-15',
    status: 'active',
    level: 'Beginner'
  },
  {
    id: 2,
    name: 'Advanced Jazz Guitar',
    subject: 'Guitar',
    teacher: 'Marcus Rodriguez',
    teacherAvatar: 'MR',
    students: 8,
    maxStudents: 10,
    schedule: 'Tue, Thu 2:00 PM',
    duration: '90 min',
    room: 'Studio B',
    startDate: '2024-09-01',
    endDate: '2024-12-15',
    status: 'active',
    level: 'Advanced'
  },
  {
    id: 3,
    name: 'Chamber Orchestra',
    subject: 'Orchestra',
    teacher: 'Emma Thompson',
    teacherAvatar: 'ET',
    students: 25,
    maxStudents: 30,
    schedule: 'Fri 6:00 PM',
    duration: '120 min',
    room: 'Concert Hall',
    startDate: '2024-09-01',
    endDate: '2024-12-15',
    status: 'active',
    level: 'Intermediate'
  },
  {
    id: 4,
    name: 'Music Production Workshop',
    subject: 'Production',
    teacher: 'David Kim',
    teacherAvatar: 'DK',
    students: 6,
    maxStudents: 8,
    schedule: 'Sat 11:00 AM',
    duration: '180 min',
    room: 'Tech Lab',
    startDate: '2024-09-15',
    endDate: '2024-11-30',
    status: 'paused',
    level: 'Intermediate'
  },
  {
    id: 5,
    name: 'Vocal Performance Masterclass',
    subject: 'Voice',
    teacher: 'Lisa Wang',
    teacherAvatar: 'LW',
    students: 15,
    maxStudents: 18,
    schedule: 'Sun 3:00 PM',
    duration: '75 min',
    room: 'Studio C',
    startDate: '2024-10-01',
    endDate: '2024-01-15',
    status: 'active',
    level: 'Advanced'
  }
];

const upcomingSchedule = [
  { time: '10:00 AM', class: 'Beginner Piano Fundamentals', teacher: 'Sarah Chen', room: 'Studio A', students: 12 },
  { time: '2:00 PM', class: 'Advanced Jazz Guitar', teacher: 'Marcus Rodriguez', room: 'Studio B', students: 8 },
  { time: '6:00 PM', class: 'Chamber Orchestra', teacher: 'Emma Thompson', room: 'Concert Hall', students: 25 },
];

interface ManageClassesProps {
  activeSection: string;
}

export function ManageClasses({ activeSection }: ManageClassesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || classItem.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || classItem.level.toLowerCase() === levelFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesLevel;
  });

  if (activeSection === 'schedules') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Class Schedules</h2>
            <p className="text-gray-600">View and manage class schedules and timetables</p>
          </div>
          <Button className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white border-0">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Class
          </Button>
        </div>

        {/* Today's Schedule */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Today's Schedule - Monday, March 8, 2025</CardTitle>
            <CardDescription className="text-gray-600">
              Classes scheduled for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSchedule.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center p-3 bg-white rounded-lg border border-gray-200">
                      <Clock className="w-4 h-4 text-blue-600 mb-1" />
                      <span className="text-sm font-medium text-gray-900">{item.time}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{item.class}</h3>
                      <p className="text-sm text-gray-600">{item.teacher} • {item.room}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{item.students} students</div>
                      <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                        Active
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Calendar Preview */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Weekly Overview</CardTitle>
            <CardDescription className="text-gray-600">
              Class distribution throughout the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-center">
                  <div className="font-medium text-gray-900 mb-2">{day}</div>
                  <div className="space-y-1">
                    {day === 'Mon' && (
                      <div className="p-2 bg-blue-100 rounded text-xs text-blue-700">
                        Piano Fundamentals
                      </div>
                    )}
                    {day === 'Tue' && (
                      <div className="p-2 bg-purple-100 rounded text-xs text-purple-700">
                        Jazz Guitar
                      </div>
                    )}
                    {day === 'Wed' && (
                      <div className="p-2 bg-blue-100 rounded text-xs text-blue-700">
                        Piano Fundamentals
                      </div>
                    )}
                    {day === 'Thu' && (
                      <div className="p-2 bg-purple-100 rounded text-xs text-purple-700">
                        Jazz Guitar
                      </div>
                    )}
                    {day === 'Fri' && (
                      <div className="p-2 bg-pink-100 rounded text-xs text-pink-700">
                        Chamber Orchestra
                      </div>
                    )}
                    {day === 'Sat' && (
                      <div className="p-2 bg-amber-100 rounded text-xs text-amber-700">
                        Music Production
                      </div>
                    )}
                    {day === 'Sun' && (
                      <div className="p-2 bg-green-100 rounded text-xs text-green-700">
                        Vocal Performance
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (activeSection === 'create-class') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create New Class</h2>
          <p className="text-gray-600">Set up a new class for your academy</p>
        </div>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Class Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Class Name *</label>
                <Input placeholder="e.g., Beginner Piano Fundamentals" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Subject *</label>
                <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                  <option>Select subject</option>
                  <option>Piano</option>
                  <option>Guitar</option>
                  <option>Violin</option>
                  <option>Drums</option>
                  <option>Voice</option>
                  <option>Music Theory</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Teacher *</label>
                <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                  <option>Select teacher</option>
                  <option>Sarah Chen</option>
                  <option>Marcus Rodriguez</option>
                  <option>Emma Thompson</option>
                  <option>David Kim</option>
                  <option>Lisa Wang</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Level *</label>
                <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                  <option>Select level</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Max Students *</label>
                <Input type="number" placeholder="15" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Duration (min) *</label>
                <Input type="number" placeholder="60" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Room *</label>
                <select className="w-full p-2 border border-gray-300 rounded-md bg-white">
                  <option>Select room</option>
                  <option>Studio A</option>
                  <option>Studio B</option>
                  <option>Studio C</option>
                  <option>Concert Hall</option>
                  <option>Tech Lab</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Start Date *</label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">End Date *</label>
                <Input type="date" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700">Schedule *</label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-600">Days of week</label>
                  <div className="flex flex-wrap gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <button
                        key={day}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-600">Time</label>
                  <Input type="time" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Describe what students will learn in this class..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
            Cancel
          </Button>
          <Button className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white border-0">
            <Plus className="w-4 h-4 mr-2" />
            Create Class
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Classes</h2>
          <p className="text-gray-600">View and manage all classes in your academy</p>
        </div>
        <Button className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white border-0">
          <Plus className="w-4 h-4 mr-2" />
          Create New Class
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Classes</CardTitle>
            <Music className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{classes.length}</div>
            <p className="text-xs text-gray-600">Across all subjects</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Active Classes</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{classes.filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-green-600">Currently running</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Enrollment</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{classes.reduce((sum, c) => sum + c.students, 0)}</div>
            <p className="text-xs text-gray-600">Students enrolled</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Capacity Usage</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round((classes.reduce((sum, c) => sum + c.students, 0) / classes.reduce((sum, c) => sum + c.maxStudents, 0)) * 100)}%
            </div>
            <p className="text-xs text-gray-600">Average utilization</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search classes by name, subject, or teacher..."
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
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Classes ({filteredClasses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.map((classItem) => (
                <TableRow key={classItem.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{classItem.name}</div>
                      <div className="text-sm text-gray-500">{classItem.subject}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white text-xs">
                          {classItem.teacherAvatar}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-900">{classItem.teacher}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{classItem.schedule}</div>
                    <div className="text-xs text-gray-500">{classItem.duration}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">{classItem.students}/{classItem.maxStudents}</span>
                      <div className="w-12 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] h-1.5 rounded-full" 
                          style={{ width: `${(classItem.students / classItem.maxStudents) * 100}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-3 h-3 mr-1" />
                      {classItem.room}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      classItem.status === 'active' 
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : classItem.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                    }>
                      {classItem.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                      {classItem.level}
                    </Badge>
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