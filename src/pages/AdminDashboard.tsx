import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { StatsOverview } from "@/components/admin-dashboard/StatsOverview";
import { DomainList } from "@/components/admin-dashboard/DomainList";
import { useDomains } from "@/hooks/useDomains";
import { useAllDomainsStats } from "@/hooks/useDomainStats";
import type { DomainStats as UIDomainStats } from "@/types/dashboard";
import { PageContainer } from "@/components/layout/PageContainer";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { domains } = useDomains();
  const { domainsStats } = useAllDomainsStats();

  const platformStats = useMemo(() => {
    const totalDomains = domains.length;
    const totals = domains.reduce(
      (acc, d) => {
        const stats = domainsStats[d.id] || { conceptsCount: 0, learningGoalsCount: 0, exercisesCount: 0 };
        acc.totalConcepts += stats.conceptsCount || 0;
        acc.totalLearningGoals += stats.learningGoalsCount || 0;
        acc.totalExercises += stats.exercisesCount || 0;
        return acc;
      },
      { totalConcepts: 0, totalLearningGoals: 0, totalExercises: 0 }
    );

    return {
      totalDomains,
      totalConcepts: totals.totalConcepts,
      totalLearningGoals: totals.totalLearningGoals,
      totalExercises: totals.totalExercises,
    };
  }, [domains, domainsStats]);

  const mappedDomains: UIDomainStats[] = useMemo(() => {
    return domains.map((d) => {
      const s = domainsStats[d.id] || { conceptsCount: 0, learningGoalsCount: 0, exercisesCount: 0 };
      return {
        id: d.id,
        name: d.name,
        description: d.description,
        status: 'active',
        concepts: s.conceptsCount || 0,
        learningGoals: s.learningGoalsCount || 0,
        exercises: s.exercisesCount || 0,
        lastUpdated: d.updated_at || d.created_at,
      } as UIDomainStats;
    });
  }, [domains, domainsStats]);

  // SEO: title and meta
  if (typeof document !== 'undefined') {
    document.title = "Admin Dashboard | Gemeos";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Admin dashboard for managing learning domains and platform insights.';
      document.head.appendChild(m);
    } else {
      metaDesc.setAttribute('content', 'Admin dashboard for managing learning domains and platform insights.');
    }
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', window.location.origin + '/admin/dashboard');
      document.head.appendChild(link);
    } else {
      canonical.setAttribute('href', window.location.origin + '/admin/dashboard');
    }
  }

  const handleCreateNewDomain = () => {
    navigate('/admin/learning-domains');
  };

  const handleManageDomain = (domainId: string) => {
    navigate(`/admin/domain/${domainId}`);
  };

  const handleViewAnalytics = (domainId: string) => {
    navigate(`/admin/domain/${domainId}`);
  };

  return (
    <PageContainer className="bg-dashboard-bg min-h-screen">
      <div className="space-y-12">
        <section>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dashboard-primary mb-3">Admin Dashboard</h1>
            <h2 className="text-xl font-semibold text-dashboard-secondary mb-4">Platform Overview</h2>
            <p className="text-dashboard-text-muted text-base leading-relaxed">
              Get a high-level view of your educational platform's content and performance metrics.
            </p>
          </div>
          <StatsOverview stats={platformStats} />
        </section>

        <section>
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-dashboard-secondary mb-4">Learning Domains</h2>
            <p className="text-dashboard-text-muted text-base leading-relaxed">
              Manage your learning domains, view their statistics, and access detailed management tools.
            </p>
          </div>
          <DomainList
            domains={mappedDomains}
            onCreateNew={handleCreateNewDomain}
            onManageDomain={handleManageDomain}
            onViewAnalytics={handleViewAnalytics}
          />
        </section>
      </div>
    </PageContainer>
  );
}