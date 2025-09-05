import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PlatformStats } from "../types/dashboard";
import { BookOpen, Target, FileText, Database } from "lucide-react";

interface StatsOverviewProps {
  stats: PlatformStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const statCards = [
    {
      title: "Total Domains",
      value: stats.totalDomains,
      icon: Database,
      description: "Active learning domains"
    },
    {
      title: "Total Concepts",
      value: stats.totalConcepts,
      icon: BookOpen,
      description: "Learning concepts across all domains"
    },
    {
      title: "Learning Goals",
      value: stats.totalLearningGoals,
      icon: Target,
      description: "Defined learning objectives"
    },
    {
      title: "Total Exercises",
      value: stats.totalExercises,
      icon: FileText,
      description: "Practice exercises available"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}