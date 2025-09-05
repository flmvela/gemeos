import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  count?: number;
  comingSoon?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
}

export function FeatureCard({ 
  title, 
  description, 
  icon: Icon, 
  count, 
  comingSoon, 
  highlighted = false,
  onClick 
}: FeatureCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
        highlighted ? 'ring-2 ring-primary bg-gradient-to-br from-primary/5 to-primary/10' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            highlighted ? 'bg-primary text-primary-foreground' : 'bg-accent'
          }`}>
            <Icon className="w-6 h-6" />
          </div>
          {comingSoon && (
            <Badge variant="secondary" className="text-xs">
              Coming Soon
            </Badge>
          )}
          {count !== undefined && (
            <Badge variant="outline" className="text-xs">
              {count}
            </Badge>
          )}
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="text-sm mt-1">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}