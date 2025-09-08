import { TenantAdminDashboardNew } from "@/components/tenant-admin/TenantAdminDashboardNew";
import { PermissionGuard } from "@/components/PermissionGuard";

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
      link.setAttribute('href', window.location.origin + '/admin/dashboard');
      document.head.appendChild(link);
    } else {
      canonical.setAttribute('href', window.location.origin + '/admin/dashboard');
    }
  }

  return (
    <PermissionGuard resource="page:dashboard" action="read">
      <TenantAdminDashboardNew />
    </PermissionGuard>
  );
}