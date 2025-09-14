import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, Users, Calendar, MapPin, Clock, Edit, Settings, UserPlus, BookOpenCheck, TrendingUp, Plus, X, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { classService } from '@/services/class.service';
import { difficultyService } from '@/services/difficulty.service';

interface ClassData {
  id: string;
  name: string;
  description: string;
  domain_id: string;
  domain_name?: string;
  status: string;
  max_students: number;
  enrollment_type: string;
  enrollment_code?: string;
  created_at: string;
}

interface SessionData {
  id: string;
  class_id: string;
  session_date?: string;
  day_of_week?: string;
  start_time: string;
  duration: number;
  location: string;
  is_recurring: boolean;
}

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  invitation_status?: string;
  enrollment_date?: string;
}

export default function ClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [classConcepts, setClassConcepts] = useState<any[]>([]);
  const [availableConcepts, setAvailableConcepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [expandedConcepts, setExpandedConcepts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchClassDetails = async () => {
      if (!classId) return;

      try {
        // Fetch class details
        const { data: classInfo, error: classError } = await supabase
          .from('classes')
          .select('*')
          .eq('id', classId)
          .single();

        if (classError) throw classError;

        // Fetch domain name
        if (classInfo?.domain_id) {
          const { data: domainData } = await supabase
            .from('domains')
            .select('name')
            .eq('id', classInfo.domain_id)
            .single();
          
          if (domainData) {
            classInfo.domain_name = domainData.name;
          }
        }

        setClassData(classInfo);

        // Fetch sessions
        const { data: sessionData, error: sessionError } = await supabase
          .from('class_sessions')
          .select('*')
          .eq('class_id', classId)
          .order('session_date', { ascending: true });

        if (sessionError) throw sessionError;
        setSessions(sessionData || []);

        // Fetch student invitations for this class
        console.log('📚 Fetching students for class:', classId);
        const { data: invitations, error: invError } = await supabase
          .from('class_student_invitations')
          .select(`
            id,
            student_email,
            student_first_name,
            student_last_name,
            invitation_status,
            invited_at
          `)
          .eq('class_id', classId);

        console.log('📚 Invitations fetched:', invitations);
        if (invError) console.error('Error fetching invitations:', invError);

        // Fetch enrolled students (those who accepted)
        const { data: enrollments, error: enrollError } = await supabase
          .from('class_student_enrollments')
          .select(`
            id,
            enrollment_date,
            students (
              id,
              first_name,
              last_name,
              email
            )
          `)
          .eq('class_id', classId);

        if (enrollError) console.error('Error fetching enrollments:', enrollError);

        // Combine invitations and enrollments into student list
        const studentList: StudentData[] = [];
        
        // Add invited students
        if (invitations && invitations.length > 0) {
          console.log('📚 Processing', invitations.length, 'invitations');
          invitations.forEach(inv => {
            studentList.push({
              id: inv.id,
              first_name: inv.student_first_name || inv.student_email.split('@')[0].split('.')[0] || 'Unknown',
              last_name: inv.student_last_name || inv.student_email.split('@')[0].split('.')[1] || 'Student',
              email: inv.student_email,
              status: inv.invitation_status === 'accepted' ? 'enrolled' : 'invited',
              invitation_status: inv.invitation_status,
              enrollment_date: inv.invited_at
            });
          });
        } else {
          console.log('📚 No invitations found for this class');
        }

        console.log('📚 Final student list:', studentList);
        setStudents(studentList);

      } catch (error) {
        console.error('Error fetching class details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load class details',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetails();
  }, [classId]);

  // Fetch concepts when switching to content tab
  const fetchClassConcepts = async () => {
    if (!classId) return;
    
    setLoadingConcepts(true);
    try {
      // Create an instance of the class service
      const service = new classService();
      
      // Fetch concepts assigned to the class
      const concepts = await service.getClassConcepts(classId);
      setClassConcepts(concepts);
      
      // Fetch available concepts that can be added
      const { data: classInfo } = await supabase
        .from('classes')
        .select('domain_id, difficulty_level')
        .eq('id', classId)
        .single();
        
      if (classInfo?.domain_id) {
        // Get the class difficulty level (supports both old and new structure)
        const classDifficultyLevel = await difficultyService.getClassDifficultyLevel(classId);
        const baseLevel = classDifficultyLevel || classInfo.difficulty_level || 5;
        
        // Get concepts from the same domain with similar difficulty
        const minLevel = Math.max(1, baseLevel - 1);
        const maxLevel = Math.min(10, baseLevel + 1);
        
        // Use the new service that supports both structures
        const available = await difficultyService.getConceptsByDifficultyRange(
          classInfo.domain_id,
          minLevel,
          maxLevel
        );
          
        // Filter out already assigned concepts
        const assignedIds = concepts.map(c => c.concept_id);
        const filtered = (available || []).filter(c => !assignedIds.includes(c.id));
        setAvailableConcepts(filtered);
      }
    } catch (error) {
      console.error('Error fetching concepts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load concepts',
        variant: 'destructive'
      });
    } finally {
      setLoadingConcepts(false);
    }
  };

  // Add concept to class
  const handleAddConcept = async (conceptId: string) => {
    if (!classId) return;
    
    try {
      const service = new classService();
      await service.assignConceptsToClass({
        classId,
        concepts: [{
          conceptId,
          sequenceOrder: classConcepts.length
        }]
      });
      
      toast({
        title: 'Success',
        description: 'Concept added to class'
      });
      
      // Refresh concepts list
      await fetchClassConcepts();
    } catch (error) {
      console.error('Error adding concept:', error);
      toast({
        title: 'Error',
        description: 'Failed to add concept',
        variant: 'destructive'
      });
    }
  };

  // Toggle concept expansion
  const toggleConceptExpansion = (conceptId: string) => {
    setExpandedConcepts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conceptId)) {
        newSet.delete(conceptId);
      } else {
        newSet.add(conceptId);
      }
      return newSet;
    });
  };

  // Remove concept from class
  const handleRemoveConcept = async (conceptId: string) => {
    if (!classId) return;
    
    try {
      const service = new classService();
      await service.removeConceptFromClass(classId, conceptId);
      
      toast({
        title: 'Success',
        description: 'Concept removed from class'
      });
      
      // Refresh concepts list
      await fetchClassConcepts();
    } catch (error) {
      console.error('Error removing concept:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove concept',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="p-6">
        <p>Class not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/teacher/dashboard')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
            <p className="text-gray-600 mt-1">{classData.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate(`/teacher/classes/${classId}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Class
          </Button>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs 
        defaultValue="overview" 
        className="w-full"
        onValueChange={(value) => {
          if (value === 'content' && classConcepts.length === 0 && !loadingConcepts) {
            fetchClassConcepts();
          }
        }}
      >
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpenCheck className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Class Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Domain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold">{classData.domain_name || 'General'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Enrollment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <span className="text-lg font-semibold">
                {students.length} / {classData.max_students} Students
              </span>
            </div>
            <Badge className="mt-2" variant={classData.enrollment_type === 'open' ? 'default' : 'secondary'}>
              {classData.enrollment_type === 'open' ? 'Open Enrollment' : 'Invite Only'}
            </Badge>
            {classData.enrollment_code && (
              <p className="text-sm text-gray-600 mt-2">
                Code: <span className="font-mono font-semibold">{classData.enrollment_code}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge 
              className={`${
                classData.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {classData.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No sessions scheduled yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {session.is_recurring 
                          ? `Every ${session.day_of_week}` 
                          : session.session_date || 'Date TBD'}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.start_time} ({session.duration} min)
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  {session.is_recurring && (
                    <Badge variant="outline">Recurring</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assigned Concepts */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Assigned Concepts</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Concepts currently in this class</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchClassConcepts}
                  disabled={loadingConcepts}
                >
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {loadingConcepts ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : classConcepts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpenCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No concepts assigned yet</p>
                    <p className="text-sm mt-2">Add concepts from the available list</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {classConcepts.map((classConcept) => {
                      const concept = classConcept.concept || {};
                      const isExpanded = expandedConcepts.has(classConcept.concept_id);
                      const learningGoals = concept.learning_goals || [];
                      
                      return (
                        <div
                          key={classConcept.id}
                          className="bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900">{concept.name}</h4>
                                  {learningGoals.length > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleConceptExpansion(classConcept.concept_id)}
                                      className="h-6 px-2"
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="h-3 w-3" />
                                      ) : (
                                        <ChevronDown className="h-3 w-3" />
                                      )}
                                      <span className="ml-1 text-xs">{learningGoals.length} goals</span>
                                    </Button>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{concept.description}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs"
                                    style={{
                                      borderColor: concept.difficulty_level_details?.color_code,
                                      color: concept.difficulty_level_details?.color_code
                                    }}
                                  >
                                    {concept.difficulty_level_details?.level_name || 
                                     `Level ${concept.difficulty_level || 'N/A'}`}
                                  </Badge>
                                  {classConcept.is_mandatory && (
                                    <Badge className="text-xs bg-blue-100 text-blue-800">
                                      Mandatory
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveConcept(classConcept.concept_id)}
                                className="ml-2 h-8 w-8"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {isExpanded && learningGoals.length > 0 && (
                            <div className="border-t border-gray-200 px-3 py-2 bg-white rounded-b-lg">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                  <Target className="h-4 w-4" />
                                  Learning Goals
                                </div>
                                {learningGoals.map((goal: any) => (
                                  <div key={goal.id} className="ml-6 p-2 bg-gray-50 rounded">
                                    <p className="text-sm font-medium text-gray-800">{goal.name}</p>
                                    {goal.description && (
                                      <p className="text-xs text-gray-600 mt-1">{goal.description}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Concepts */}
            <Card>
              <CardHeader>
                <CardTitle>Available Concepts</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Concepts you can add to this class</p>
              </CardHeader>
              <CardContent>
                {availableConcepts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No more concepts available</p>
                    <p className="text-sm mt-2">All matching concepts are already assigned</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableConcepts.map((concept) => {
                      const learningGoals = concept.learning_goals || [];
                      return (
                        <div
                          key={concept.id}
                          className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{concept.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{concept.description}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                  style={{
                                    borderColor: concept.difficulty_level_details?.color_code,
                                    color: concept.difficulty_level_details?.color_code
                                  }}
                                >
                                  {concept.difficulty_level_details?.level_name || 
                                   `Level ${concept.difficulty_level || 'N/A'}`}
                                </Badge>
                                {learningGoals.length > 0 && (
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    {learningGoals.length} learning goals
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAddConcept(concept.id)}
                              className="ml-2 h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Students</CardTitle>
              <Button 
                size="sm" 
                onClick={() => navigate('/teacher/students/add')}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Student
              </Button>
            </CardHeader>
            <CardContent>
              {console.log('📚 Rendering students section, students array:', students, 'length:', students.length)}
              {students.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No students yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => navigate('/teacher/students/add')}
                  >
                    Invite Students
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </div>
                      <Badge 
                        variant={student.status === 'enrolled' ? 'default' : 'secondary'}
                      >
                        {student.status === 'enrolled' ? 'Enrolled' : 'Invited'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{students.length}</p>
                <p className="text-xs text-gray-600 mt-1">Enrolled in class</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">On Track</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {Math.floor(students.length * 0.7)}
                </p>
                <p className="text-xs text-gray-600 mt-1">Meeting goals</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Needs Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">
                  {Math.floor(students.length * 0.2)}
                </p>
                <p className="text-xs text-gray-600 mt-1">Struggling with concepts</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Practicing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.floor(students.length * 0.5)}
                </p>
                <p className="text-xs text-gray-600 mt-1">Active this week</p>
              </CardContent>
            </Card>
          </div>

          {/* Student Progress Table */}
          <Card>
            <CardHeader>
              <CardTitle>Individual Student Progress</CardTitle>
              <p className="text-sm text-gray-600">Monitor each student's learning journey</p>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No students enrolled yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Student</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Goals Completed</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Practice Time</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Last Active</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        // Mock progress data - in production, this would come from the database
                        const isOnTrack = Math.random() > 0.3;
                        const isStruggling = !isOnTrack && Math.random() > 0.5;
                        const isPracticing = Math.random() > 0.5;
                        const goalsCompleted = Math.floor(Math.random() * 10);
                        const practiceHours = Math.floor(Math.random() * 20);
                        
                        return (
                          <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {student.first_name} {student.last_name}
                                </p>
                                <p className="text-sm text-gray-600">{student.email}</p>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="flex justify-center gap-2">
                                {isOnTrack && (
                                  <Badge className="bg-green-100 text-green-800">On Track</Badge>
                                )}
                                {isStruggling && (
                                  <Badge className="bg-yellow-100 text-yellow-800">Needs Support</Badge>
                                )}
                                {isPracticing && (
                                  <Badge className="bg-blue-100 text-blue-800">Practicing</Badge>
                                )}
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <span className="font-medium">{goalsCompleted}</span>
                                <span className="text-gray-500">/ 15</span>
                              </div>
                              <div className="w-24 bg-gray-200 rounded-full h-2 mt-1 mx-auto">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${(goalsCompleted / 15) * 100}%` }}
                                />
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className="text-gray-700">{practiceHours}h</span>
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className="text-sm text-gray-600">2 hours ago</span>
                            </td>
                            <td className="text-center py-3 px-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Navigate to student detail view
                                  navigate(`/teacher/students/${student.id}`);
                                }}
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}