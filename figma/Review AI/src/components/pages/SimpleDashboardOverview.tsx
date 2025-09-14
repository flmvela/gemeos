import { motion } from 'motion/react';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  UserPlus, 
  Plus,
  Activity,
  Music,
  CheckCircle
} from 'lucide-react';

// Simple Card Component
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

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>
    {children}
  </h3>
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

const recentActivities = [
  { type: 'teacher', message: 'Sarah Chen completed Piano Masterclass training', time: '2 hours ago', color: 'bg-blue-100' },
  { type: 'student', message: '5 new student registrations', time: '4 hours ago', color: 'bg-green-100' },
  { type: 'class', message: 'Advanced Composition class scheduled', time: '6 hours ago', color: 'bg-purple-100' },
  { type: 'system', message: 'Monthly usage report generated', time: '1 day ago', color: 'bg-gray-100' },
];

const teachers = [
  { id: 1, name: 'Sarah Chen', subject: 'Piano & Music Theory', students: 24, status: 'online' },
  { id: 2, name: 'Marcus Rodriguez', subject: 'Guitar & Composition', students: 18, status: 'online' },
  { id: 3, name: 'Emma Thompson', subject: 'Violin & Orchestra', students: 15, status: 'away' },
  { id: 4, name: 'David Kim', subject: 'Music Production', students: 12, status: 'offline' },
];

export function SimpleDashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Teachers</div>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Students</div>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Active Domains</div>
            <BookOpen className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">6</div>
            <p className="text-xs text-gray-600 mt-1">Music & Academic</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Monthly Usage</div>
            <Activity className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">87%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] h-2 rounded-full" style={{ width: '87%' }} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Charts Placeholder */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Student Progress Overview</CardTitle>
              <p className="text-gray-600 text-sm">Weekly completion rates and active students</p>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Chart visualization would appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Learning Domains Distribution</CardTitle>
              <p className="text-gray-600 text-sm">Student enrollment across different subjects</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-gray-700">Music Theory</span>
                  <span className="text-sm text-gray-500">35%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-sm text-gray-700">Performance</span>
                  <span className="text-sm text-gray-500">25%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500" />
                  <span className="text-sm text-gray-700">Composition</span>
                  <span className="text-sm text-gray-500">22%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-gray-700">Music History</span>
                  <span className="text-sm text-gray-500">18%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Quick Actions</CardTitle>
              <p className="text-gray-600 text-sm">Manage your academy</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Add New Teacher
              </Button>
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add New Student
              </Button>
              <Button variant="outline" className="w-full">
                <BookOpen className="w-4 h-4 mr-2" />
                Create New Class
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Recent Activity</CardTitle>
              <p className="text-gray-600 text-sm">Latest updates from your academy</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${activity.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Faculty Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Faculty Status</CardTitle>
              <p className="text-gray-600 text-sm">Current teacher availability</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white text-xs">
                    {teacher.name.split(' ').map(n => n[0]).join('')}
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