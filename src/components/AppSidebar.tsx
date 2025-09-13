import { Calendar, Settings, Users, BookOpen, Music, GraduationCap, ChevronRight, Upload, Building2, Shield, Home, FileText, Target, Brain, Monitor, UserCheck, Globe, Plus, Menu, X, School, UserCog, Lightbulb, Trophy } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
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
    title: "Platform Admin Dashboard",
    url: "/admin/dashboard",
    icon: Monitor,
  },
  {
    title: "Tenant Dashboard",
    url: "/tenant/dashboard",
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

// Dashboard items - all dashboards consolidated
const dashboardItems = [
  { title: "Platform Admin Dashboard", url: "/admin/dashboard", icon: Monitor },
  { title: "Tenant Dashboard", url: "/tenant/dashboard", icon: Calendar },
  { title: "Teacher Dashboard", url: "/teacher/dashboard", icon: GraduationCap },
  { title: "Student Dashboard", url: "/student/dashboard", icon: Users },
]

const adminDashboardManagementItems = [
  { title: "Tenants", url: "/admin/tenants", icon: Building2 },
  { title: "Teachers", url: "/admin/teachers", icon: Users },
  { title: "Classes", url: "/teacher/classes/create", icon: BookOpen },
  { title: "Students", url: "/admin/students", icon: GraduationCap },
]

const domainManagementItems = [
  { title: "Domain Administration", url: "/admin/domains/dashboard", icon: Settings },
  { title: "Learning Goals", url: "/admin/domains/jazz-music/goals", icon: Target },
  { title: "Review AI", url: "/admin/domains/jazz-music/review-ai", icon: Lightbulb },
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

// Teacher Area items - aligned with RBAC permissions
const teacherAreaItems = [
  { title: "Teacher Dashboard", url: "/teacher/dashboard", icon: School },
  { title: "Students", url: "/teacher/students", icon: Users },
  { title: "Domain Selection", url: "/teacher/domain-selection", icon: Globe },
  { title: "Class Creation", url: "/teacher/classes/create", icon: BookOpen },
  { title: "Curriculum Setup", url: "/teacher/settings/curriculum-setup", icon: GraduationCap },
  { title: "Learning Goals", url: "/teacher/administration/learning-goals", icon: Trophy },
  { title: "Review AI", url: "/teacher/review-ai", icon: Lightbulb },
]

// Tenant Admin items - aligned with RBAC permissions
const tenantAdminItems = [
  { title: "Tenant Dashboard", url: "/tenant/dashboard", icon: Calendar },
  { title: "Teacher Management", url: "/tenant/teachers", icon: Users },
  { title: "Student Management", url: "/tenant/students", icon: GraduationCap },
  { title: "Class Management", url: "/tenant/classes", icon: BookOpen },
  { title: "Domain Management", url: "/admin/domains/dashboard", icon: Globe },
  { title: "Review AI", url: "/admin/domains/jazz-music/review-ai", icon: Lightbulb },
  { title: "Access Management", url: "/admin/access-management", icon: Shield },
  { title: "Curriculum Setup", url: "/teacher/settings/curriculum-setup", icon: GraduationCap },
  { title: "Reports", url: "/tenant/reports", icon: FileText },
  { title: "Settings", url: "/tenant/settings", icon: Settings },
]

const quickAccessPages = [
  { title: "Welcome Page", url: "/welcome", icon: Home },
  { title: "Auth Page", url: "/auth", icon: Users },
  { title: "Unauthorized", url: "/unauthorized", icon: Shield },
]

// Flyout Panel Component
interface FlyoutItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

const FlyoutPanel = ({ 
  items, 
  title, 
  icon: Icon, 
  isVisible, 
  onMouseEnter, 
  onMouseLeave,
  isValidPage,
  skipFilter = false
}: {
  items: FlyoutItem[]
  title: string
  icon: React.ComponentType<{ className?: string }>
  isVisible: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  isValidPage?: (url: string) => boolean
  skipFilter?: boolean
}) => {
  if (!isVisible) return null

  return (
    <div 
      className="absolute left-full ml-2 top-0 z-50 min-w-[240px] max-w-[280px] bg-[#1a1b3a] border border-gray-700 rounded-lg shadow-xl opacity-100 visible transition-all duration-200 ease-out transform origin-left"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Flyout Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 text-white font-medium">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>
      
      {/* Flyout Items */}
      <div className="py-2">
        {items
          .filter(item => skipFilter || !isValidPage || isValidPage(item.url))
          .map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  isActive 
                    ? 'bg-white/15 text-white font-medium' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
      </div>
    </div>
  )
}

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const [isAdminExpanded, setIsAdminExpanded] = useState(
    currentPath.startsWith('/teacher/administration')
  )
  const [isPagesExpanded, setIsPagesExpanded] = useState(false)
  
  // Collapsible state for admin sections
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(
    currentPath.startsWith('/admin/dashboard') ||
    currentPath.startsWith('/tenant/dashboard') ||
    currentPath.startsWith('/teacher/dashboard') ||
    currentPath.startsWith('/student/dashboard')
  )
  const [isAdminManagementExpanded, setIsAdminManagementExpanded] = useState(
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
  // Get auth info first
  const { data: accessiblePaths = [] } = useUserAccessiblePaths()
  const { isPlatformAdmin, isTenantAdmin, isTeacher } = useAuth()
  
  const [isAuthPagesExpanded, setIsAuthPagesExpanded] = useState(false)
  const [isDevelopmentExpanded, setIsDevelopmentExpanded] = useState(false)
  const [isTeacherAreaExpanded, setIsTeacherAreaExpanded] = useState(
    currentPath.startsWith('/teacher/') || isTeacher || isTenantAdmin
  )
  
  // Flyout state management for collapsed sidebar
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null)
  const flyoutTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
  
  // Check if user is platform admin
  const isAdmin = isPlatformAdmin
  
  // Development mode flag (set to false in production)
  const isDevelopmentMode = false

  // Flyout management functions
  const handleFlyoutMouseEnter = (sectionKey: string) => {
    if (state === 'collapsed') {
      // Clear any existing timeout for this section
      if (flyoutTimeouts.current[sectionKey]) {
        clearTimeout(flyoutTimeouts.current[sectionKey])
      }
      // Set timeout to show flyout after 150ms delay
      flyoutTimeouts.current[sectionKey] = setTimeout(() => {
        setActiveFlyout(sectionKey)
      }, 150)
    }
  }

  const handleFlyoutMouseLeave = (sectionKey: string) => {
    if (state === 'collapsed') {
      // Clear the timeout
      if (flyoutTimeouts.current[sectionKey]) {
        clearTimeout(flyoutTimeouts.current[sectionKey])
        delete flyoutTimeouts.current[sectionKey]
      }
      // Hide flyout after a brief delay to allow mouse movement to flyout panel
      setTimeout(() => {
        setActiveFlyout(prev => prev === sectionKey ? null : prev)
      }, 100)
    }
  }

  const handleFlyoutClick = (sectionKey: string) => {
    if (state === 'collapsed') {
      setActiveFlyout(prev => prev === sectionKey ? null : sectionKey)
    }
  }

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(flyoutTimeouts.current).forEach(timeout => {
        clearTimeout(timeout)
      })
    }
  }, [])

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
        {/* Dashboard - Show appropriate dashboard based on user role */}
        {(isAdmin || isTenantAdmin) && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <div 
                    className="relative"
                    onMouseEnter={() => handleFlyoutMouseEnter('dashboards')}
                    onMouseLeave={() => handleFlyoutMouseLeave('dashboards')}
                  >
                    <SidebarMenuButton
                      onClick={() => {
                        if (state === 'collapsed') {
                          handleFlyoutClick('dashboards')
                        } else {
                          setIsDashboardExpanded(!isDashboardExpanded)
                        }
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer text-white w-full justify-between bg-white/5 border border-white/20"
                      tooltip="Dashboard"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4" />
                        <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                      </div>
                      <ChevronRight 
                        className={`h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden ${isDashboardExpanded ? 'rotate-90' : ''}`} 
                      />
                    </SidebarMenuButton>
                    
                    {/* Regular expanded submenu */}
                    {state !== 'collapsed' && isDashboardExpanded && (
                      <SidebarMenuSub className="ml-0 mt-2 space-y-1 border-l-0">
                        {(isAdmin ? dashboardItems : [{ title: "Tenant Dashboard", url: "/tenant/dashboard", icon: Calendar }])
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
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                      </SidebarMenuSub>
                    )}
                    
                    {/* Flyout panel for collapsed state */}
                    <FlyoutPanel
                      items={isAdmin ? dashboardItems : [{ title: "Tenant Dashboard", url: "/tenant/dashboard", icon: Calendar }]}
                      title="Dashboard"
                      icon={Calendar}
                      isVisible={state === 'collapsed' && activeFlyout === 'dashboards'}
                      onMouseEnter={() => handleFlyoutMouseEnter('dashboards')}
                      onMouseLeave={() => handleFlyoutMouseLeave('dashboards')}
                      isValidPage={isValidPage}
                    />
                  </div>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Tenant Management - For Tenant Admins */}
        {isTenantAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <div 
                    className="relative"
                    onMouseEnter={() => handleFlyoutMouseEnter('tenant-management')}
                    onMouseLeave={() => handleFlyoutMouseLeave('tenant-management')}
                  >
                    <SidebarMenuButton
                      onClick={() => {
                        if (state === 'collapsed') {
                          handleFlyoutClick('tenant-management')
                        } else {
                          setIsAdminManagementExpanded(!isAdminManagementExpanded)
                        }
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer text-white w-full justify-between bg-white/5 border border-white/20"
                      tooltip="Tenant Management"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4" />
                        <span className="group-data-[collapsible=icon]:hidden">Tenant Management</span>
                      </div>
                      <ChevronRight 
                        className={`h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden ${isAdminManagementExpanded ? 'rotate-90' : ''}`} 
                      />
                    </SidebarMenuButton>
                    
                    {/* Regular expanded submenu */}
                    {state !== 'collapsed' && isAdminManagementExpanded && (
                      <SidebarMenuSub className="ml-0 mt-2 space-y-1 border-l-0">
                        {tenantAdminItems
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
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                      </SidebarMenuSub>
                    )}
                    
                    {/* Flyout panel for collapsed state */}
                    <FlyoutPanel
                      items={tenantAdminItems}
                      title="Tenant Management"
                      icon={Building2}
                      isVisible={state === 'collapsed' && activeFlyout === 'tenant-management'}
                      onMouseEnter={() => handleFlyoutMouseEnter('tenant-management')}
                      onMouseLeave={() => handleFlyoutMouseLeave('tenant-management')}
                      skipFilter={true}
                    />
                  </div>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Teacher Dashboard - For Teachers only (not tenant admins) */}
        {isTeacher && !isTenantAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Teacher Dashboard">
                    <NavLink 
                      to="/teacher/dashboard" 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-white ${
                          isActive 
                            ? 'bg-[#2d2e5f] text-white font-medium' 
                            : 'hover:bg-gray-700'
                        }`
                      }
                    >
                      <GraduationCap className="h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">Teacher Dashboard</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Teacher Area - For Teachers and Tenant Admins */}
        {(isTeacher || isTenantAdmin) && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <div 
                    className="relative"
                    onMouseEnter={() => handleFlyoutMouseEnter('teacher-area')}
                    onMouseLeave={() => handleFlyoutMouseLeave('teacher-area')}
                  >
                    <SidebarMenuButton
                      onClick={() => {
                        if (state === 'collapsed') {
                          handleFlyoutClick('teacher-area')
                        } else {
                          setIsTeacherAreaExpanded(!isTeacherAreaExpanded)
                        }
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer text-white w-full justify-between bg-white/5 border border-white/20"
                      tooltip="Teacher Area"
                    >
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-4 w-4" />
                        <span className="group-data-[collapsible=icon]:hidden">Teacher Area</span>
                      </div>
                      <ChevronRight 
                        className={`h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden ${isTeacherAreaExpanded ? 'rotate-90' : ''}`} 
                      />
                    </SidebarMenuButton>
                    
                    {/* Regular expanded submenu */}
                    {state !== 'collapsed' && isTeacherAreaExpanded && (
                      <SidebarMenuSub className="ml-0 mt-2 space-y-1 border-l-0">
                        {teacherAreaItems
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
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                      </SidebarMenuSub>
                    )}
                    
                    {/* Flyout panel for collapsed state */}
                    <FlyoutPanel
                      items={teacherAreaItems}
                      title="Teacher Area"
                      icon={GraduationCap}
                      isVisible={state === 'collapsed' && activeFlyout === 'teacher-area'}
                      onMouseEnter={() => handleFlyoutMouseEnter('teacher-area')}
                      onMouseLeave={() => handleFlyoutMouseLeave('teacher-area')}
                      skipFilter={true}
                    />
                  </div>
                </SidebarMenuItem>
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
                  <div 
                    className="relative"
                    onMouseEnter={() => handleFlyoutMouseEnter('admin-management')}
                    onMouseLeave={() => handleFlyoutMouseLeave('admin-management')}
                  >
                    <SidebarMenuButton
                      onClick={() => {
                        if (state === 'collapsed') {
                          handleFlyoutClick('admin-management')
                        } else {
                          setIsAdminManagementExpanded(!isAdminManagementExpanded)
                        }
                      }}
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
                    
                    {/* Regular expanded submenu */}
                    {state !== 'collapsed' && isAdminManagementExpanded && (
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
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                      </SidebarMenuSub>
                    )}
                    
                    {/* Flyout panel for collapsed state */}
                    <FlyoutPanel
                      items={adminDashboardManagementItems}
                      title="Admin & Management"
                      icon={Settings}
                      isVisible={state === 'collapsed' && activeFlyout === 'admin-management'}
                      onMouseEnter={() => handleFlyoutMouseEnter('admin-management')}
                      onMouseLeave={() => handleFlyoutMouseLeave('admin-management')}
                      isValidPage={isValidPage}
                    />
                  </div>
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
                  <div 
                    className="relative"
                    onMouseEnter={() => handleFlyoutMouseEnter('domain-admin')}
                    onMouseLeave={() => handleFlyoutMouseLeave('domain-admin')}
                  >
                    <SidebarMenuButton
                      onClick={() => {
                        if (state === 'collapsed') {
                          handleFlyoutClick('domain-admin')
                        } else {
                          setIsDomainAdminExpanded(!isDomainAdminExpanded)
                        }
                      }}
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
                    
                    {/* Regular expanded submenu */}
                    {state !== 'collapsed' && isDomainAdminExpanded && (
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
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                      </SidebarMenuSub>
                    )}
                    
                    {/* Flyout panel for collapsed state */}
                    <FlyoutPanel
                      items={domainManagementItems}
                      title="Domain Administration"
                      icon={BookOpen}
                      isVisible={state === 'collapsed' && activeFlyout === 'domain-admin'}
                      onMouseEnter={() => handleFlyoutMouseEnter('domain-admin')}
                      onMouseLeave={() => handleFlyoutMouseLeave('domain-admin')}
                      isValidPage={isValidPage}
                    />
                  </div>
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
                  <div 
                    className="relative"
                    onMouseEnter={() => handleFlyoutMouseEnter('system')}
                    onMouseLeave={() => handleFlyoutMouseLeave('system')}
                  >
                    <SidebarMenuButton
                      onClick={() => {
                        if (state === 'collapsed') {
                          handleFlyoutClick('system')
                        } else {
                          setIsSystemExpanded(!isSystemExpanded)
                        }
                      }}
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
                    
                    {/* Regular expanded submenu */}
                    {state !== 'collapsed' && isSystemExpanded && (
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
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                      </SidebarMenuSub>
                    )}
                    
                    {/* Flyout panel for collapsed state */}
                    <FlyoutPanel
                      items={systemItems}
                      title="System"
                      icon={Settings}
                      isVisible={state === 'collapsed' && activeFlyout === 'system'}
                      onMouseEnter={() => handleFlyoutMouseEnter('system')}
                      onMouseLeave={() => handleFlyoutMouseLeave('system')}
                      isValidPage={isValidPage}
                    />
                  </div>
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
                  <div 
                    className="relative"
                    onMouseEnter={() => handleFlyoutMouseEnter('authentication')}
                    onMouseLeave={() => handleFlyoutMouseLeave('authentication')}
                  >
                    <SidebarMenuButton
                      onClick={() => {
                        if (state === 'collapsed') {
                          handleFlyoutClick('authentication')
                        } else {
                          setIsAuthPagesExpanded(!isAuthPagesExpanded)
                        }
                      }}
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
                    
                    {/* Regular expanded submenu */}
                    {state !== 'collapsed' && isAuthPagesExpanded && (
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
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                      </SidebarMenuSub>
                    )}
                    
                    {/* Flyout panel for collapsed state */}
                    <FlyoutPanel
                      items={authPagesItems}
                      title="Authentication"
                      icon={Shield}
                      isVisible={state === 'collapsed' && activeFlyout === 'authentication'}
                      onMouseEnter={() => handleFlyoutMouseEnter('authentication')}
                      onMouseLeave={() => handleFlyoutMouseLeave('authentication')}
                      isValidPage={isValidPage}
                    />
                  </div>
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
                  <div 
                    className="relative"
                    onMouseEnter={() => handleFlyoutMouseEnter('development')}
                    onMouseLeave={() => handleFlyoutMouseLeave('development')}
                  >
                    <SidebarMenuButton
                      onClick={() => {
                        if (state === 'collapsed') {
                          handleFlyoutClick('development')
                        } else {
                          setIsDevelopmentExpanded(!isDevelopmentExpanded)
                        }
                      }}
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
                    
                    {/* Regular expanded submenu */}
                    {state !== 'collapsed' && isDevelopmentExpanded && (
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
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                      </SidebarMenuSub>
                    )}
                    
                    {/* Flyout panel for collapsed state */}
                    <FlyoutPanel
                      items={developmentItems}
                      title="Development"
                      icon={Monitor}
                      isVisible={state === 'collapsed' && activeFlyout === 'development'}
                      onMouseEnter={() => handleFlyoutMouseEnter('development')}
                      onMouseLeave={() => handleFlyoutMouseLeave('development')}
                      isValidPage={isValidPage}
                    />
                  </div>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Quick Access Section - Only for admins and development */}
        {(isAdmin || isDevelopmentMode) && (
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