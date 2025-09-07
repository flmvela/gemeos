import { Calendar, Settings, Users, BookOpen, Music, GraduationCap, ChevronRight, Upload, Building2, Shield, Home, FileText, Target, Brain, Monitor, UserCheck, Globe, Plus } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useState } from "react"
import { useUserAccessiblePaths } from "@/hooks/usePagePermissions"
import { useAuth } from "@/hooks/useAuth"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const navigationItems = [
  {
    title: "Dashboard",
    url: "/teacher/dashboard",
    icon: Calendar,
  },
  {
    title: "Domain Selection",
    url: "/teacher/domain-selection", 
    icon: BookOpen,
  },
  {
    title: "Create Class",
    url: "/teacher/classes/create",
    icon: Plus,
  },
  {
    title: "Curriculum Setup",
    url: "/teacher/settings/curriculum-setup",
    icon: GraduationCap,
  },
]

const administrationItems = [
  {
    title: "Overview",
    url: "/teacher/administration",
    icon: Settings,
  },
  {
    title: "Domain Management", 
    url: "/teacher/administration/domains",
    icon: BookOpen,
  },
  {
    title: "Learning Goals", 
    url: "/teacher/administration/learning-goals",
    icon: Target,
  },
]

const adminItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: Calendar,
  },
  {
    title: "Learning Domains",
    url: "/admin/learning-domains",
    icon: BookOpen,
  },
  {
    title: "Clients",
    url: "/admin/clients",
    icon: Building2,
  },
  {
    title: "AI Training",
    url: "/admin/ai-training",
    icon: Brain,
  },
  {
    title: "Design System",
    url: "/admin/design-system",
    icon: Monitor,
  },
]

// Comprehensive admin navigation based on UX analysis
const dashboardItems = [
  { title: "Admin Dashboard", url: "/admin/dashboard", icon: Monitor },
]

const adminDashboardManagementItems = [
  { title: "Admin Dashboard", url: "/admin/dashboard", icon: Monitor },
  { title: "Tenants", url: "/admin/tenants", icon: Building2 },
  { title: "Teachers", url: "/admin/teachers", icon: Users },
  { title: "Classes", url: "/teacher/classes/create", icon: BookOpen },
  { title: "Students", url: "/admin/students", icon: GraduationCap },
]

const domainManagementItems = [
  { title: "Domain Administration", url: "/admin/domains/dashboard", icon: Settings },
  { title: "Learning Goals", url: "/admin/domains/jazz-music/goals", icon: Target },
  { title: "AI Guidance", url: "/admin/domains/jazz-music/ai-guidance", icon: Brain },
  { title: "Guidance Editor", url: "/admin/domains/jazz-music/ai-guidance/content", icon: FileText },
  { title: "Examples", url: "/admin/domains/jazz-music/ai-guidance/content/examples/new", icon: Plus },
]

const systemItems = [
  { title: "Access control", url: "/admin/rbac-management", icon: UserCheck },
  { title: "Access Management", url: "/admin/access-management", icon: Shield },
  { title: "AI Settings", url: "/admin/ai-training", icon: Brain },
  { title: "Feedback Settings", url: "/admin/settings/feedback", icon: Brain },
  { title: "File Upload", url: "/admin/upload", icon: Upload },
]

const authPagesItems = [
  { title: "Login", url: "/login", icon: Users },
  { title: "Register", url: "/register", icon: UserCheck },
  { title: "Forgot Password", url: "/forgot-password", icon: Shield },
]

const developmentItems = [
  { title: "Domain Card Demo", url: "/admin/domain-admin-demo", icon: Monitor },
  { title: "Welcome Page", url: "/welcome", icon: Home },
  { title: "Auth Page", url: "/auth", icon: Users },
  { title: "Unauthorized", url: "/unauthorized", icon: Shield },
]

