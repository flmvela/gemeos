import { TenantAdminDashboardNew } from "@/components/tenant-admin/TenantAdminDashboardNew";

export default function TeacherDashboard() {
  // SEO: title and meta
  if (typeof document !== 'undefined') {
    document.title = "Teacher Dashboard | Gemeos";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Teacher dashboard for managing your classes and students with AI-powered tools.';
      document.head.appendChild(m);
    } else {
      metaDesc.setAttribute('content', 'Teacher dashboard for managing your classes and students with AI-powered tools.');
    }
    const canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', window.location.origin + '/teacher/dashboard');
      document.head.appendChild(link);
    } else {
      canonical.setAttribute('href', window.location.origin + '/teacher/dashboard');
    }
  }

  // Using the same dashboard component as admin/dashboard
  return <TenantAdminDashboardNew />;
}

export { TeacherDashboard };