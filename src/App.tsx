import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import TeacherDomainSelection from "./pages/TeacherDomainSelection";
import CurriculumSetup from "./pages/CurriculumSetup";
import TeacherDashboard from "./pages/TeacherDashboard";
import Administration from "./pages/Administration";
import DomainManagement from "./pages/DomainManagement";
import DomainDetail from "./pages/DomainDetail";
import DomainAIGuidance from "./pages/DomainAIGuidance";
import DomainGuidanceEditor from "./pages/DomainGuidanceEditor";
import DomainConcepts from "./pages/DomainConcepts";
import LearningGoalsPage from "./pages/LearningGoalsPage";
import AddExamplesPage from "./pages/AddExamplesPage";
import Clients from "./pages/Clients";
import AdminUpload from "./pages/AdminUpload";
import PagePermissions from "./pages/PagePermissions";
import FeedbackSettings from "./pages/FeedbackSettings";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import AdminAITraining from "./pages/AdminAITraining";
import ConceptDetailPage from "./pages/ConceptDetailPage";
import { PermissionManagement } from "./pages/admin/PermissionManagement";
import { RBACManagement } from "./pages/admin/RBACManagement";
import { TeacherLayout } from "./components/TeacherLayout";
import { RouteProtection } from "./components/auth/RouteProtection";
import { BreadcrumbProvider } from "./components/navigation/BreadcrumbProvider";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import AcceptInvitation from "./pages/AcceptInvitation";
import AdminDashboard from "./pages/AdminDashboard";
import PlatformAdminDashboard from "./pages/PlatformAdminDashboard";
import DomainsDashboard from "./pages/DomainsDashboard";
import DomainAdmin from "./pages/DomainAdmin";
import { TenantAdminPage } from "./pages/TenantAdmin";
import AccessManagement from "./pages/AccessManagement";
import { TenantManagement } from "./pages/TenantManagement";
import { TenantManagementSimple } from "./pages/TenantManagementSimple";
import { CreateTenantPage } from "./pages/CreateTenantPage";
import { EditTenantPage } from "./pages/EditTenantPage";
import { TenantDetailEditPage } from "./pages/TenantDetailEditPage";
import { CreateTeacherPage } from "./pages/CreateTeacherPage";
import ClassCreation from "./pages/ClassCreation";
import NoAccess from "./pages/NoAccess";
import TeacherSetupPassword from "./pages/TeacherSetupPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BreadcrumbProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/welcome-figma" element={<Navigate to="/welcome" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/accept-invite" element={<AcceptInvitation />} />
          <Route path="/teacher-setup" element={<TeacherSetupPassword />} />
          <Route path="/teacher/*" element={
            <TeacherLayout>
              <Routes>
                <Route path="dashboard" element={
                  <RouteProtection>
                    <TeacherDashboard />
                  </RouteProtection>
                } />
                <Route path="domain-selection" element={
                  <RouteProtection>
                    <TeacherDomainSelection />
                  </RouteProtection>
                } />
                <Route path="settings/curriculum-setup" element={
                  <RouteProtection>
                    <CurriculumSetup />
                  </RouteProtection>
                } />
                <Route path="classes/create" element={
                  <RouteProtection>
                    <ClassCreation />
                  </RouteProtection>
                } />
                <Route path="administration" element={
                  <RouteProtection>
                    <Administration />
                  </RouteProtection>
                } />
                <Route path="administration/domains" element={
                  <RouteProtection>
                    <DomainManagement />
                  </RouteProtection>
                } />
                <Route path="administration/learning-goals" element={
                  <RouteProtection>
                    <LearningGoalsPage />
                  </RouteProtection>
                } />
              </Routes>
            </TeacherLayout>
          } />
          <Route path="/admin/*" element={
            <TeacherLayout>
              <Routes>
                <Route index element={
                  <RouteProtection>
                    <Navigate to="/admin/dashboard" replace />
                  </RouteProtection>
                } />
                <Route path="teachers" element={
                  <RouteProtection>
                    <TenantAdminPage />
                  </RouteProtection>
                } />
                <Route path="domains" element={
                  <RouteProtection>
                    <TenantAdminPage />
                  </RouteProtection>
                } />
                <Route path="settings" element={
                  <RouteProtection>
                    <TenantAdminPage />
                  </RouteProtection>
                } />
                <Route path="invitations" element={
                  <RouteProtection>
                    <TenantAdminPage />
                  </RouteProtection>
                } />
                {/* Platform Admin Dashboard */}
                <Route path="dashboard" element={
                  <RouteProtection>
                    <PlatformAdminDashboard />
                  </RouteProtection>
                } />
                
                <Route path="domains/dashboard" element={
                  <RouteProtection>
                    <DomainsDashboard />
                  </RouteProtection>
                } />
                <Route path="domain/domain_old" element={
                  <RouteProtection>
                    <DomainDetail />
                  </RouteProtection>
                } />
                {/* New slug-based routes */}
                <Route path="domains/:slug" element={
                  <RouteProtection>
                    <DomainAdmin />
                  </RouteProtection>
                } />
                <Route path="domains/:slug/concepts" element={
                  <RouteProtection>
                    <DomainConcepts />
                  </RouteProtection>
                } />
                <Route path="domains/:slug/concepts/:conceptId" element={
                  <RouteProtection>
                    <ConceptDetailPage />
                  </RouteProtection>
                } />
                <Route path="domains/:slug/goals" element={
                    <RouteProtection>
                      <LearningGoalsPage />
                    </RouteProtection>
                  } />
                <Route path="domains/:slug/ai-guidance" element={
                  <RouteProtection>
                    <DomainAIGuidance />
                  </RouteProtection>
                } />
                <Route path="domains/:slug/ai-guidance/:area" element={
                  <RouteProtection>
                    <DomainGuidanceEditor />
                  </RouteProtection>
                } />
                <Route path="domains/:slug/ai-guidance/:area/examples/new" element={
                  <RouteProtection>
                    <AddExamplesPage />
                  </RouteProtection>
                } />
                
                {/* Legacy routes for backward compatibility */}
                <Route path="domain/:domainId" element={
                  <RouteProtection>
                    <DomainAdmin />
                  </RouteProtection>
                } />
                <Route path="domain/:domainSlug/concepts" element={
                  <RouteProtection>
                    <DomainConcepts />
                  </RouteProtection>
                } />
                <Route path="domain/:domainSlug/concepts/:conceptId" element={
                  <RouteProtection>
                    <ConceptDetailPage />
                  </RouteProtection>
                } />
                <Route path="domain/:domainId/goals" element={
                    <RouteProtection>
                      <LearningGoalsPage />
                    </RouteProtection>
                  } />
                <Route path="domain/:domainId/ai-guidance" element={
                  <RouteProtection>
                    <DomainAIGuidance />
                  </RouteProtection>
                } />
                <Route path="domain/:domainId/ai-guidance/:area" element={
                  <RouteProtection>
                    <DomainGuidanceEditor />
                  </RouteProtection>
                } />
                <Route path="domain/:domainId/ai-guidance/:area/examples/new" element={
                  <RouteProtection>
                    <AddExamplesPage />
                  </RouteProtection>
                } />
                <Route path="clients" element={
                  <RouteProtection>
                    <Clients />
                  </RouteProtection>
                } />
                <Route path="permissions" element={
                  <RouteProtection>
                    <PagePermissions />
                  </RouteProtection>
                } />
                <Route path="upload" element={
                  <RouteProtection>
                    <AdminUpload />
                  </RouteProtection>
                } />
                <Route path="page-permissions" element={
                  <RouteProtection>
                    <PagePermissions />
                  </RouteProtection>
                } />
                <Route path="ai-training" element={
                  <RouteProtection>
                    <AdminAITraining />
                  </RouteProtection>
                } />
                <Route path="settings/feedback" element={
                  <RouteProtection>
                    <FeedbackSettings />
                  </RouteProtection>
                } />
                <Route path="rbac-permissions" element={
                  <RouteProtection>
                    <PermissionManagement />
                  </RouteProtection>
                } />
                <Route path="permissions" element={
                  <RouteProtection>
                    <RBACManagement />
                  </RouteProtection>
                } />
                <Route path="rbac-management" element={
                  <RouteProtection>
                    <RBACManagement />
                  </RouteProtection>
                } />
                <Route path="access-management" element={
                  <RouteProtection>
                    <AccessManagement />
                  </RouteProtection>
                } />
                <Route path="tenants" element={
                  <RouteProtection>
                    <TenantManagementSimple />
                  </RouteProtection>
                } />
                <Route path="tenants/create" element={
                  <RouteProtection>
                    <CreateTenantPage />
                  </RouteProtection>
                } />
                <Route path="teacher/create" element={
                  <RouteProtection>
                    <CreateTeacherPage />
                  </RouteProtection>
                } />
                <Route path="tenants/:tenantId/edit" element={
                  <RouteProtection>
                    <EditTenantPage />
                  </RouteProtection>
                } />
                <Route path="tenants/:tenantId" element={
                  <RouteProtection>
                    <TenantDetailEditPage />
                  </RouteProtection>
                } />
              </Routes>
            </TeacherLayout>
          } />
          <Route path="/tenant/*" element={
            <TeacherLayout>
              <Routes>
                <Route path="dashboard" element={
                  <RouteProtection>
                    <AdminDashboard />
                  </RouteProtection>
                } />
                <Route path="teachers" element={
                  <RouteProtection>
                    <CreateTeacherPage />
                  </RouteProtection>
                } />
                <Route path="students" element={
                  <RouteProtection>
                    <div className="p-8">
                      <h1 className="text-2xl font-bold">Student Management</h1>
                      <p className="text-gray-600 mt-2">Manage students in your tenant</p>
                    </div>
                  </RouteProtection>
                } />
                <Route path="classes" element={
                  <RouteProtection>
                    <ClassCreation />
                  </RouteProtection>
                } />
                <Route path="reports" element={
                  <RouteProtection>
                    <div className="p-8">
                      <h1 className="text-2xl font-bold">Reports</h1>
                      <p className="text-gray-600 mt-2">View tenant reports and analytics</p>
                    </div>
                  </RouteProtection>
                } />
                <Route path="settings" element={
                  <RouteProtection>
                    <div className="p-8">
                      <h1 className="text-2xl font-bold">Tenant Settings</h1>
                      <p className="text-gray-600 mt-2">Configure tenant settings</p>
                    </div>
                  </RouteProtection>
                } />
              </Routes>
            </TeacherLayout>
          } />
          <Route path="/no-access" element={<NoAccess />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </BreadcrumbProvider>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
