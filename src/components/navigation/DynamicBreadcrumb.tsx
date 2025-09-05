import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { useBreadcrumb } from './BreadcrumbProvider';
import { useDomains } from '@/hooks/useDomains';
import { useConcepts } from '@/hooks/useConcepts';

export function DynamicBreadcrumb() {
  const location = useLocation();
  const { breadcrumbs, setBreadcrumbs } = useBreadcrumb();
  const { domains } = useDomains();
  
  // Extract domain ID for concept loading
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const domainId = pathSegments[0] === 'admin' && pathSegments[1] === 'domain' ? pathSegments[2] : '';
  const { concepts } = useConcepts(domainId);

  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const newBreadcrumbs = [];

    // Always start with Dashboard
    newBreadcrumbs.push({
      label: 'Dashboard',
      href: '/admin/dashboard',
    });

    // Handle admin routes
    if (pathSegments[0] === 'admin') {
      if (pathSegments[1] === 'learning-domains') {
        newBreadcrumbs.push({
          label: 'Learning Domains',
          href: '/admin/learning-domains',
        });
      } else if (pathSegments[1] === 'domain' && pathSegments[2]) {
        // Find domain name
        const domainId = pathSegments[2];
        const domain = domains.find(d => d.id === domainId);
        const domainName = domain?.name || 'Domain';

        newBreadcrumbs.push({
          label: domainName,
          href: `/admin/domain/${domainId}`,
        });

        // Handle section pages
        if (pathSegments[3]) {
          const sectionMap: Record<string, string> = {
            concepts: 'concepts',
            goals: 'goals', 
            exercises: 'exercises',
            upload: 'upload',
            'ai-guidance': 'ai-guidance',
            tasks: 'tasks',
            strategies: 'strategies',
          };

          const sectionName = sectionMap[pathSegments[3]] || pathSegments[3];
          newBreadcrumbs.push({
            label: sectionName,
            href: `/admin/domain/${domainId}/${pathSegments[3]}`,
          });
          
          // Handle concept detail pages: /admin/domain/{domainId}/concepts/{conceptId}
          if (pathSegments[3] === 'concepts' && pathSegments[4]) {
            const conceptId = pathSegments[4];
            const concept = concepts.find(c => c.id === conceptId);
            const conceptName = concept?.name || 'Concept';
            
            newBreadcrumbs.push({
              label: conceptName,
              href: `/admin/domain/${domainId}/concepts/${conceptId}`,
            });
          }
          
          // Handle AI guidance sub-pages: /admin/domain/{domainId}/ai-guidance/{area}
          else if (pathSegments[3] === 'ai-guidance' && pathSegments[4]) {
            const area = pathSegments[4];
            const areaName = area.charAt(0).toUpperCase() + area.slice(1).replace(/-/g, ' ');
            
            newBreadcrumbs.push({
              label: areaName,
              href: `/admin/domain/${domainId}/ai-guidance/${area}`,
            });
            
            // Handle examples pages: /admin/domain/{domainId}/ai-guidance/{area}/examples/new
            if (pathSegments[5] === 'examples' && pathSegments[6] === 'new') {
              newBreadcrumbs.push({
                label: 'Add Examples',
                href: `/admin/domain/${domainId}/ai-guidance/${area}/examples/new`,
              });
            }
          }
        }
      } else if (pathSegments[1] === 'upload') {
        // Handle /admin/upload route
        newBreadcrumbs.push({
          label: 'Learning Domains',
          href: '/admin/learning-domains',
        });

        // Check if there's a domain parameter in the URL
        const searchParams = new URLSearchParams(location.search);
        const domainParam = searchParams.get('domain');
        
        if (domainParam && domains.length > 0) {
          const domain = domains.find(d => d.id === domainParam);
          if (domain) {
            newBreadcrumbs.push({
              label: domain.name,
              href: `/admin/domain/${domainParam}`,
            });
          }
        }

        newBreadcrumbs.push({
          label: 'File Upload',
          href: '/admin/upload',
        });
      } else if (pathSegments[1] === 'clients') {
        newBreadcrumbs.push({
          label: 'Clients',
          href: '/admin/clients',
        });
      } else if (pathSegments[1] === 'permissions') {
        newBreadcrumbs.push({
          label: 'Permissions',
          href: '/admin/permissions',
        });
      }
    }

    // Mark the last item as active
    if (newBreadcrumbs.length > 0) {
      newBreadcrumbs[newBreadcrumbs.length - 1].isActive = true;
    }

    setBreadcrumbs(newBreadcrumbs);
  }, [location.pathname, location.search, domains, concepts, setBreadcrumbs]);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.isActive ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={item.href || '#'}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}