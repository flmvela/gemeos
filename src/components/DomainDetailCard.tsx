import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, LucideIcon } from 'lucide-react';

interface DomainDetailCardProps {
  title: string;
  description: string;
  count?: number;
  icon: LucideIcon;
  onClick: () => void;
  badge?: string;
}

export const DomainDetailCard = ({ 
  title, 
  description, 
  count, 
  icon: Icon, 
  onClick,
  badge 
}: DomainDetailCardProps) => {
  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 group h-full"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {title}
              </CardTitle>
              {count !== undefined && (
                <div className="text-2xl font-bold text-muted-foreground mt-1">
                  {count}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
};