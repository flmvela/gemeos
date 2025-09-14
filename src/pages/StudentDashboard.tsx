import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Clock, 
  Target, 
  Trophy, 
  Calendar,
  Activity,
  TrendingUp,
  User,
  LogOut
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ClassEnrollment {
  id: string;
  className: string;
  teacherName: string;
  nextSession?: string;
  progress: number;
}

interface LearningStats {
  totalConcepts: number;
  completedConcepts: number;
  practiceHours: number;
  currentStreak: number;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [stats, setStats] = useState<LearningStats>({
    totalConcepts: 24,
    completedConcepts: 8,
    practiceHours: 12.5,
    currentStreak: 5
  });

  useEffect(() => {
    if (!session?.user) {
      navigate('/login');
      return;
    }
    fetchStudentData();
  }, [session]);

  const fetchStudentData = async () => {
    if (!session?.user) return;

    try {
      // Get student record
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (studentError) {
        console.error('Error fetching student:', studentError);
        // If no student record, use auth metadata
        setStudentData({
          id: session.user.id,
          firstName: session.user.user_metadata?.first_name || 'Student',
          lastName: session.user.user_metadata?.last_name || '',
          email: session.user.email || ''
        });
      } else {
        setStudentData({
          id: student.id,
          firstName: student.first_name,
          lastName: student.last_name,
          email: student.email
        });

        // Fetch class enrollments
        const { data: enrollmentData } = await supabase
          .from('class_student_enrollments')
          .select(`
            id,
            classes (
              name,
              teachers (
                first_name,
                last_name
              )
            )
          `)
          .eq('student_id', student.id)
          .eq('status', 'active');

        if (enrollmentData) {
          setEnrollments(enrollmentData.map(e => ({
            id: e.id,
            className: e.classes?.name || 'Unknown Class',
            teacherName: e.classes?.teachers 
              ? `${e.classes.teachers.first_name} ${e.classes.teachers.last_name}`
              : 'Unknown Teacher',
            progress: Math.floor(Math.random() * 100) // Mock progress
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Welcome back, {studentData?.firstName}!
                </h1>
                <p className="text-sm text-gray-600">Let's continue your learning journey</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Learning Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round((stats.completedConcepts / stats.totalConcepts) * 100)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.completedConcepts}/{stats.totalConcepts} concepts
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Practice Time</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.practiceHours}h</p>
                  <p className="text-xs text-gray-500 mt-1">This month</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Streak</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.currentStreak} days</p>
                  <p className="text-xs text-gray-500 mt-1">Keep it up!</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Classes</p>
                  <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Enrolled</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Classes Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Classes</h2>
          {enrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{enrollment.className}</CardTitle>
                    <p className="text-sm text-gray-600">Teacher: {enrollment.teacherName}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-gray-600">{enrollment.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] h-2 rounded-full"
                            style={{ width: `${enrollment.progress}%` }}
                          />
                        </div>
                      </div>
                      {enrollment.nextSession && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Next session: {enrollment.nextSession}</span>
                        </div>
                      )}
                      <Button className="w-full" variant="outline">
                        Go to Class
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">You're not enrolled in any classes yet.</p>
                <p className="text-sm text-gray-500 mt-2">
                  Ask your teacher for an invitation to join a class.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Completed "Introduction to Variables"</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">+10 XP</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-sm">Achieved 5-day streak</p>
                    <p className="text-xs text-gray-500">Yesterday</p>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Achievement</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Started "Functions and Methods"</p>
                    <p className="text-xs text-gray-500">2 days ago</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}