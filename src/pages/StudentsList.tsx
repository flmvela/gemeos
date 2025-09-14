import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ChevronLeft, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  TrendingUp, 
  Target, 
  Activity,
  MoreVertical,
  UserPlus,
  MessageSquare,
  FileDown,
  Send,
  Edit,
  Eye,
  UserX,
  MoreHorizontal
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  invitation_status?: string;
  invitation_token?: string;
  class_id?: string;
  last_active?: string;
  progress?: number;
  classes?: string[];
  enrollment_date?: string;
}

interface KPIData {
  totalStudents: number;
  activeThisWeek: number;
  averageProgress: number;
  goalsAchieved: number;
}

export default function StudentsList() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [classes, setClasses] = useState<Array<{id: string, name: string}>>([]);
  const [kpiData, setKpiData] = useState<KPIData>({
    totalStudents: 0,
    activeThisWeek: 0,
    averageProgress: 0,
    goalsAchieved: 0
  });

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [session]);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, selectedClass, selectedStatus, students]);

  const fetchStudents = async () => {
    if (!session?.user_id) return;

    try {
      setLoading(true);

      // First get the teacher record
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id, tenant_id')
        .eq('user_id', session.user_id)
        .single();

      if (!teacherData) {
        console.log('No teacher record found');
        return;
      }

      // For now, fetch student invitations since actual students table might not exist yet
      const { data: invitations, error } = await supabase
        .from('class_student_invitations')
        .select(`
          id,
          student_email,
          student_first_name,
          student_last_name,
          parent_name,
          parent_email,
          parent_phone,
          invitation_status,
          invitation_token,
          invited_at,
          class_id,
          classes!inner(
            id,
            name,
            teacher_id
          )
        `)
        .eq('classes.teacher_id', teacherData.id);

      if (error) {
        console.error('Error fetching students:', error);
        toast({
          title: 'Error',
          description: 'Failed to load students',
          variant: 'destructive'
        });
        return;
      }

      // Transform invitations to student format
      const studentData: Student[] = (invitations || []).map(inv => ({
        id: inv.id,
        first_name: inv.student_first_name || inv.student_email.split('@')[0].split('.')[0] || 'Unknown',
        last_name: inv.student_last_name || inv.student_email.split('@')[0].split('.')[1] || 'Student',
        email: inv.student_email,
        status: inv.invitation_status === 'accepted' ? 'active' : 'pending',
        invitation_status: inv.invitation_status,
        invitation_token: inv.invitation_token,
        class_id: inv.class_id,
        last_active: inv.invitation_status === 'accepted' ? '2 hours ago' : 'Not yet',
        progress: Math.floor(Math.random() * 100), // Mock data for now
        classes: [inv.classes.name],
        enrollment_date: inv.invited_at
      }));

      setStudents(studentData);
      
      // Calculate KPIs
      setKpiData({
        totalStudents: studentData.length,
        activeThisWeek: studentData.filter(s => s.status === 'active').length,
        averageProgress: studentData.reduce((acc, s) => acc + (s.progress || 0), 0) / (studentData.length || 1),
        goalsAchieved: Math.floor(Math.random() * 50) // Mock data
      });
    } catch (error) {
      console.error('Error in fetchStudents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    if (!session?.user_id) return;

    try {
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', session.user_id)
        .single();

      if (!teacherData) return;

      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', teacherData.id);

      setClasses(classesData || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Class filter
    if (selectedClass !== 'all') {
      filtered = filtered.filter(student => 
        student.classes?.some(c => c === selectedClass)
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(student => student.status === selectedStatus);
    }

    setFilteredStudents(filtered);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]?.toUpperCase() || ''}${lastName[0]?.toUpperCase() || ''}`;
  };

  const resendInvitation = async (student: Student) => {
    try {
      console.log('Resending invitation to:', student.email);
      
      // Get teacher info
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id, first_name, last_name, tenant_id')
        .eq('user_id', session?.user_id)
        .single();

      if (!teacherData) {
        throw new Error('Teacher data not found');
      }

      // Get class info
      const { data: classData } = await supabase
        .from('classes')
        .select('name')
        .eq('id', student.class_id)
        .single();

      // Import and use email service
      const { emailService } = await import('@/services/email.service');
      
      // Use the invitation ID as the token since invitation_token might be null
      // The StudentSetupPassword page now accepts both ID and invitation_token
      const token = student.invitation_token || student.id;
      
      // If there's no invitation_token, we could optionally update it
      // but for now we'll just use the ID which works fine
      
      const result = await emailService.sendStudentInvitation(
        student.email,
        token,
        classData?.name || 'Your Class',
        `${teacherData.first_name} ${teacherData.last_name}`,
        'Welcome to the class! We\'re excited to have you join us.',
        teacherData.tenant_id
      );

      if (result.success) {
        toast({
          title: 'Success',
          description: `Invitation sent to ${student.email}`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send invitation',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend invitation',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/teacher/dashboard')}
                className="h-10 w-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
                <p className="text-sm text-gray-600 mt-1">Manage and track student progress</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/teacher/students/add')}
              className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:shadow-lg transition-shadow"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{kpiData.totalStudents}</p>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12% from last month
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#06b6d4]/10 to-[#8b5cf6]/10 rounded-lg">
                <Users className="w-6 h-6 text-[#06b6d4]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active This Week</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{kpiData.activeThisWeek}</p>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +8% from last week
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#06b6d4]/10 to-[#8b5cf6]/10 rounded-lg">
                <Activity className="w-6 h-6 text-[#8b5cf6]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{Math.round(kpiData.averageProgress)}%</p>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +5% improvement
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#06b6d4]/10 to-[#8b5cf6]/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Goals Achieved</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{kpiData.goalsAchieved}</p>
                <p className="text-sm text-green-600 mt-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  18 this month
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#06b6d4]/10 to-[#8b5cf6]/10 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <div className="px-6 pb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="all">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.name}>{cls.name}</option>
                ))}
              </select>
              <select 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06b6d4] focus:border-transparent"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <div className="px-6">
        <Card className="overflow-hidden">
          {/* Bulk Actions Bar */}
          {selectedStudents.size > 0 && (
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
              <span className="text-sm text-blue-900">
                {selectedStudents.size} student{selectedStudents.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="bg-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign to Class
                </Button>
                <Button size="sm" variant="outline" className="bg-white">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button size="sm" variant="outline" className="bg-white">
                  <FileDown className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                <p className="mt-4 text-sm text-gray-600">Loading students...</p>
              </div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {students.length === 0 ? 'No students yet' : 'No students found'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {students.length === 0 
                  ? 'Start by adding your first student. You can invite them via email or add them manually.'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {students.length === 0 && (
                <Button 
                  onClick={() => navigate('/teacher/students/add')}
                  className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:shadow-lg"
                >
                  Add Your First Student
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input 
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Classes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr 
                      key={student.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/teacher/students/${student.id}/edit`)}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={selectedStudents.has(student.id)}
                          onChange={(e) => handleSelectStudent(student.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] flex items-center justify-center text-white font-medium">
                            {getInitials(student.first_name, student.last_name)}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {student.classes?.map((cls, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {cls}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {student.last_active}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] h-2 rounded-full"
                              style={{ width: `${student.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{student.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/teacher/students/${student.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {student.invitation_status === 'pending' && (
                              <DropdownMenuItem onClick={() => resendInvitation(student)}>
                                <Send className="mr-2 h-4 w-4" />
                                Send Invitation Email
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <UserX className="mr-2 h-4 w-4" />
                              Remove from Class
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}