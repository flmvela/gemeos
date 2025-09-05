import { User, NavigationItem } from "@/types/user";
import { LayoutDashboard, BarChart3, FileText, Database, BookOpen, Target, Users, Settings } from "lucide-react";

export const mockUser: User = {
  id: "1",
  name: "Admin User",
  email: "admin@example.com",
  role: "admin",
};

export const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, description: 'Overview and quick insights' },
  { id: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: BarChart3, description: 'Trends and detailed metrics' },
  { id: 'reports', label: 'Reports', href: '/admin/reports', icon: FileText, description: 'Export and scheduled reports' },
  { id: 'domains', label: 'Domains', href: '/admin/learning-domains', icon: Database, description: 'All learning domains' },
  { id: 'concepts', label: 'Concepts', href: '/admin/concepts', icon: BookOpen, description: 'Knowledge graph concepts' },
  { id: 'goals', label: 'Goals', href: '/admin/goals', icon: Target, description: 'Learning objectives' },
  { id: 'exercises', label: 'Exercises', href: '/admin/exercises', icon: FileText, description: 'Practice content' },
  { id: 'users', label: 'Users', href: '/admin/users', icon: Users, description: 'User management' },
  { id: 'settings', label: 'Settings', href: '/admin/settings', icon: Settings, description: 'Platform configuration' },
];
