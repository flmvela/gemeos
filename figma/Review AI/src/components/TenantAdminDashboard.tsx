import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Crown, 
  TrendingUp, 
  UserPlus, 
  Plus,
  Settings,
  CreditCard,
  HelpCircle,
  Activity,
  Calendar,
  Music,
  Languages,
  Brain
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
  { name: 'Mathematics', value: 25, color: '#8b5cf6' },
  { name: 'Languages', value: 22, color: '#ec4899' },
  { name: 'Science', value: 18, color: '#f59e0b' },
];

const teachers = [
  { id: 1, name: 'Sarah Chen', subject: 'Piano & Music Theory', students: 24, avatar: '/api/placeholder/32/32', status: 'active' },
  { id: 2, name: 'Marcus Rodriguez', subject: 'Guitar & Composition', students: 18, avatar: '/api/placeholder/32/32', status: 'active' },
  { id: 3, name: 'Emma Thompson', subject: 'Violin & Orchestra', students: 15, avatar: '/api/placeholder/32/32', status: 'active' },
  { id: 4, name: 'David Kim', subject: 'Music Production', students: 12, avatar: '/api/placeholder/32/32', status: 'away' },
];

export function TenantAdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030213] via-[#1e1b4b] to-[#312e81]">
      {/* Header */}
      <motion.header 
        className="bg-white/5 backdrop-blur-lg border-b border-white/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent">
                Gemeos
              </div>
              <div className="text-white/80">
                <div className="text-lg font-medium">Harmony Music Academy</div>
                <div className="text-sm text-white/60">San Francisco, CA</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white border-0">
                <Crown className="w-4 h-4 mr-1" />
                Premium Plan
              </Badge>
              <Avatar>
                <AvatarFallback className="bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white">
                  HA
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Teachers</CardTitle>
              <GraduationCap className="h-4 w-4 text-[#06b6d4]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">12</div>
              <p className="text-xs text-white/60">+2 from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Students</CardTitle>
              <Users className="h-4 w-4 text-[#8b5cf6]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">289</div>
              <p className="text-xs text-white/60">+23 from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Active Domains</CardTitle>
              <BookOpen className="h-4 w-4 text-[#ec4899]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">6</div>
              <p className="text-xs text-white/60">Music & Academic</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Usage This Month</CardTitle>
              <Activity className="h-4 w-4 text-[#f59e0b]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">87%</div>
              <Progress value={87} className="mt-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Charts */}
          <motion.div 
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Student Progress Chart */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Student Progress Overview</CardTitle>
                <CardDescription className="text-white/60">
                  Weekly completion rates and active students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" />
                    <YAxis stroke="rgba(255,255,255,0.6)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255,255,255,0.1)', 
                        border: '1px solid rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)'
                      }} 
                    />
                    <Line type="monotone" dataKey="students" stroke="#06b6d4" strokeWidth={3} />
                    <Line type="monotone" dataKey="completion" stroke="#8b5cf6" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Domain Distribution */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Learning Domains Distribution</CardTitle>
                <CardDescription className="text-white/60">
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
                      <span className="text-sm text-white/80">{domain.name}</span>
                      <span className="text-sm text-white/60">{domain.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Quick Actions & Teacher List */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Quick Actions */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
                <CardDescription className="text-white/60">
                  Manage your academy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white border-0">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add New Teacher
                </Button>
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Student
                </Button>
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Assign Domain
                </Button>
                <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20">
                  <Settings className="w-4 h-4 mr-2" />
                  Academy Settings
                </Button>
              </CardContent>
            </Card>

            {/* Active Domains */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Active Domains</CardTitle>
                <CardDescription className="text-white/60">
                  Currently available learning areas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Music className="w-5 h-5 text-[#06b6d4]" />
                    <div>
                      <div className="text-white text-sm font-medium">Music Theory</div>
                      <div className="text-white/60 text-xs">142 students</div>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/20">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Languages className="w-5 h-5 text-[#8b5cf6]" />
                    <div>
                      <div className="text-white text-sm font-medium">Music Composition</div>
                      <div className="text-white/60 text-xs">89 students</div>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/20">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Brain className="w-5 h-5 text-[#ec4899]" />
                    <div>
                      <div className="text-white text-sm font-medium">Performance Skills</div>
                      <div className="text-white/60 text-xs">58 students</div>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/20">Active</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Teachers List */}
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Faculty Overview</CardTitle>
                <CardDescription className="text-white/60">
                  Your teaching staff and their students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white text-sm">
                        {teacher.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{teacher.name}</div>
                      <div className="text-xs text-white/60 truncate">{teacher.subject}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">{teacher.students}</div>
                      <div className="text-xs text-white/60">students</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      teacher.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                    }`} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer 
          className="mt-12 pt-8 border-t border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-[#06b6d4]" />
                  Subscription Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/60">Plan</span>
                    <span className="text-white">Premium</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Next billing</span>
                    <span className="text-white">March 15, 2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Usage</span>
                    <span className="text-white">289/500 students</span>
                  </div>
                </div>
                <Button className="w-full mt-4 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] hover:from-[#7c3aed] hover:to-[#db2777] text-white border-0">
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-[#8b5cf6]" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#06b6d4] rounded-full" />
                    <span className="text-white/80">5 new student registrations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#8b5cf6] rounded-full" />
                    <span className="text-white/80">Sarah Chen completed training</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#ec4899] rounded-full" />
                    <span className="text-white/80">Domain update available</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-lg border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2 text-[#f59e0b]" />
                  Support & Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10">
                    Help Center
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10">
                    Contact Support
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10">
                    Training Resources
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-white/40 text-sm">
              © 2025 Gemeos Technologies • Transforming music education with AI • Support: hello@gemeos.ai
            </p>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}