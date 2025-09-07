import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { StatsOverview } from "@/components/admin-dashboard/StatsOverview";
import { DomainList } from "@/components/admin-dashboard/DomainList";
import { useDomains } from "@/hooks/useDomains";
import { domainNameToSlug } from "@/hooks/useDomainSlug";
import { useAllDomainsStats } from "@/hooks/useDomainStats";
import { useContentPermissions } from "@/hooks/useEffectiveContent";
import { useTenant } from "@/hooks/useTenant";
import type { DomainStats as UIDomainStats } from "@/types/dashboard";
import { PageContainer } from "@/components/layout/PageContainer";
import { PermissionGuard } from "@/components/PermissionGuard";

export default function DomainsDashboard() {
  const navigate = useNavigate();
  const { data: permissions } = useContentPermissions();
  const { currentTenant } = useTenant();
  
  // Determine tenant context based on user role
  const tenantId = permissions?.isPlatformAdmin ? undefined : currentTenant?.id;
  
  const { domains } = useDomains(tenantId);
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
    document.title = "Domains Dashboard | Gemeos";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Domains dashboard for managing learning domains and educational content.';
      document.head.appendChild(m);
    } else {
      metaDesc.setAttribute('content', 'Domains dashboard for managing learning domains and educational content.');
    }
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', window.location.origin + '/admin/domains/dashboard');
      document.head.appendChild(link);
    } else {
      canonical.setAttribute('href', window.location.origin + '/admin/domains/dashboard');
    }
  }

  const handleCreateNewDomain = () => {
    navigate('/admin/learning-domains');
  };

  const handleManageDomain = (domainId: string) => {
    // Find domain and convert to slug-based URL
    const domain = mappedDomains.find(d => d.id === domainId);
    if (domain) {
      const slug = domainNameToSlug(domain.name);
      navigate(`/admin/domains/${slug}`);
    } else {
      // Fallback to legacy URL if domain not found
      navigate(`/admin/domain/${domainId}`);
    }
  };

  const handleViewAnalytics = (domainId: string) => {
    // Find domain and convert to slug-based URL for analytics
    const domain = mappedDomains.find(d => d.id === domainId);
    if (domain) {
      const slug = domainNameToSlug(domain.name);
      navigate(`/admin/domains/${slug}`); // Same as manage for now
    } else {
      // Fallback to legacy URL if domain not found
      navigate(`/admin/domain/${domainId}`);
    }
  };

  return (
    <PermissionGuard resource="page:dashboard" action="read">
      <PageContainer className="bg-dashboard-bg min-h-screen">
        <div className="space-y-12">
          <section>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-dashboard-primary mb-3">Domains Dashboard</h1>
              <h2 className="text-xl font-semibold text-dashboard-secondary mb-4">Domain Overview</h2>
              <p className="text-dashboard-text-muted text-base leading-relaxed">
                Get a high-level view of your learning domains' content and performance metrics.
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
    </PermissionGuard>
  );
}