const quickAccessPages = [
  { title: "Welcome Page", url: "/welcome", icon: Home },
  { title: "Auth Page", url: "/auth", icon: Users },
  { title: "Unauthorized", url: "/unauthorized", icon: Shield },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const [isAdminExpanded, setIsAdminExpanded] = useState(
    currentPath.startsWith('/teacher/administration')
  )
  const [isPagesExpanded, setIsPagesExpanded] = useState(false)
  const { data: accessiblePaths = [] } = useUserAccessiblePaths()
  const { isPlatformAdmin } = useAuth()
  
  // Check if user is admin
  const isAdmin = isPlatformAdmin

  const isActive = (path: string) => currentPath === path
  const canAccess = (path: string) => {
    // Platform admin bypasses all permission checks
    if (isAdmin) return true
    return accessiblePaths.includes(path)
  }
  const getNavClassName = (path: string) =>
    isActive(path) 
      ? "bg-accent text-accent-foreground font-medium" 
      : "hover:bg-accent/50 hover:text-accent-foreground"

  // Filter navigation items based on user permissions and role
  const filteredNavigationItems = isAdmin ? [] : navigationItems.filter(item => canAccess(item.url))
  const filteredAdministrationItems = isAdmin ? [] : administrationItems.filter(item => canAccess(item.url))
  const filteredAdminItems = isAdmin ? adminItems.filter(item => canAccess(item.url)) : []

  const isValidPage = (url: string) => {
    // Platform admin has universal access
    if (isAdmin) return true
    
    // Filter out template URLs and check access for regular users
    if (url.includes(':') && !url.includes('472a6e02-8733-431a-bb76-5d517767cab7')) return false
    const alwaysVisible = ['/welcome', '/unauthorized', '/auth', '/login', '/register', '/forgot-password']
    return canAccess(url) || alwaysVisible.includes(url)
  }

  const isValidQuickPage = (url: string) => {
    // Platform admin has universal access
    if (isAdmin) return true
    
    const alwaysVisible = ['/welcome', '/unauthorized', '/auth']
    return canAccess(url) || alwaysVisible.includes(url)
  }

  return (
    <Sidebar
      collapsible="icon"
    >
      <SidebarContent>
        {/* Dashboard - Admin Only */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {dashboardItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink 
                        to={item.url} 
                        className={getNavClassName(item.url)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Dashboard & Management - Admin Only */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin & Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminDashboardManagementItems
                  .filter(item => isValidPage(item.url))
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <NavLink 
                          to={item.url} 
                          className={getNavClassName(item.url)}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Domain Management - Admin Only */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Domain Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {domainManagementItems
                  .filter(item => isValidPage(item.url))
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <NavLink 
                          to={item.url} 
                          className={getNavClassName(item.url)}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* System - Admin Only */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemItems
                  .filter(item => isValidPage(item.url))
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <NavLink 
                          to={item.url} 
                          className={getNavClassName(item.url)}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Teacher Navigation */}
        {!isAdmin && filteredNavigationItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Teaching Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredNavigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink 
                        to={item.url} 
                        className={getNavClassName(item.url)}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Teacher Administration Navigation - only show if user has access to any admin items */}
        {!isAdmin && filteredAdministrationItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsAdminExpanded(!isAdminExpanded)}
                    className="w-full justify-between"
                    tooltip="Administration"
                  >
                    <div className="flex items-center">
                      <Settings className="h-4 w-4" />
                      <span>Administration</span>
                    </div>
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform ${isAdminExpanded ? 'rotate-90' : ''}`} 
                    />
                  </SidebarMenuButton>
                  {isAdminExpanded && (
                    <SidebarMenuSub>
                      {filteredAdministrationItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild>
                            <NavLink 
                              to={item.url} 
                              className={getNavClassName(item.url)}
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Legacy Admin Section - for teacher role with admin access */}
        {!isAdmin && (canAccess('/admin/page-permissions') || canAccess('/admin/upload')) && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {canAccess('/admin/upload') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="File Upload">
                      <NavLink 
                        to="/admin/upload" 
                        className={getNavClassName('/admin/upload')}
                      >
                        <Upload className="h-4 w-4" />
                        <span>File Upload</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {canAccess('/admin/page-permissions') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Page Permissions">
                      <NavLink 
                        to="/admin/page-permissions" 
                        className={getNavClassName('/admin/page-permissions')}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Page Permissions</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Authentication Pages - Admin Only */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Authentication</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {authPagesItems
                  .filter(item => isValidPage(item.url))
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <NavLink 
                          to={item.url} 
                          className={getNavClassName(item.url)}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Development Tools - Admin Only */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Development</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {developmentItems
                  .filter(item => isValidPage(item.url))
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <NavLink 
                          to={item.url} 
                          className={getNavClassName(item.url)}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Quick Access Section - Non-Admin Users */}
        {!isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Quick Access</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {quickAccessPages
                  .filter(page => isValidQuickPage(page.url))
                  .map((page) => (
                    <SidebarMenuItem key={page.title}>
                      <SidebarMenuButton asChild tooltip={page.title}>
                        <NavLink 
                          to={page.url} 
                          className={getNavClassName(page.url)}
                        >
                          <page.icon className="h-4 w-4" />
                          <span>{page.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  )
}