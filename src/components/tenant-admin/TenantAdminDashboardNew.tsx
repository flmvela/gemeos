/**
 * New Tenant Admin Dashboard Component
 * Based on Harmony Music Academy design with modern glass morphism cards
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  BookOpen,
  Mail,
  GraduationCap,
  Plus,
  UserPlus,
  Bell,
  TrendingUp,
  List,
  LayoutGrid,
  Search,
  School,
  Trophy,
  Activity,
  ArrowUp,
  Settings,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { teacherService, type Teacher as DbTeacher } from '@/services/teacher.service';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface ClassData {
  id: string;
  name: string;
  domain: string;
  students: number;
  notifications: number;
}

export function TenantAdminDashboardNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { session, tenantContext } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'statistics'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  
  // Check which dashboard we're on
  const isTeacherDashboard = location.pathname === '/teacher/dashboard';
  const isTenantDashboard = location.pathname === '/tenant/dashboard';
  
  // Fetch real teachers from database with their assigned domains
  useEffect(() => {
    const fetchTeachers = async () => {
      const tenantId = session?.current_tenant?.tenant_id || tenantContext?.tenant?.id;
      
      if (!tenantId) {
        console.log('No tenant ID available to fetch teachers');
        setIsLoadingTeachers(false);
        return;
      }
      
      try {
        setIsLoadingTeachers(true);
        const dbTeachers = await teacherService.getTeachersByTenant(tenantId);
        
        // Transform database teachers to display format and fetch their domains
        const transformedTeachers: Teacher[] = await Promise.all(
          dbTeachers.map(async (teacher, index) => {
            const initials = `${teacher.first_name[0]}${teacher.last_name[0]}`.toUpperCase();
            const colors = ['primary', 'secondary', 'tertiary'] as const;
            
            // Fetch domains assigned to this teacher
            let teacherDomains: string[] = [];
            try {
              // First get the domain IDs assigned to the teacher
              const { data: teacherDomainData, error: tdError } = await supabase
                .from('teacher_domains')
                .select('domain_id, is_primary')
                .eq('teacher_id', teacher.id);
              
              if (!tdError && teacherDomainData && teacherDomainData.length > 0) {
                // Then fetch the domain names
                const domainIds = teacherDomainData.map(td => td.domain_id);
                const { data: domainsData, error: domainsError } = await supabase
                  .from('domains')
                  .select('id, name')
                  .in('id', domainIds);
                
                if (!domainsError && domainsData) {
                  teacherDomains = domainsData.map(d => d.name);
                }
              }
            } catch (err) {
              console.error(`Error fetching domains for teacher ${teacher.id}:`, err);
            }
            
            // Fetch class count for this teacher
            let classCount = 0;
            try {
              const { count, error: classError } = await supabase
                .from('classes')
                .select('*', { count: 'exact', head: true })
                .eq('teacher_id', teacher.id);
              
              if (!classError && count !== null) {
                classCount = count;
              }
            } catch (err) {
              console.error(`Error fetching class count for teacher ${teacher.id}:`, err);
            }
            
            return {
              id: teacher.id,
              name: `${teacher.first_name} ${teacher.last_name}`,
              initials,
              status: teacher.status === 'active' ? 'online' : teacher.status === 'on_leave' ? 'away' : 'offline',
              domains: teacherDomains,
              classes: classCount,
              students: 0, // Will be populated when we have student enrollment data
              notifications: 0,
              avatarColor: colors[index % colors.length]
            };
          })
        );
        
        setTeachers(transformedTeachers);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load teachers. Please refresh the page.',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingTeachers(false);
      }
    };
    
    if (!isTeacherDashboard) {
      fetchTeachers();
    }
  }, [session, tenantContext, toast, isTeacherDashboard]);

  // Fetch classes for teacher dashboard
  useEffect(() => {
    const fetchClasses = async () => {
      if (!isTeacherDashboard) {
        return;
      }
      
      // Use session.user_id instead of session.user.id
      if (!session?.user_id) {
        return;
      }

      try {
        setIsLoadingClasses(true);
        
        // First check if the user is a teacher
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', session.user_id)
          .single();

        if (teacherError || !teacherData) {
          setIsLoadingClasses(false);
          return;
        }

        // Fetch classes for this teacher
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select(`
            id,
            name,
            description,
            domain_id,
            status,
            max_students,
            enrollment_type,
            enrollment_code,
            created_at
          `)
          .eq('teacher_id', teacherData.id)
          .order('created_at', { ascending: false });

        if (classesError) {
          console.error('Error fetching classes:', classesError);
          toast({
            title: 'Error',
            description: 'Failed to load your classes.',
            variant: 'destructive'
          });
          return;
        }

        // Fetch domain names separately to avoid join issues
        let domainMap: Record<string, string> = {};
        if (classesData && classesData.length > 0) {
          const domainIds = [...new Set(classesData.map(c => c.domain_id).filter(Boolean))];
          if (domainIds.length > 0) {
            const { data: domains } = await supabase
              .from('domains')
              .select('id, name')
              .in('id', domainIds);
            
            if (domains) {
              domainMap = Object.fromEntries(domains.map(d => [d.id, d.name]));
            }
          }
        }

        // Fetch student counts for each class
        let studentCounts: Record<string, number> = {};
        if (classesData && classesData.length > 0) {
          const classIds = classesData.map(c => c.id);
          
          // Count invitations per class
          const { data: invitations } = await supabase
            .from('class_student_invitations')
            .select('class_id')
            .in('class_id', classIds);
          
          if (invitations) {
            // Count invitations per class
            invitations.forEach(inv => {
              studentCounts[inv.class_id] = (studentCounts[inv.class_id] || 0) + 1;
            });
          }
        }

        // Transform to ClassData format with actual student counts
        const transformedClasses: ClassData[] = (classesData || []).map(cls => ({
          id: cls.id,
          name: cls.name || 'Unnamed Class',
          domain: domainMap[cls.domain_id] || 'General',
          students: studentCounts[cls.id] || 0, // Use actual count from invitations
          notifications: 0
        }));

        setClasses(transformedClasses);
      } catch (error) {
        console.error('Error in fetchClasses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load classes.',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingClasses(false);
      }
    };

    fetchClasses();
  }, [session, isTeacherDashboard, toast]);
  
  // Dynamic KPI data based on actual teachers
  const kpiData = {
    teachers: { value: teachers.length, change: '+2 from last month', trend: 'up' },
    students: { value: 289, change: '+23 from last month', trend: 'up' },
    classes: { value: 28, change: '+5 this month', trend: 'up' },
    messages: { value: 7, label: 'Unread messages' }
  };

  // Teacher dashboard specific KPI data
  const teacherKpiData = {
    totalClasses: { value: classes.length, change: '+2 this semester', trend: 'up' },
    activeStudents: { value: 210, change: '+15 this month', trend: 'up' },
    goalsAchieved: { value: 47, change: '94% completion rate', trend: 'up' },
    activitiesThisWeek: { value: 132, change: '+23% from last week', trend: 'up' }
  };

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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {isTeacherDashboard ? 'Teacher Dashboard' : isTenantDashboard ? 'Tenant Dashboard' : 'Dashboard'}
          </h1>
          <p className="text-gray-600">
            {isTeacherDashboard ? 'Manage your classes with AI-powered tools' : 'Manage your music academy with AI-powered tools'}
          </p>
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
        {isTeacherDashboard ? (
          <>
            {/* Total Classes - Teacher Dashboard */}
            <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-gray-700">Total Classes</div>
                <School className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{teacherKpiData.totalClasses.value}</div>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  {teacherKpiData.totalClasses.change}
                </p>
              </CardContent>
            </Card>

            {/* Active Students - Teacher Dashboard */}
            <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-gray-700">Active Students</div>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{teacherKpiData.activeStudents.value}</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  {teacherKpiData.activeStudents.change}
                </p>
              </CardContent>
            </Card>

            {/* Goals Achieved - Teacher Dashboard */}
            <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-gray-700">Goals Achieved</div>
                <Trophy className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{teacherKpiData.goalsAchieved.value}</div>
                <p className="text-xs text-purple-600 flex items-center mt-1">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  {teacherKpiData.goalsAchieved.change}
                </p>
              </CardContent>
            </Card>

            {/* Activities This Week - Teacher Dashboard */}
            <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-gray-700">Activities This Week</div>
                <Activity className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{teacherKpiData.activitiesThisWeek.value}</div>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <ArrowUp className="w-3 h-3 mr-1" />
                  {teacherKpiData.activitiesThisWeek.change}
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Teachers - Admin Dashboard */}
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

            {/* Students - Admin Dashboard */}
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

            {/* Classes - Admin Dashboard */}
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

            {/* New Messages - Admin Dashboard */}
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
          </>
        )}
      </div>


      {/* Teachers/Classes Overview */}
      <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {isTeacherDashboard ? 'Classes Overview' : 'Teachers Overview'}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {isTeacherDashboard 
                  ? 'Manage and monitor all your teaching classes' 
                  : 'Manage your academy faculty and track their progress'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:from-[#0891b2] hover:to-[#7c3aed] px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2"
                onClick={() => navigate(isTeacherDashboard ? '/teacher/classes/create' : '/admin/teacher/create')}
              >
                {isTeacherDashboard ? (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Class
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Add Teacher
                  </>
                )}
              </Button>
              <Button 
                onClick={() => isTeacherDashboard ? navigate('/teacher/students') : undefined}
                variant="outline" 
                className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2"
              >
                {isTeacherDashboard ? (
                  <>
                    <Users className="w-4 h-4" />
                    View Students
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Class
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('statistics')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'statistics' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={isTeacherDashboard ? "Search classes..." : "Search teachers by name or domain..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              {isTeacherDashboard ? (
                // Classes table for teacher dashboard
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Class Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Domain</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Students</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Notifications</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingClasses ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            <p className="text-sm text-gray-500">Loading your classes...</p>
                          </div>
                        </td>
                      </tr>
                    ) : classes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <BookOpen className="w-12 h-12 text-gray-300" />
                            <div>
                              <p className="text-gray-900 font-medium">No classes yet</p>
                              <p className="text-sm text-gray-500 mt-1">Click "Add Class" to create your first class</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      classes.filter(classItem => 
                        !searchTerm || 
                        classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        classItem.domain.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map((classItem) => (
                        <tr key={classItem.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td 
                            className="py-3 px-4 cursor-pointer"
                            onClick={() => navigate(`/teacher/classes/${classItem.id}`)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] rounded-lg">
                                <BookOpen className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{classItem.name}</p>
                                <p className="text-xs text-gray-500">Class ID: {classItem.id.substring(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td 
                            className="py-3 px-4 cursor-pointer"
                            onClick={() => navigate(`/teacher/classes/${classItem.id}`)}
                          >
                            <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                              {classItem.domain}
                            </Badge>
                          </td>
                          <td 
                            className="py-3 px-4 cursor-pointer"
                            onClick={() => navigate(`/teacher/classes/${classItem.id}`)}
                          >
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{classItem.students}</span>
                            </div>
                          </td>
                          <td 
                            className="py-3 px-4 cursor-pointer"
                            onClick={() => navigate(`/teacher/classes/${classItem.id}`)}
                          >
                            <div className="flex items-center justify-center">
                              {classItem.notifications > 0 ? (
                                <div className="relative">
                                  <Bell className="w-5 h-5 text-amber-500" />
                                  <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">{classItem.notifications}</span>
                                  </div>
                                </div>
                              ) : (
                                <Bell className="w-5 h-5 text-gray-300" />
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => navigate(`/teacher/classes/${classItem.id}/concepts`)}
                                title="Manage Concepts"
                              >
                                <Settings className="w-4 h-4 text-gray-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => navigate(`/teacher/classes/${classItem.id}/edit`)}
                                title="Edit Class"
                              >
                                <Edit className="w-4 h-4 text-gray-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                // Teachers table for admin dashboard
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Teacher Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Learning Domains</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Classes</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Students</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Notifications</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingTeachers ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            <p className="text-sm text-gray-500">Loading teachers...</p>
                          </div>
                        </td>
                      </tr>
                    ) : teachers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Users className="w-12 h-12 text-gray-300" />
                            <div>
                              <p className="text-gray-900 font-medium">No teachers yet</p>
                              <p className="text-sm text-gray-500 mt-1">Click "Add Teacher" to get started</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      teachers.map((teacher) => (
                        <tr 
                          key={teacher.id} 
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/tenant/teachers/edit/${teacher.id}`)}
                        >
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
                              {teacher.domains.length > 0 ? (
                                teacher.domains.map((domain, index) => (
                                  <Badge key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                                    {domain}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">No domains assigned</span>
                              )}
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
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center">
                              <Edit className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <StatisticsView />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Statistics View Component
 * Shows charts and analytics when statistics view is toggled
 */
function StatisticsView() {
  return (
    <div className="space-y-6">
      {/* Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white rounded-lg border border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">Student Enrollment Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500 text-sm">Student enrollment chart</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white rounded-lg border border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700">Class Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500 text-sm">Class distribution by domain</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-white rounded-lg border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Average Class Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">14.5</div>
            <p className="text-xs text-green-600 mt-1">+2.3 from last month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white rounded-lg border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Teacher Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">87%</div>
            <p className="text-xs text-blue-600 mt-1">Above target</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white rounded-lg border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Student Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">94%</div>
            <p className="text-xs text-green-600 mt-1">+1% improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Domain Performance */}
      <Card className="bg-white rounded-lg border border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">Domain Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['Piano', 'Guitar', 'Violin', 'Music Theory', 'Composition'].map((domain, index) => {
              const percentage = 65 + Math.random() * 30; // Random between 65-95%
              return (
                <div key={domain} className="flex items-center gap-3">
                  <div className="w-32 text-sm text-gray-700">{domain}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-600 w-12 text-right">{Math.round(percentage)}%</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}