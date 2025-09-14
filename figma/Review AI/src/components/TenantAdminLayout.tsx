import React, { useState } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarInset,
  SidebarTrigger
} from './ui/sidebar';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  Home,
  Settings,
  Users,
  GraduationCap,
  BookOpen,
  UserPlus,
  UserCog,
  School,
  Crown,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

// Import page components
import { DashboardOverview } from './pages/DashboardOverview';
import { TenantSettings } from './pages/TenantSettings';
import { ManageTeachers } from './pages/ManageTeachers';
import { CreateTeacher } from './pages/CreateTeacher';
import { ManageClasses } from './pages/ManageClasses';

type MenuItem = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  page: string;
  items?: {
    title: string;
    page: string;
  }[];
};

const navigationItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: Home,
    page: 'dashboard'
  },
  {
    title: 'Settings & Setup',
    icon: Settings,
    page: 'settings',
    items: [
      { title: 'Tenant Configuration', page: 'tenant-config' },
      { title: 'Billing & Plans', page: 'billing' },
      { title: 'Domain Management', page: 'domains' }
    ]
  },
  {
    title: 'Teacher Management',
    icon: GraduationCap,
    page: 'teachers',
    items: [
      { title: 'View All Teachers', page: 'manage-teachers' },
      { title: 'Add New Teacher', page: 'create-teacher' },
      { title: 'Teacher Analytics', page: 'teacher-analytics' }
    ]
  },
  {
    title: 'Class Management',
    icon: School,
    page: 'classes',
    items: [
      { title: 'All Classes', page: 'manage-classes' },
      { title: 'Create Class', page: 'create-class' },
      { title: 'Class Schedules', page: 'schedules' }
    ]
  },
  {
    title: 'Student Overview',
    icon: Users,
    page: 'students',
    items: [
      { title: 'All Students', page: 'all-students' },
      { title: 'Student Progress', page: 'student-progress' },
      { title: 'Enrollment', page: 'enrollment' }
    ]
  }
];

export function TenantAdminLayout() {
  const [activePage, setActivePage] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['teachers', 'classes']);

  const toggleMenu = (menuPage: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuPage)
        ? prev.filter(p => p !== menuPage)
        : [...prev, menuPage]
    );
  };

  const handlePageChange = (page: string) => {
    setActivePage(page);
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'settings':
      case 'tenant-config':
      case 'billing':
      case 'domains':
        return <TenantSettings activeSection={activePage} />;
      case 'manage-teachers':
      case 'teacher-analytics':
        return <ManageTeachers activeSection={activePage} />;
      case 'create-teacher':
        return <CreateTeacher />;
      case 'manage-classes':
      case 'create-class':
      case 'schedules':
        return <ManageClasses activeSection={activePage} />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full">
        {/* Sidebar with Gemeos Brand Colors */}
        <Sidebar className="border-r border-white/10" style={{
          background: 'linear-gradient(180deg, #030213 0%, #1e1b4b 50%, #312e81 100%)'
        }}>
          <SidebarHeader className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl font-bold bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent">
                  Gemeos
                </div>
                <Badge className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white border-0 text-xs">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/5 rounded-lg backdrop-blur-lg">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white">
                    HA
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-white font-medium">Harmony Music Academy</div>
                  <div className="text-white/60 text-sm">San Francisco, CA</div>
                </div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-2">
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    onClick={() => {
                      if (item.items) {
                        toggleMenu(item.page);
                      } else {
                        handlePageChange(item.page);
                      }
                    }}
                    isActive={activePage === item.page || (item.items && item.items.some(subItem => subItem.page === activePage))}
                    className="text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-lg mx-1 data-[active=true]:bg-white/15 data-[active=true]:text-white data-[active=true]:font-medium"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                    {item.items && (
                      <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${expandedMenus.includes(item.page) ? 'rotate-90' : ''}`} />
                    )}
                  </SidebarMenuButton>
                  {item.items && expandedMenus.includes(item.page) && (
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.page}>
                          <SidebarMenuSubButton
                            onClick={() => handlePageChange(subItem.page)}
                            isActive={activePage === subItem.page}
                            className="text-white/60 hover:text-white hover:bg-white/8 transition-all duration-200 rounded-md ml-2 data-[active=true]:bg-white/12 data-[active=true]:text-white data-[active=true]:font-medium"
                          >
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>

          <div className="mt-auto p-4 border-t border-white/10">
            <div className="p-3 bg-white/5 rounded-lg backdrop-blur-lg">
              <div className="text-white/60 text-xs mb-2">Usage This Month</div>
              <div className="text-white text-lg font-bold">289/500 Students</div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                <div className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] h-2 rounded-full" style={{ width: '58%' }} />
              </div>
            </div>
          </div>
        </Sidebar>

        {/* Main Content Area with Light Background */}
        <SidebarInset className="bg-gray-50">
          <header className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-gray-600 hover:bg-gray-100" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {navigationItems.find(item => 
                    item.page === activePage || 
                    item.items?.some(subItem => subItem.page === activePage)
                  )?.title || 'Dashboard'}
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Manage your music academy with AI-powered tools
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">Harmony Music Academy</div>
                  <div className="text-xs text-gray-500">Premium Plan</div>
                </div>
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white">
                    HA
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}