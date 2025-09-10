import { TenantAdminDashboardNew } from "@/components/tenant-admin/TenantAdminDashboardNew";

export default function AdminDashboard() {
  // SEO: title and meta
  if (typeof document !== 'undefined') {
    document.title = "Admin Dashboard | Gemeos";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Admin dashboard for managing your academy with AI-powered tools.';
      document.head.appendChild(m);
    } else {
      metaDesc.setAttribute('content', 'Admin dashboard for managing your academy with AI-powered tools.');
    }
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', window.location.origin + '/tenant/dashboard');
      document.head.appendChild(link);
    } else {
      canonical.setAttribute('href', window.location.origin + '/tenant/dashboard');
    }
  }

  // TODO: Add proper permissions for tenant_admin role
  // For now, bypass PermissionGuard since RouteProtection already checks roles
  return <TenantAdminDashboardNew />;
}