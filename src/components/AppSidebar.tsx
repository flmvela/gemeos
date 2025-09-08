import { Calendar, Settings, Users, BookOpen, Music, GraduationCap, ChevronRight, Upload, Building2, Shield, Home, FileText, Target, Brain, Monitor, UserCheck, Globe, Plus, Menu, X } from "lucide-react"
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
  SidebarHeader,
  SidebarFooter,
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
  const { state, toggleSidebar } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const [isAdminExpanded, setIsAdminExpanded] = useState(
    currentPath.startsWith('/teacher/administration')
  )
  const [isPagesExpanded, setIsPagesExpanded] = useState(false)
  
  // Collapsible state for admin sections
  const [isAdminManagementExpanded, setIsAdminManagementExpanded] = useState(
    currentPath.startsWith('/admin/dashboard') || 
    currentPath.startsWith('/admin/tenants') || 
    currentPath.startsWith('/admin/teachers') || 
    currentPath.startsWith('/admin/students')
  )
  const [isDomainAdminExpanded, setIsDomainAdminExpanded] = useState(
    currentPath.startsWith('/admin/domains')
  )
  const [isSystemExpanded, setIsSystemExpanded] = useState(
    currentPath.startsWith('/admin/rbac') || 
    currentPath.startsWith('/admin/access-management') ||
    currentPath.startsWith('/admin/ai-training') ||
    currentPath.startsWith('/admin/settings') ||
    currentPath.startsWith('/admin/upload')
  )
  const [isAuthPagesExpanded, setIsAuthPagesExpanded] = useState(false)
  const [isDevelopmentExpanded, setIsDevelopmentExpanded] = useState(false)
  
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
      className="bg-[#1a1b3a] border-r border-gray-700"
    >
      {/* Header with Logo and Toggle */}
      <SidebarHeader className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <div className="w-8 h-8 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] rounded-lg flex items-center justify-center text-sm font-bold text-white">
              G
            </div>
            <span className="font-semibold text-white group-data-[collapsible=icon]:hidden">Gemeos</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-lg hover:bg-gray-700 transition-colors text-white group-data-[collapsible=icon]:hidden"
          >
            {state === 'expanded' ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#1a1b3a]">
        {/* Dashboard - Admin Only */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400 text-xs font-semibold uppercase tracking-wider group-data-[collapsible=icon]:hidden">Dashboard</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {dashboardItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) => 
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-white ${
                            isActive 
                              ? 'bg-[#2d2e5f] text-white font-medium' 
                              : 'hover:bg-gray-700'
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsAdminManagementExpanded(!isAdminManagementExpanded)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer text-white w-full justify-between bg-white/5 border border-white/20"
                    tooltip="Admin & Management"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">Admin & Management</span>
                    </div>
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden ${isAdminManagementExpanded ? 'rotate-90' : ''}`} 
                    />
                  </SidebarMenuButton>
                  {isAdminManagementExpanded && (
                    <SidebarMenuSub className="ml-0 mt-2 space-y-1 border-l-0">
                      {adminDashboardManagementItems
                        .filter(item => isValidPage(item.url))
                        .map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink 
                                to={item.url} 
                                className={({ isActive }) => 
                                  `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                                    isActive 
                                      ? 'bg-[#2d2e5f] text-white font-medium' 
                                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                  }`
                                }
                              >
                                <item.icon className="h-4 w-4" />
                                <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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

        {/* Domain Management - Admin Only */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsDomainAdminExpanded(!isDomainAdminExpanded)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer text-white w-full justify-between bg-white/5 border border-white/20"
                    tooltip="Domain Administration"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">Domain Administration</span>
                    </div>
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden ${isDomainAdminExpanded ? 'rotate-90' : ''}`} 
                    />
                  </SidebarMenuButton>
                  {isDomainAdminExpanded && (
                    <SidebarMenuSub className="ml-0 mt-2 space-y-1 border-l-0">
                      {domainManagementItems
                        .filter(item => isValidPage(item.url))
                        .map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink 
                                to={item.url} 
                                className={({ isActive }) => 
                                  `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                                    isActive 
                                      ? 'bg-[#2d2e5f] text-white font-medium' 
                                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                  }`
                                }
                              >
                                <item.icon className="h-4 w-4" />
                                <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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

        {/* System - Admin Only */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsSystemExpanded(!isSystemExpanded)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer text-white w-full justify-between bg-white/5 border border-white/20"
                    tooltip="System"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">System</span>
                    </div>
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden ${isSystemExpanded ? 'rotate-90' : ''}`} 
                    />
                  </SidebarMenuButton>
                  {isSystemExpanded && (
                    <SidebarMenuSub className="ml-0 mt-2 space-y-1 border-l-0">
                      {systemItems
                        .filter(item => isValidPage(item.url))
                        .map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink 
                                to={item.url} 
                                className={({ isActive }) => 
                                  `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                                    isActive 
                                      ? 'bg-[#2d2e5f] text-white font-medium' 
                                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                  }`
                                }
                              >
                                <item.icon className="h-4 w-4" />
                                <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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

        {/* Teacher Navigation */}
        {!isAdmin && filteredNavigationItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400 text-xs font-semibold uppercase tracking-wider group-data-[collapsible=icon]:hidden">Teaching Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredNavigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) => 
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-white ${
                            isActive 
                              ? 'bg-[#2d2e5f] text-white font-medium' 
                              : 'hover:bg-gray-700'
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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
            <SidebarGroupLabel className="text-gray-400 text-xs font-semibold uppercase tracking-wider group-data-[collapsible=icon]:hidden">Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsAdminExpanded(!isAdminExpanded)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer text-white w-full justify-between"
                    tooltip="Administration"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">Administration</span>
                    </div>
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden ${isAdminExpanded ? 'rotate-90' : ''}`} 
                    />
                  </SidebarMenuButton>
                  {isAdminExpanded && (
                    <SidebarMenuSub className="ml-8 mt-1 space-y-1 border-l-0">
                      {filteredAdministrationItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild>
                            <NavLink 
                              to={item.url} 
                              className={({ isActive }) => 
                                `flex items-center gap-2 px-3 py-1 text-sm transition-colors ${
                                  isActive 
                                    ? 'text-white font-medium' 
                                    : 'text-gray-300 hover:text-white'
                                }`
                              }
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
            <SidebarGroupLabel className="text-gray-400 text-xs font-semibold uppercase tracking-wider group-data-[collapsible=icon]:hidden">Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {canAccess('/admin/upload') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="File Upload">
                      <NavLink 
                        to="/admin/upload" 
                        className={({ isActive }) => 
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-white ${
                            isActive 
                              ? 'bg-[#2d2e5f] text-white font-medium' 
                              : 'hover:bg-gray-700'
                          }`
                        }
                      >
                        <Upload className="h-4 w-4" />
                        <span className="group-data-[collapsible=icon]:hidden">File Upload</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {canAccess('/admin/page-permissions') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Page Permissions">
                      <NavLink 
                        to="/admin/page-permissions" 
                        className={({ isActive }) => 
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-white ${
                            isActive 
                              ? 'bg-[#2d2e5f] text-white font-medium' 
                              : 'hover:bg-gray-700'
                          }`
                        }
                      >
                        <Settings className="h-4 w-4" />
                        <span className="group-data-[collapsible=icon]:hidden">Page Permissions</span>
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
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsAuthPagesExpanded(!isAuthPagesExpanded)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer text-white w-full justify-between bg-white/5 border border-white/20"
                    tooltip="Authentication"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">Authentication</span>
                    </div>
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden ${isAuthPagesExpanded ? 'rotate-90' : ''}`} 
                    />
                  </SidebarMenuButton>
                  {isAuthPagesExpanded && (
                    <SidebarMenuSub className="ml-0 mt-2 space-y-1 border-l-0">
                      {authPagesItems
                        .filter(item => isValidPage(item.url))
                        .map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink 
                                to={item.url} 
                                className={({ isActive }) => 
                                  `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                                    isActive 
                                      ? 'bg-[#2d2e5f] text-white font-medium' 
                                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                  }`
                                }
                              >
                                <item.icon className="h-4 w-4" />
                                <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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

        {/* Development Tools - Admin Only */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsDevelopmentExpanded(!isDevelopmentExpanded)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer text-white w-full justify-between bg-white/5 border border-white/20"
                    tooltip="Development"
                  >
                    <div className="flex items-center gap-3">
                      <Monitor className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">Development</span>
                    </div>
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden ${isDevelopmentExpanded ? 'rotate-90' : ''}`} 
                    />
                  </SidebarMenuButton>
                  {isDevelopmentExpanded && (
                    <SidebarMenuSub className="ml-0 mt-2 space-y-1 border-l-0">
                      {developmentItems
                        .filter(item => isValidPage(item.url))
                        .map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink 
                                to={item.url} 
                                className={({ isActive }) => 
                                  `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                                    isActive 
                                      ? 'bg-[#2d2e5f] text-white font-medium' 
                                      : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                  }`
                                }
                              >
                                <item.icon className="h-4 w-4" />
                                <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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

        {/* Quick Access Section - Non-Admin Users */}
        {!isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400 text-xs font-semibold uppercase tracking-wider group-data-[collapsible=icon]:hidden">Quick Access</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {quickAccessPages
                  .filter(page => isValidQuickPage(page.url))
                  .map((page) => (
                    <SidebarMenuItem key={page.title}>
                      <SidebarMenuButton asChild tooltip={page.title}>
                        <NavLink 
                          to={page.url} 
                          className={({ isActive }) => 
                            `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-white ${
                              isActive 
                                ? 'bg-[#2d2e5f] text-white font-medium' 
                                : 'hover:bg-gray-700'
                            }`
                          }
                        >
                          <page.icon className="h-4 w-4" />
                          <span className="group-data-[collapsible=icon]:hidden">{page.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Usage Stats Footer - Admin Only */}
      {isAdmin && (
        <SidebarFooter className="p-4 border-t border-gray-700 bg-[#1a1b3a] group-data-[collapsible=icon]:hidden">
          <div className="text-sm text-gray-400 mb-2">Students</div>
          <div className="text-lg font-semibold text-white">289/500</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] h-2 rounded-full" style={{width: '57.8%'}}></div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}