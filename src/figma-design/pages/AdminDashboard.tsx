import React from 'react';
import { StatsOverview } from '../StatsOverview';
import { DomainList } from '../DomainList';
import { Domain } from '../../types/dashboard';

interface AdminDashboardProps {
  domains: Domain[];
  platformStats: {
    totalDomains: number;
    totalConcepts: number;
    totalLearners: number;
    totalModules: number;
  };
  onCreateNewDomain: () => void;
  onManageDomain: (domainId: string) => void;
  onViewAnalytics: (domainId: string) => void;
}

export function AdminDashboard({
  domains,
  platformStats,
  onCreateNewDomain,
  onManageDomain,
  onViewAnalytics
}: AdminDashboardProps) {
  return (
    <main className="container mx-auto px-6 py-8 space-y-8">
      {/* Platform Statistics */}
      <section>
        <div className="mb-6">
          <h2 className="mb-2">Platform Overview</h2>
          <p className="text-muted-foreground">
            Get a high-level view of your educational platform's content and performance metrics.
          </p>
        </div>
        <StatsOverview stats={platformStats} />
      </section>

      {/* Domain Management */}
      <section>
        <div className="mb-6">
          <h2 className="mb-2">Learning Domains</h2>
          <p className="text-muted-foreground">
            Manage your learning domains, view their statistics, and access detailed management tools.
          </p>
        </div>
        <DomainList
          domains={domains}
          onCreateNew={onCreateNewDomain}
          onManageDomain={onManageDomain}
          onViewAnalytics={onViewAnalytics}
        />
      </section>
    </main>
  );
}