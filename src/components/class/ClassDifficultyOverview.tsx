import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClassDifficultyAnalysis } from '@/types/class-concepts.types';
import { getDifficultyLevel, DIFFICULTY_LEVELS } from '@/types/class-concepts.types';

interface ClassDifficultyOverviewProps {
  analysis: ClassDifficultyAnalysis | null;
  loading?: boolean;
  className?: string;
}

export function ClassDifficultyOverview({ 
  analysis, 
  loading = false,
  className 
}: ClassDifficultyOverviewProps) {
  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Class Difficulty</CardTitle>
          <CardDescription>No concepts assigned yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add concepts to this class to see difficulty analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  const suggestedLevel = getDifficultyLevel(analysis.suggestedLevel);
  const confidencePercentage = Math.round(analysis.suggestedLevelConfidence * 100);
  const difficultyRange = analysis.maxDifficulty - analysis.minDifficulty;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Class Difficulty Analysis</CardTitle>
        <CardDescription>
          Based on {analysis.conceptCount} concept{analysis.conceptCount !== 1 ? 's' : ''} 
          ({analysis.mandatoryConceptCount} mandatory)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Suggested Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Suggested Level</span>
            <div className="flex items-center gap-2">
              <Badge 
                style={{ backgroundColor: suggestedLevel.color }}
                className="text-white"
              >
                {suggestedLevel.icon} {suggestedLevel.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {confidencePercentage}% confidence
              </span>
            </div>
          </div>
          <Progress value={confidencePercentage} className="h-2" />
        </div>

        {/* Difficulty Range */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Difficulty Range</span>
            <span className="text-muted-foreground">
              Level {analysis.minDifficulty} - {analysis.maxDifficulty}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {DIFFICULTY_LEVELS.map((level) => {
              const isInRange = level.value >= analysis.minDifficulty && 
                               level.value <= analysis.maxDifficulty;
              const isMedian = level.value === Math.round(analysis.medianDifficulty);
              return (
                <div
                  key={level.value}
                  className={cn(
                    "flex-1 h-8 rounded-sm transition-all",
                    isInRange ? "opacity-100" : "opacity-20",
                    isMedian && "ring-2 ring-primary ring-offset-2"
                  )}
                  style={{ backgroundColor: level.color }}
                  title={`${level.label} (${level.value})`}
                />
              );
            })}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Average Difficulty</p>
            <p className="text-lg font-semibold">
              {analysis.avgDifficulty.toFixed(1)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Median Difficulty</p>
            <p className="text-lg font-semibold">
              {analysis.medianDifficulty.toFixed(1)}
            </p>
          </div>
          {analysis.weightedAvgDifficulty && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Weighted Average</p>
              <p className="text-lg font-semibold">
                {analysis.weightedAvgDifficulty.toFixed(1)}
              </p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Difficulty Spread</p>
            <p className="text-lg font-semibold">
              {difficultyRange} level{difficultyRange !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Distribution Chart */}
        {Object.keys(analysis.difficultyDistribution).length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Concept Distribution</p>
            <div className="space-y-1">
              {Object.entries(analysis.difficultyDistribution)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([difficulty, count]) => {
                  const level = getDifficultyLevel(Number(difficulty));
                  const percentage = (count / analysis.conceptCount) * 100;
                  return (
                    <div key={difficulty} className="flex items-center gap-2">
                      <span className="text-xs w-20 text-right">
                        {level.label}
                      </span>
                      <div className="flex-1 h-4 bg-gray-100 rounded-sm overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: level.color 
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12">
                        {count}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Warnings and Recommendations */}
        {analysis.warning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>{analysis.warning}</AlertDescription>
          </Alert>
        )}

        {analysis.recommendation && (
          <Alert variant={analysis.warning ? "default" : "default"}>
            <Info className="h-4 w-4" />
            <AlertTitle>Recommendation</AlertTitle>
            <AlertDescription>{analysis.recommendation}</AlertDescription>
          </Alert>
        )}

        {!analysis.warning && difficultyRange <= 2 && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Well Balanced</AlertTitle>
            <AlertDescription>
              This class has a consistent difficulty level suitable for focused learning.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}