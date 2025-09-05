import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { DomainStats } from "../types/dashboard";
import { Settings, BarChart3, Calendar } from "lucide-react";

interface DomainCardProps {
  domain: DomainStats;
  onManage: (domainId: string) => void;
  onViewAnalytics: (domainId: string) => void;
}

export function DomainCard({ domain, onManage, onViewAnalytics }: DomainCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'archived':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{domain.name}</CardTitle>
            <CardDescription className="text-sm">{domain.description}</CardDescription>
          </div>
          <Badge className={getStatusColor(domain.status)} variant="secondary">
            {domain.status.charAt(0).toUpperCase() + domain.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{domain.concepts}</div>
            <div className="text-xs text-muted-foreground">Concepts</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{domain.learningGoals}</div>
            <div className="text-xs text-muted-foreground">Goals</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{domain.exercises}</div>
            <div className="text-xs text-muted-foreground">Exercises</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Last updated: {new Date(domain.lastUpdated).toLocaleDateString()}</span>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onManage(domain.id)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onViewAnalytics(domain.id)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}