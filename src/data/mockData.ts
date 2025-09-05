import { DomainStats, PlatformStats } from "@/types/dashboard";

export const mockDomains: DomainStats[] = [
  {
    id: "math",
    name: "Mathematics",
    description: "Algebra, geometry, calculus and more",
    status: "active",
    concepts: 420,
    learningGoals: 185,
    exercises: 980,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "science",
    name: "Science",
    description: "Physics, chemistry and biology fundamentals",
    status: "draft",
    concepts: 256,
    learningGoals: 112,
    exercises: 610,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: "history",
    name: "History",
    description: "World history from ancient to modern times",
    status: "archived",
    concepts: 133,
    learningGoals: 54,
    exercises: 210,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
];

export const calculatePlatformStats = (domains: DomainStats[]): PlatformStats => {
  return domains.reduce(
    (acc, d) => {
      acc.totalDomains += 1;
      acc.totalConcepts += d.concepts;
      acc.totalLearningGoals += d.learningGoals;
      acc.totalExercises += d.exercises;
      return acc;
    },
    { totalDomains: 0, totalConcepts: 0, totalLearningGoals: 0, totalExercises: 0 } as PlatformStats
  );
};
