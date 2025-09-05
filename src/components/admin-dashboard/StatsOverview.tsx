import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformStats } from "@/types/dashboard";
import { BookOpen, Target, FileText, Database } from "lucide-react";

interface StatsOverviewProps {
  stats: PlatformStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const statCards = [
    { title: "Total Domains", value: stats.totalDomains, icon: Database, description: "Active learning domains" },
    { title: "Total Concepts", value: stats.totalConcepts, icon: BookOpen, description: "Concepts across all domains" },
    { title: "Learning Goals", value: stats.totalLearningGoals, icon: Target, description: "Defined learning objectives" },
    { title: "Total Exercises", value: stats.totalExercises, icon: FileText, description: "Practice exercises available" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <Card key={stat.title} className="min-h-[var(--admin-stat-card-min-h)] bg-surface-card border-0 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-dashboard-primary">{stat.title}</CardTitle>
            <stat.icon className="h-5 w-5 text-dashboard-secondary" />
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <div className="mt-2 text-2xl font-bold text-dashboard-primary">{stat.value.toLocaleString()}</div>
            <p className="text-xs text-dashboard-text-muted mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
