import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { School, Plus, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TeacherClassesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
        <p className="text-gray-600 mt-2">Manage your classes and schedules</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <School className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Your Classes</CardTitle>
                <CardDescription>View and manage all your teaching classes</CardDescription>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/teacher/classes/create')}
              className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:from-[#0891b2] hover:to-[#7c3aed]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Class
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes Yet</h3>
            <p className="text-gray-600 mb-6">
              Start by creating your first class to begin teaching
            </p>
            <Button 
              variant="outline"
              onClick={() => navigate('/teacher/classes/create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Class
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <School className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Classes</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};