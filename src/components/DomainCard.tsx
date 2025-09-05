import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Target, Dumbbell, ChevronRight } from 'lucide-react';
import { Domain } from '@/hooks/useDomains';
import { DomainStats } from '@/hooks/useDomainStats';
import { toStringSafe } from '@/lib/utils';

interface DomainCardProps {
  domain: Domain;
  stats?: DomainStats;
  onClick: () => void;
}

export const DomainCard = ({ domain, stats, onClick }: DomainCardProps) => {
  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50 group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {domain.name}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {toStringSafe(domain.description)}
            </CardDescription>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        {domain.icon_name && (
          <Badge variant="secondary" className="w-fit">
            {domain.icon_name}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 mx-auto mb-2">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div className="text-sm font-medium">{stats?.learningGoalsCount || 0}</div>
            <div className="text-xs text-muted-foreground">Goals</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/10 mx-auto mb-2">
              <BookOpen className="h-4 w-4 text-secondary-foreground" />
            </div>
            <div className="text-sm font-medium">{stats?.conceptsCount || 0}</div>
            <div className="text-xs text-muted-foreground">Concepts</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 mx-auto mb-2">
              <Dumbbell className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="text-sm font-medium">{stats?.exercisesCount || 0}</div>
            <div className="text-xs text-muted-foreground">Exercises</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};