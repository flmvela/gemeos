import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  BookOpen, 
  Target, 
  ClipboardList, 
  CheckSquare, 
  Lightbulb, 
  Bot, 
  Upload, 
  Trophy, 
  Heart,
  ArrowLeft,
  Dumbbell
} from "lucide-react";
import { FeatureCard } from "./FeatureCard";
import { DynamicBreadcrumb } from "./navigation/DynamicBreadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileUploadDropzone } from '@/components/upload/FileUploadDropzone';
import { useUploadFiles } from '@/hooks/useFileUpload';
import { useDomains } from '@/hooks/useDomains';

interface AdminDomainPageProps {
  domainName: string;
}

type ContentType = 'concept' | 'learning_goal' | 'exercise';

export function AdminDomainPage({ domainName }: AdminDomainPageProps) {
  const navigate = useNavigate();
  const { domainId } = useParams();
  const [showUpload, setShowUpload] = useState(false);
  
  const { domains } = useDomains();
  const { uploadFiles, isUploading, uploadProgress } = useUploadFiles();
  
  const domain = domains.find(d => d.id === domainId);

  // Mock data for the dashboard
  const mockData = {
    conceptsCount: 74,
    goalsCount: 28,
    tasksCount: 15,
    strategiesCount: 8,
  };

  const handleFilesSelected = (files: File[]) => {
    if (!domainId || !domain) {
      return;
    }

    console.log('AdminDomainPage - handleFilesSelected called with:', {
      domainId,
      domainName: domain.name,
      filesCount: files.length
    });

    uploadFiles({
      files,
      domainId,
      domainName: domain.name
    });
  };

  const handleBackToCards = () => {
    setShowUpload(false);
  };



  return (
    <div className="p-6 space-y-8">
      <div className="mx-auto max-w-7xl">
        <DynamicBreadcrumb />

        {!showUpload ? (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-semibold mb-2 text-[#110D59]">{domainName}</h1>
              <p className="text-[#55555F]">
                Manage all aspects of your learning domain from this control center
              </p>
            </header>

        {/* Learning Setup & Content Management */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-[#110D59]">Learning Setup & Content Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <FeatureCard
              title="Learning Concepts"
              description="Number of concepts in the domain; manage concepts and relationships."
              icon={BookOpen}
              count={mockData.conceptsCount}
              colorScheme="purple"
              onClick={() => navigate(`/admin/domain/${domainId}/concepts`)}
            />
            <FeatureCard
              title="Learning Goals"
              description="Number of learning objectives; define and organize them."
              icon={Target}
              count={mockData.goalsCount}
              colorScheme="blue"
              onClick={() => navigate(`/admin/domain/${domainId}/goals`)}
            />
            <FeatureCard
              title="Exercises"
              description="Create and manage practice activities."
              icon={Dumbbell}
              colorScheme="blue"
              comingSoon
              onClick={() => console.log("Exercises coming soon")}
            />
            <FeatureCard
              title="Tasks"
              description="Manage types of tasks used in this domain."
              icon={CheckSquare}
              count={mockData.tasksCount}
              onClick={() => console.log("Navigate to Tasks")}
            />
            <FeatureCard
              title="Strategies"
              description="Define learning strategies and methodologies for this domain."
              icon={Lightbulb}
              count={mockData.strategiesCount}
              onClick={() => console.log("Navigate to Strategies")}
            />
          </div>
        </section>

        {/* Intelligent Assistance & Teacher Tools */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-[#110D59]">Intelligent Assistance & Teacher Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <FeatureCard
              title="Train the AI"
              description="Train the AI (your digital twin) to support teaching and content creation."
              icon={Bot}
              onClick={() => navigate(`/admin/domain/${domainId}/ai-guidance`)}
            />
            <FeatureCard
              title="Upload Data"
              description="Upload and manage learning materials, datasets, and resources for AI training and content delivery."
              icon={Upload}
              onClick={() => setShowUpload(true)}
            />
          </div>
        </section>

        {/* Motivation & Engagement */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 text-[#110D59]">Motivation & Engagement</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard
              title="Gamification"
              description="Add game elements to boost learning motivation."
              icon={Trophy}
              comingSoon
              onClick={() => console.log("Gamification coming soon")}
            />
            <FeatureCard
              title="Motivation"
              description="Tools to track and boost learner engagement."
              icon={Heart}
              comingSoon
              onClick={() => console.log("Motivation tools coming soon")}
            />
          </div>
          </section>
          </>
        ) : (
          /* Upload Interface */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Upload Data</h1>
                <p className="text-[#55555F] mt-2">
                  Choose the type of content you want to upload for {domainName}.
                </p>
              </div>
              <Button variant="ghost" onClick={handleBackToCards}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>

            {/* Direct Upload Area */}
            <Card>
              <CardContent className="pt-6">
                <FileUploadDropzone
                  onFilesSelected={handleFilesSelected}
                  uploadProgress={uploadProgress}
                  isUploading={isUploading}
                  disabled={!domainId}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}