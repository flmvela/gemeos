import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Home,
  Settings,
  Users,
  GraduationCap,
  School,
  Crown,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

// Simple components to replace complex UI dependencies
const SimpleCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const SimpleButton = ({ 
  children, 
  onClick, 
  variant = "default",
  className = "",
  ...props 
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost";
  className?: string;
  [key: string]: any;
}) => {
  const baseClasses = "px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center justify-center";
  const variants = {
    default: "bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:from-[#0891b2] hover:to-[#7c3aed]",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost: "text-gray-700 hover:bg-gray-100"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const SimpleBadge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const SimpleAvatar = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-full flex items-center justify-center font-medium ${className}`}>
    {children}
  </div>
);

// Import page components
import { SimpleDashboardOverview } from './pages/SimpleDashboardOverview';

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

export function SimpleTenantAdminLayout() {
  const [activePage, setActivePage] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['teachers', 'classes']);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
        return <SimpleDashboardOverview />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">Coming Soon</div>
              <div className="text-gray-600">This section is under development</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar */}
      <div 
        className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 flex-shrink-0`}
        style={{
          background: 'linear-gradient(180deg, #030213 0%, #1e1b4b 50%, #312e81 100%)'
        }}
      >
        <div className="h-full flex flex-col border-r border-white/10">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className={`flex items-center space-x-3 ${!sidebarOpen && 'justify-center'}`}>
                <div className="text-2xl font-bold bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent">
                  {sidebarOpen ? 'Gemeos' : 'G'}
                </div>
                {sidebarOpen && (
                  <SimpleBadge className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </SimpleBadge>
                )}
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white/60 hover:text-white transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
            {sidebarOpen && (
              <div className="mt-4 p-3 bg-white/5 rounded-lg backdrop-blur-lg">
                <div className="flex items-center space-x-3">
                  <SimpleAvatar className="h-10 w-10 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white">
                    HA
                  </SimpleAvatar>
                  <div>
                    <div className="text-white font-medium">Harmony Music Academy</div>
                    <div className="text-white/60 text-sm">San Francisco, CA</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 p-2 overflow-y-auto">
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <div key={item.page}>
                  <button
                    onClick={() => {
                      if (item.items) {
                        toggleMenu(item.page);
                      } else {
                        handlePageChange(item.page);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                      activePage === item.page || (item.items && item.items.some(subItem => subItem.page === activePage))
                        ? 'bg-white/15 text-white font-medium'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      {sidebarOpen && <span>{item.title}</span>}
                    </div>
                    {sidebarOpen && item.items && (
                      <ChevronRight className={`w-4 h-4 transition-transform ${expandedMenus.includes(item.page) ? 'rotate-90' : ''}`} />
                    )}
                  </button>
                  {sidebarOpen && item.items && expandedMenus.includes(item.page) && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.items.map((subItem) => (
                        <button
                          key={subItem.page}
                          onClick={() => handlePageChange(subItem.page)}
                          className={`w-full text-left p-2 rounded-md transition-all duration-200 ${
                            activePage === subItem.page
                              ? 'bg-white/12 text-white font-medium'
                              : 'text-white/60 hover:text-white hover:bg-white/8'
                          }`}
                        >
                          {subItem.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Usage Stats */}
          {sidebarOpen && (
            <div className="p-4 border-t border-white/10">
              <div className="p-3 bg-white/5 rounded-lg backdrop-blur-lg">
                <div className="text-white/60 text-xs mb-2">Usage This Month</div>
                <div className="text-white text-lg font-bold">289/500 Students</div>
                <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                  <div className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] h-2 rounded-full" style={{ width: '58%' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
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
              <SimpleAvatar className="h-8 w-8 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white">
                HA
              </SimpleAvatar>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
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
      </div>
    </div>
  );
}