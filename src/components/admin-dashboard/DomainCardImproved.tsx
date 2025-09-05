import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DomainStats } from "@/types/dashboard";
import { Settings, BarChart3, Calendar, BookOpen, Target, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface DomainCardImprovedProps {
  domain: DomainStats;
  onManage: (domainId: string) => void;
  onViewAnalytics: (domainId: string) => void;
}

export function DomainCardImproved({ domain, onManage, onViewAnalytics }: DomainCardImprovedProps) {
  const getStatusStyles = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return {
          badge: 'bg-[#22C55E] text-white border-0 font-medium',
          indicator: 'bg-[#22C55E]'
        };
      case 'draft':
        return {
          badge: 'bg-[#F59E0B] text-white border-0 font-medium',
          indicator: 'bg-[#F59E0B]'
        };
      case 'archived':
        return {
          badge: 'bg-[#7E7BB3] text-white border-0 font-medium',
          indicator: 'bg-[#7E7BB3]'
        };
      default:
        return {
          badge: 'bg-[#7E7BB3] text-white border-0 font-medium',
          indicator: 'bg-[#7E7BB3]'
        };
    }
  };

  const statusStyles = getStatusStyles(domain.status);

  return (
    <Card className={cn(
      "relative overflow-hidden",
      "bg-white rounded-lg", // 8px border radius per style guide
      "border border-[#E5E7EB]", // Light gray border
      "shadow-sm hover:shadow-lg", // Elevation levels 1 to 2
      "transition-all duration-200",
      "hover:scale-[1.01]", // Subtle scale on hover
      "cursor-default"
    )}>
      {/* Status indicator line at top */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", statusStyles.indicator)} />
      
      <CardHeader className="p-6 pb-4 space-y-4">
        {/* Header with title and status badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-semibold text-[#110D59] truncate">
              {domain.name}
            </CardTitle>
          </div>
          <Badge className={cn(
            "px-3 py-1 text-xs uppercase tracking-wider",
            "rounded-full", // More modern pill shape
            statusStyles.badge
          )}>
            {domain.status}
          </Badge>
        </div>
        
        {/* Description with proper typography */}
        <CardDescription className="text-sm text-[#7E7BB3] leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {domain.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-6">
        {/* Statistics Section with Brand Colors */}
        <div className="bg-[#F1F2F4] rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#110D59]/10 mx-auto">
                <BookOpen className="h-5 w-5 text-[#110D59]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#110D59]">{domain.concepts}</div>
                <div className="text-xs text-[#7E7BB3] font-medium mt-0.5">Concepts</div>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#28246F]/10 mx-auto">
                <Target className="h-5 w-5 text-[#28246F]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#28246F]">{domain.learningGoals}</div>
                <div className="text-xs text-[#7E7BB3] font-medium mt-0.5">Goals</div>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#A3D1FC]/20 mx-auto">
                <Dumbbell className="h-5 w-5 text-[#0B5FAE]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#0B5FAE]">{domain.exercises}</div>
                <div className="text-xs text-[#7E7BB3] font-medium mt-0.5">Exercises</div>
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated Section */}
        <div className="flex items-center gap-2 text-sm text-[#7E7BB3]">
          <Calendar className="h-4 w-4" />
          <span>Last updated: {new Date(domain.lastUpdated).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}</span>
        </div>

        {/* Action Buttons with Proper Style Guide Implementation */}
        <div className="flex gap-3">
          <button
            onClick={() => onManage(domain.id)}
            className={cn(
              "flex-1 h-[51px] rounded-lg", // Proper height and radius from style guide
              "bg-[#0E77D9] text-white", // Secondary blue from style guide
              "font-medium text-sm",
              "flex items-center justify-center gap-2",
              "transition-all duration-200",
              "hover:bg-[#0E77D9]/90", // 10% darker on hover
              "active:bg-[#0E77D9]/85", // 15% darker on click
              "focus:outline-none focus:ring-2 focus:ring-[#0E77D9] focus:ring-offset-2"
            )}
          >
            <Settings className="h-4 w-4" />
            Manage
          </button>
          
          <button
            onClick={() => onViewAnalytics(domain.id)}
            className={cn(
              "flex-1 h-[51px] rounded-lg", // Proper height and radius
              "bg-[#0B5FAE] text-white", // Primary blue from style guide
              "font-medium text-sm",
              "flex items-center justify-center gap-2",
              "transition-all duration-200",
              "hover:bg-[#0B5FAE]/90", // 10% darker on hover
              "active:bg-[#0B5FAE]/85", // 15% darker on click
              "focus:outline-none focus:ring-2 focus:ring-[#0B5FAE] focus:ring-offset-2"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
        </div>
      </CardContent>
    </Card>
  );
}