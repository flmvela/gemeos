import React from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Settings, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  count?: number;
  comingSoon?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  colorScheme?: 'purple' | 'blue' | 'green';
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  count,
  comingSoon,
  highlighted = false,
  onClick,
  colorScheme = 'purple'
}: FeatureCardProps) {
  const getColorStyles = () => {
    switch(colorScheme) {
      case 'blue':
        return {
          bg: 'bg-[#A3D1FC]/20',
          icon: 'text-[#0B5FAE]',
          stat: 'text-[#0B5FAE]'
        };
      case 'green':
        return {
          bg: 'bg-[#22C55E]/10',
          icon: 'text-[#22C55E]',
          stat: 'text-[#22C55E]'
        };
      default:
        return {
          bg: 'bg-[#110D59]/10',
          icon: 'text-[#110D59]',
          stat: 'text-[#110D59]'
        };
    }
  };

  const colors = getColorStyles();
  return (
    <Card 
      className={cn(
        "relative overflow-hidden h-full",
        "bg-white rounded-lg",
        "border border-[#E5E7EB]",
        "shadow-sm hover:shadow-lg",
        "transition-all duration-200",
        "cursor-pointer group"
      )}
      onClick={onClick}
    >
      {/* Status indicator line at top */}
      {highlighted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#110D59]" />
      )}
      <CardHeader className="p-6 pb-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          {/* Icon with proper brand colors */}
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full",
            colors.bg
          )}>
            <Icon className={cn("h-5 w-5", colors.icon)} />
          </div>
          
          {/* Count or Coming Soon badge */}
          <div className="flex items-center gap-2">
            {comingSoon ? (
              <Badge className="px-3 py-1 text-xs uppercase tracking-wider rounded-full bg-[#7E7BB3] text-white border-0">
                Coming Soon
              </Badge>
            ) : count !== undefined ? (
              <div className={cn("text-2xl font-bold", colors.stat)}>
                {count}
              </div>
            ) : null}
            <ChevronRight className="h-5 w-5 text-[#7E7BB3] group-hover:text-[#110D59] transition-colors" />
          </div>
        </div>
        
        {/* Title with proper typography */}
        <div>
          <CardTitle className="text-lg font-semibold text-[#110D59] group-hover:text-[#0B5FAE] transition-colors">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 flex flex-col flex-1">
        <CardDescription className="text-sm text-[#55555F] leading-relaxed line-clamp-2 min-h-[2.5rem] flex-1">
          {description}
        </CardDescription>
        
        {/* Action buttons if not coming soon */}
        {!comingSoon && (
          <div className="mt-4">
            <button
              className={cn(
                "w-full h-[51px] rounded-lg",
                "bg-[#0E77D9] text-white",
                "font-medium text-sm",
                "flex items-center justify-center gap-2",
                "transition-all duration-200",
                "hover:bg-[#0E77D9]/90",
                "active:bg-[#0E77D9]/85",
                "focus:outline-none focus:ring-2 focus:ring-[#0E77D9] focus:ring-offset-2"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              <Settings className="h-4 w-4" />
              Manage
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
