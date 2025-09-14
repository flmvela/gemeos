import React, { useState } from 'react';
import { AIConceptsReview } from './pages/AIConceptsReview';
import { ReviewAI } from './pages/ReviewAI';

// Simple SVG Icons - no external dependencies
const HomeIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const SettingsIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UsersIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const GraduationCapIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
  </svg>
);

const SchoolIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ChevronRightIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const MenuIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const XIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const BookOpenIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const TrendingUpIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const ActivityIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UserPlusIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v6M21 12h-6" />
  </svg>
);

const PlusIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const MailIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const BellIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const SearchIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ListIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const BarChartIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const EditIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const ServerIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);

const TeacherIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LightbulbIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const TargetIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c3.87 0 7 3.13 7 7s-3.13 7-7 7-7-3.13-7-7 3.13-7 7-7z" />
    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
  </svg>
);

const BrainIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const UploadIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const ClockIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChatIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const EyeIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const FilterIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const CalendarIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const AwardIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const ChartBarIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const SpeakerphoneIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m3 6V8a1 1 0 00-1-1H5a1 1 0 00-1 1v2m16 0v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8m16 0H4m16 0l-2-2m-12 2L4 8" />
  </svg>
);

const ChevronDownIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ViewListIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const ViewGridIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

// Simple components
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = "default",
  size = "default",
  className = "",
  ...props 
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  variant?: "default" | "outline";
  size?: "default" | "sm";
  className?: string;
  [key: string]: any;
}) => {
  const sizeClasses = {
    default: "px-4 py-2",
    sm: "px-3 py-1.5 text-sm"
  };
  const baseClasses = `${sizeClasses[size]} rounded-md font-medium transition-all duration-200 flex items-center justify-center`;
  const variants = {
    default: "bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:from-[#0891b2] hover:to-[#7c3aed]",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50"
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

const Badge = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const Avatar = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-full flex items-center justify-center font-medium ${className}`}>
    {children}
  </div>
);

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
    icon: HomeIcon,
    page: 'dashboard'
  },
  {
    title: 'Platform Admin Dashboard',
    icon: ServerIcon,
    page: 'platform-admin'
  },
  {
    title: 'AI Tools',
    icon: BrainIcon,
    page: 'ai-tools',
    items: [
      { title: 'Review AI', page: 'review-ai' },
      { title: 'AI Concepts Review', page: 'ai-concepts-review' }
    ]
  },
  {
    title: 'Settings & Setup',
    icon: SettingsIcon,
    page: 'settings',
    items: [
      { title: 'Tenant Configuration', page: 'tenant-config' },
      { title: 'Billing & Plans', page: 'billing' },
      { title: 'Domain Management', page: 'domains' }
    ]
  },
  {
    title: 'Teacher Management',
    icon: GraduationCapIcon,
    page: 'teachers',
    items: [
      { title: 'View All Teachers', page: 'manage-teachers' },
      { title: 'Add New Teacher', page: 'create-teacher' },
      { title: 'Teacher Analytics', page: 'teacher-analytics' }
    ]
  },
  {
    title: 'Class Management',
    icon: SchoolIcon,
    page: 'classes',
    items: [
      { title: 'All Classes', page: 'manage-classes' },
      { title: 'Create Class', page: 'create-class' },
      { title: 'Class Schedules', page: 'schedules' }
    ]
  },
  {
    title: 'Student Overview',
    icon: UsersIcon,
    page: 'students',
    items: [
      { title: 'All Students', page: 'all-students' },
      { title: 'Student Progress', page: 'student-progress' },
      { title: 'Enrollment', page: 'enrollment' }
    ]
  },
  {
    title: 'Teacher Area',
    icon: TeacherIcon,
    page: 'teacher-area',
    items: [
      { title: 'Dashboard', page: 'teacher-dashboard' },
      { title: 'Classes', page: 'teacher-classes' },
      { title: 'Students', page: 'teacher-students' },
      { title: 'Learning Concepts', page: 'teacher-concepts' },
      { title: 'Learning Goals', page: 'teacher-goals' },
      { title: 'AI Training', page: 'teacher-ai-training' }
    ]
  }
];

// Platform Admin Dashboard Component
function PlatformAdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'statistics'>('list');

  const tenants = [
    {
      id: 1,
      name: 'Harmony Music Academy',
      teachers: 12,
      classes: 28,
      students: 289,
      hasNotifications: true,
      location: 'San Francisco, CA'
    },
    {
      id: 2,
      name: 'Elite Learning Institute',
      teachers: 8,
      classes: 15,
      students: 156,
      hasNotifications: false,
      location: 'New York, NY'
    },
    {
      id: 3,
      name: 'Creative Arts School',
      teachers: 15,
      classes: 32,
      students: 402,
      hasNotifications: true,
      location: 'Los Angeles, CA'
    },
    {
      id: 4,
      name: 'Global Education Hub',
      teachers: 22,
      classes: 45,
      students: 678,
      hasNotifications: false,
      location: 'Chicago, IL'
    },
    {
      id: 5,
      name: 'Future Skills Academy',
      teachers: 6,
      classes: 12,
      students: 89,
      hasNotifications: true,
      location: 'Austin, TX'
    }
  ];

  // Filter tenants based on search term
  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals for cards
  const totalTenants = tenants.length;
  const totalTeachers = tenants.reduce((sum, tenant) => sum + tenant.teachers, 0);
  const totalStudents = tenants.reduce((sum, tenant) => sum + tenant.students, 0);
  const totalClasses = tenants.reduce((sum, tenant) => sum + tenant.classes, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Tenants Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Tenants</div>
            <ServerIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalTenants}</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUpIcon className="w-3 h-3 mr-1" />
              +1 this month
            </p>
          </CardContent>
        </Card>

        {/* Teachers Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Teachers</div>
            <GraduationCapIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalTeachers}</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUpIcon className="w-3 h-3 mr-1" />
              +5 this month
            </p>
          </CardContent>
        </Card>

        {/* Students Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Students</div>
            <UsersIcon className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalStudents}</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUpIcon className="w-3 h-3 mr-1" />
              +47 this month
            </p>
          </CardContent>
        </Card>

        {/* Classes Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Classes</div>
            <SchoolIcon className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalClasses}</div>
            <p className="text-xs text-blue-600 flex items-center mt-1">
              <TrendingUpIcon className="w-3 h-3 mr-1" />
              +8 this month
            </p>
          </CardContent>
        </Card>

        {/* New Messages Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">New Messages</div>
            <MailIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">23</div>
            <p className="text-xs text-amber-600 mt-1">From all tenants</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Section with View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {viewMode === 'list' ? 'Tenant Management' : 'Platform Statistics'}
              </h3>
              <p className="text-gray-600 text-sm">
                {viewMode === 'list' 
                  ? 'Manage tenants and monitor their activity across the platform'
                  : 'Analytics and insights across all tenants'
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              {viewMode === 'list' && (
                <Button className="flex items-center">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Tenant
                </Button>
              )}
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="List View"
                >
                  <ViewListIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('statistics')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'statistics'
                      ? 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Statistics View"
                >
                  <ViewGridIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'list' && (
            // Search Bar - only shown in list view
            <div className="mb-6">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tenants by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                />
              </div>
            </div>
          )}
          
          {viewMode === 'list' ? (
            // List View
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Tenant Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Teachers</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Classes</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Students</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Notifications</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white text-sm">
                          {tenant.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{tenant.name}</div>
                          <div className="text-sm text-gray-500">Active tenant</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-900">{tenant.location}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <GraduationCapIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{tenant.teachers}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <SchoolIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{tenant.classes}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <UsersIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{tenant.students}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        {tenant.hasNotifications ? (
                          <div className="relative">
                            <BellIcon className="w-5 h-5 text-amber-500" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                          </div>
                        ) : (
                          <BellIcon className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTenants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <SearchIcon className="w-8 h-8 text-gray-300 mb-2" />
                        <p>No tenants found matching "{searchTerm}"</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search terms</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          ) : (
            // Statistics View
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Platform Growth Chart */}
                <Card>
                  <CardHeader>
                    <h4 className="text-lg font-semibold text-gray-900">Platform Growth - Last 4 Months</h4>
                    <p className="text-gray-600 text-sm">New tenants, teachers, and students</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative">
                      <div className="text-center">
                        <BarChartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <div className="space-y-2">
                          <div className="text-gray-600 font-medium">Growth Analytics Chart</div>
                          <div className="text-sm text-gray-500">Interactive charts coming soon</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tenant Activity Metrics */}
                <Card>
                  <CardHeader>
                    <h4 className="text-lg font-semibold text-gray-900">Tenant Activity Heatmap</h4>
                    <p className="text-gray-600 text-sm">Usage patterns across all tenants</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative">
                      <div className="text-center">
                        <ActivityIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <div className="space-y-2">
                          <div className="text-gray-600 font-medium">Activity Heatmap</div>
                          <div className="text-sm text-gray-500">Advanced analytics dashboard coming soon</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Teachers/Tenant</p>
                        <p className="text-2xl font-bold text-gray-900">12.6</p>
                      </div>
                      <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <GraduationCapIcon className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Students/Tenant</p>
                        <p className="text-2xl font-bold text-gray-900">322.8</p>
                      </div>
                      <div className="h-8 w-8 bg-pink-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="w-4 h-4 text-pink-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Tenants</p>
                        <p className="text-2xl font-bold text-gray-900">5/5</p>
                      </div>
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <ActivityIcon className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Main Dashboard Component - Using simple mock data structure
function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">Tenant Admin Dashboard</h2>
        <p className="text-gray-600 text-sm mt-1">Overview of your educational institution's performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Teachers Card */}
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Teachers</div>
            <GraduationCapIcon className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">12</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUpIcon className="w-3 h-3 mr-1" />
              +2 this month
            </p>
          </CardContent>
        </Card>

        {/* Students Card */}
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Students</div>
            <UsersIcon className="h-5 w-5 text-pink-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">289</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUpIcon className="w-3 h-3 mr-1" />
              +23 this month
            </p>
          </CardContent>
        </Card>

        {/* Classes Card */}
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">Classes</div>
            <SchoolIcon className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">28</div>
            <p className="text-xs text-blue-600 flex items-center mt-1">
              <TrendingUpIcon className="w-3 h-3 mr-1" />
              +3 this month
            </p>
          </CardContent>
        </Card>

        {/* Messages Card */}
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="text-sm font-medium text-gray-700">New Messages</div>
            <MailIcon className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">7</div>
            <p className="text-xs text-amber-600 mt-1">Unread messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Student Attendance - Last 4 Weeks</h3>
            <p className="text-gray-600 text-sm">Weekly attendance rates across all classes</p>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative">
              <div className="text-center">
                <BarChartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <div className="text-gray-600 font-medium">Attendance Chart</div>
                  <div className="text-sm text-gray-500">Interactive charts coming soon</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
            <p className="text-gray-600 text-sm">Student progress and achievement metrics</p>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative">
              <div className="text-center">
                <AwardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <div className="text-gray-600 font-medium">Performance Analytics</div>
                  <div className="text-sm text-gray-500">Detailed metrics dashboard coming soon</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <p className="text-gray-600 text-sm">Common administrative tasks</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="flex items-center justify-center p-4 h-auto">
              <UserPlusIcon className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Add Teacher</div>
                <div className="text-xs opacity-80">Invite new faculty member</div>
              </div>
            </Button>
            <Button variant="outline" className="flex items-center justify-center p-4 h-auto">
              <SchoolIcon className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Create Class</div>
                <div className="text-xs opacity-80">Set up new learning session</div>
              </div>
            </Button>
            <Button variant="outline" className="flex items-center justify-center p-4 h-auto">
              <MailIcon className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Send Announcements</div>
                <div className="text-xs opacity-80">Broadcast to all users</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Teacher Dashboard Component
function TeacherDashboard() {
  const [viewMode, setViewMode] = useState<'dashboard' | 'statistics'>('dashboard');
  
  // Mock data for quick access
  const quickAccessData = {
    learningConcepts: {
      total: 47,
      aiGenerated: 23,
      needingReview: 3
    },
    learningGoals: {
      total: 34,
      aiGenerated: 18,
      needingReview: 2
    },
    exercises: {
      total: 156,
      aiGenerated: 89,
      needingReview: 7
    }
  };

  const statisticsData = {
    totalStudents: 210,
    activeClasses: 8,
    goalsAchieved: 47,
    activitiesThisWeek: 132
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span>Teacher Area</span>
        <ChevronRightIcon className="w-4 h-4" />
        <span className="text-gray-900 font-medium">Dashboard</span>
      </div>

      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {viewMode === 'dashboard' ? 'Teacher Dashboard' : 'Teacher Statistics'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {viewMode === 'dashboard' 
                ? 'Manage your classes and track student progress' 
                : 'Analytics and insights for your teaching activities'
              }
            </p>
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'dashboard'
                  ? 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Dashboard View"
            >
              <ViewListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('statistics')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'statistics'
                  ? 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Statistics View"
            >
              <ViewGridIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'dashboard' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Active Students */}
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-gray-700">Active Students</div>
                <UsersIcon className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{statisticsData.totalStudents}</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUpIcon className="w-3 h-3 mr-1" />
                  +15 this month
                </p>
              </CardContent>
            </Card>

            {/* Active Classes */}
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-gray-700">My Classes</div>
                <SchoolIcon className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{statisticsData.activeClasses}</div>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <TrendingUpIcon className="w-3 h-3 mr-1" />
                  +2 this semester
                </p>
              </CardContent>
            </Card>

            {/* Goals Achieved */}
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-gray-700">Goals Achieved</div>
                <TargetIcon className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{statisticsData.goalsAchieved}</div>
                <p className="text-xs text-amber-600 flex items-center mt-1">
                  <TrendingUpIcon className="w-3 h-3 mr-1" />
                  +12 this month
                </p>
              </CardContent>
            </Card>

            {/* Weekly Activities */}
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-gray-700">Activities This Week</div>
                <ActivityIcon className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{statisticsData.activitiesThisWeek}</div>
                <p className="text-xs text-purple-600 flex items-center mt-1">
                  <TrendingUpIcon className="w-3 h-3 mr-1" />
                  +8 from last week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Learning Concepts Card */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium text-gray-700">Learning Concepts</div>
                  <LightbulbIcon className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-900">{quickAccessData.learningConcepts.total}</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">AI Generated: {quickAccessData.learningConcepts.aiGenerated}</span>
                      </div>
                      {quickAccessData.learningConcepts.needingReview > 0 && (
                        <div className="flex items-center text-xs text-amber-600">
                          <BellIcon className="w-3 h-3 mr-1" />
                          {quickAccessData.learningConcepts.needingReview} need review
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Goals Card */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium text-gray-700">Learning Goals</div>
                  <TargetIcon className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-900">{quickAccessData.learningGoals.total}</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">AI Generated: {quickAccessData.learningGoals.aiGenerated}</span>
                      </div>
                      {quickAccessData.learningGoals.needingReview > 0 && (
                        <div className="flex items-center text-xs text-amber-600">
                          <BellIcon className="w-3 h-3 mr-1" />
                          {quickAccessData.learningGoals.needingReview} need review
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Training Card */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium text-gray-700">AI Training</div>
                  <BrainIcon className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <UploadIcon className="w-8 h-8 text-gray-400 mx-auto" />
                    <div className="text-sm text-gray-600">Upload Content</div>
                    <p className="text-xs text-gray-500">Train the AI system with your materials</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        /* Statistics View */
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Students */}
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-gray-700">Total Students</div>
                <UsersIcon className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{statisticsData.totalStudents}</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUpIcon className="w-3 h-3 mr-1" />
                  +15 this month
                </p>
              </CardContent>
            </Card>

            {/* Active Classes */}
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-gray-700">Active Classes</div>
                <SchoolIcon className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{statisticsData.activeClasses}</div>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <TrendingUpIcon className="w-3 h-3 mr-1" />
                  +2 this semester
                </p>
              </CardContent>
            </Card>

            {/* Goals Achieved */}
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-gray-700">Goals Achieved</div>
                <TargetIcon className="h-5 w-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{statisticsData.goalsAchieved}</div>
                <p className="text-xs text-amber-600 flex items-center mt-1">
                  <TrendingUpIcon className="w-3 h-3 mr-1" />
                  +12 this month
                </p>
              </CardContent>
            </Card>

            {/* Activities This Week */}
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-sm font-medium text-gray-700">Activities This Week</div>
                <ActivityIcon className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{statisticsData.activitiesThisWeek}</div>
                <p className="text-xs text-purple-600 flex items-center mt-1">
                  <TrendingUpIcon className="w-3 h-3 mr-1" />
                  +8 from last week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Student Progress Chart */}
            <Card>
              <CardHeader>
                <h4 className="text-lg font-semibold text-gray-900">Student Progress - Last 4 Weeks</h4>
                <p className="text-gray-600 text-sm">Weekly progress tracking across all classes</p>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative">
                  <div className="text-center">
                    <BarChartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <div className="space-y-2">
                      <div className="text-gray-600 font-medium">Progress Analytics Chart</div>
                      <div className="text-sm text-gray-500">Interactive charts coming soon</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Class Engagement Metrics */}
            <Card>
              <CardHeader>
                <h4 className="text-lg font-semibold text-gray-900">Class Engagement Trends</h4>
                <p className="text-gray-600 text-sm">Student participation and activity levels</p>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative">
                  <div className="text-center">
                    <ActivityIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <div className="space-y-2">
                      <div className="text-gray-600 font-medium">Engagement Analytics</div>
                      <div className="text-sm text-gray-500">Detailed metrics dashboard coming soon</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Class Size</p>
                    <p className="text-2xl font-bold text-gray-900">26.3</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <UsersIcon className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">87%</p>
                  </div>
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <TargetIcon className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Student Satisfaction</p>
                    <p className="text-2xl font-bold text-gray-900">4.6/5</p>
                  </div>
                  <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <AwardIcon className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// Teacher Classes Component
function TeacherClasses({ onNavigateToClassDetail }: { onNavigateToClassDetail: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'statistics'>('list');
  
  // Statistics data
  const statsData = {
    totalClasses: 8,
    activeStudents: 210,
    goalsAchieved: 47,
    activitiesThisWeek: 132
  };

  // Classes data
  const classes = [
    {
      id: 1,
      name: 'Advanced Piano Techniques',
      domain: 'Piano',
      students: 24,
      hasNotifications: true,
      notificationCount: 3
    },
    {
      id: 2,
      name: 'Music Theory Fundamentals',
      domain: 'Music Theory',
      students: 32,
      hasNotifications: false,
      notificationCount: 0
    },
    {
      id: 3,
      name: 'Jazz Improvisation',
      domain: 'Piano',
      students: 18,
      hasNotifications: true,
      notificationCount: 1
    },
    {
      id: 4,
      name: 'Classical Composition',
      domain: 'Composition',
      students: 15,
      hasNotifications: false,
      notificationCount: 0
    },
    {
      id: 5,
      name: 'IELTS Speaking Preparation',
      domain: 'IELTS',
      students: 28,
      hasNotifications: true,
      notificationCount: 5
    },
    {
      id: 6,
      name: 'Intermediate Guitar',
      domain: 'Guitar',
      students: 22,
      hasNotifications: false,
      notificationCount: 0
    },
    {
      id: 7,
      name: 'Advanced Math Problem Solving',
      domain: 'Mathematics',
      students: 35,
      hasNotifications: true,
      notificationCount: 2
    },
    {
      id: 8,
      name: 'Beginner Piano for Kids',
      domain: 'Piano',
      students: 16,
      hasNotifications: false,
      notificationCount: 0
    }
  ];

  // Filter classes based on search term
  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span>Teacher Area</span>
        <ChevronRightIcon className="w-4 h-4" />
        <span className="text-gray-900 font-medium">My Classes</span>
      </div>

      {/* Statistics Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Class Overview</h2>
          <p className="text-gray-600 text-sm">Key metrics for your teaching activities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Classes */}
          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium text-gray-700">Total Classes</div>
              <SchoolIcon className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{statsData.totalClasses}</div>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <TrendingUpIcon className="w-3 h-3 mr-1" />
                +2 this semester
              </p>
            </CardContent>
          </Card>

          {/* Active Students */}
          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium text-gray-700">Active Students</div>
              <UsersIcon className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{statsData.activeStudents}</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUpIcon className="w-3 h-3 mr-1" />
                +15 this month
              </p>
            </CardContent>
          </Card>

          {/* Learning Goals Achieved */}
          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium text-gray-700">Goals Achieved</div>
              <TargetIcon className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{statsData.goalsAchieved}</div>
              <p className="text-xs text-amber-600 flex items-center mt-1">
                <TrendingUpIcon className="w-3 h-3 mr-1" />
                +12 this month
              </p>
            </CardContent>
          </Card>

          {/* Activities This Week */}
          <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium text-gray-700">Activities This Week</div>
              <ActivityIcon className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{statsData.activitiesThisWeek}</div>
              <p className="text-xs text-purple-600 flex items-center mt-1">
                <TrendingUpIcon className="w-3 h-3 mr-1" />
                +8 from last week
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Section with View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {viewMode === 'list' ? 'My Classes' : 'Classes Statistics'}
              </h3>
              <p className="text-gray-600 text-sm">
                {viewMode === 'list' 
                  ? 'Manage your classes and track student progress'
                  : 'Analytics and insights for your classes'
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              {viewMode === 'list' && (
                <Button className="flex items-center">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Class
                </Button>
              )}
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="List View"
                >
                  <ViewListIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('statistics')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'statistics'
                      ? 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Statistics View"
                >
                  <ViewGridIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {viewMode === 'list' && (
            // Search Bar - only shown in list view
            <div className="mb-6">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search classes by name or domain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200"
                />
              </div>
            </div>
          )}
          
          {viewMode === 'list' ? (
            // List View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.map((cls) => (
                <Card key={cls.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {cls.name}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              {cls.domain}
                            </Badge>
                          </div>
                        </div>
                        {cls.hasNotifications && (
                          <div className="relative">
                            <BellIcon className="w-5 h-5 text-amber-500" />
                            {cls.notificationCount > 0 && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-medium">{cls.notificationCount}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <UsersIcon className="w-4 h-4" />
                          <span>{cls.students} students</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={onNavigateToClassDetail}
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" className="flex-1">
                          <EditIcon className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredClasses.length === 0 && (
                <div className="col-span-full py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <SearchIcon className="w-8 h-8 text-gray-300 mb-2" />
                    <p>No classes found matching "{searchTerm}"</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search terms</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Statistics View
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Class Performance Chart */}
                <Card>
                  <CardHeader>
                    <h4 className="text-lg font-semibold text-gray-900">Class Performance - Last 4 Weeks</h4>
                    <p className="text-gray-600 text-sm">Student engagement and completion rates</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative">
                      <div className="text-center">
                        <BarChartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <div className="space-y-2">
                          <div className="text-gray-600 font-medium">Performance Analytics Chart</div>
                          <div className="text-sm text-gray-500">Interactive charts coming soon</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Student Progress Metrics */}
                <Card>
                  <CardHeader>
                    <h4 className="text-lg font-semibold text-gray-900">Student Progress Trends</h4>
                    <p className="text-gray-600 text-sm">Learning goals completion across classes</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center relative">
                      <div className="text-center">
                        <ActivityIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <div className="space-y-2">
                          <div className="text-gray-600 font-medium">Progress Analytics</div>
                          <div className="text-sm text-gray-500">Detailed metrics dashboard coming soon</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Students/Class</p>
                        <p className="text-2xl font-bold text-gray-900">26.3</p>
                      </div>
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="w-4 h-4 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-bold text-gray-900">87%</p>
                      </div>
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <TargetIcon className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Classes</p>
                        <p className="text-2xl font-bold text-gray-900">8/8</p>
                      </div>
                      <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <SchoolIcon className="w-4 h-4 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Class Detail Component
function ClassDetail() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span>Teacher Area</span>
        <ChevronRightIcon className="w-4 h-4" />
        <span>My Classes</span>
        <ChevronRightIcon className="w-4 h-4" />
        <span className="text-gray-900 font-medium">Advanced Piano Techniques</span>
      </div>

      {/* Class Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Advanced Piano Techniques</h1>
            <p className="text-gray-600 mt-2">Piano • 24 Students • 3 Notifications</p>
            <div className="flex items-center gap-4 mt-4">
              <Badge className="bg-green-100 text-green-800">Active</Badge>
              <Badge className="bg-blue-100 text-blue-800">Piano</Badge>
              <Badge className="bg-purple-100 text-purple-800">Advanced Level</Badge>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <EditIcon className="w-4 h-4 mr-2" />
              Edit Class
            </Button>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <UsersIcon className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                <p className="text-2xl font-bold text-gray-900">92%</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <ActivityIcon className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Goals Completed</p>
                <p className="text-2xl font-bold text-gray-900">18/24</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TargetIcon className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Next Session</p>
                <p className="text-2xl font-bold text-gray-900">2 Days</p>
              </div>
              <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center">
                <ClockIcon className="w-4 h-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Students List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Students</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <FilterIcon className="w-4 h-4 mr-1" />
                    Filter
                  </Button>
                  <Button size="sm">
                    <UserPlusIcon className="w-4 h-4 mr-1" />
                    Add Student
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Emily Johnson", progress: 95, status: "Excellent", lastActivity: "2 hours ago" },
                  { name: "Michael Chen", progress: 87, status: "Good", lastActivity: "1 day ago" },
                  { name: "Sarah Williams", progress: 78, status: "Good", lastActivity: "3 hours ago" },
                  { name: "David Rodriguez", progress: 92, status: "Excellent", lastActivity: "5 hours ago" },
                  { name: "Lisa Thompson", progress: 65, status: "Needs Help", lastActivity: "2 days ago" }
                ].map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white text-sm">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">Last active: {student.lastActivity}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{student.progress}%</div>
                        <div className="text-xs text-gray-500">Progress</div>
                      </div>
                      <Badge className={
                        student.status === "Excellent" ? "bg-green-100 text-green-800" :
                        student.status === "Good" ? "bg-blue-100 text-blue-800" :
                        "bg-amber-100 text-amber-800"
                      }>
                        {student.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "New submission", student: "Emily J.", time: "2h ago", type: "assignment" },
                  { action: "Goal completed", student: "Michael C.", time: "4h ago", type: "goal" },
                  { action: "Question asked", student: "Sarah W.", time: "6h ago", type: "question" },
                  { action: "Practice session", student: "David R.", time: "1d ago", type: "practice" }
                ].map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'assignment' ? 'bg-blue-500' :
                      activity.type === 'goal' ? 'bg-green-500' :
                      activity.type === 'question' ? 'bg-amber-500' :
                      'bg-purple-500'
                    }`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                      <div className="text-xs text-gray-500">{activity.student} • {activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <SpeakerphoneIcon className="w-4 h-4 mr-2" />
                  Send Announcement
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Schedule Session
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AwardIcon className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ChartBarIcon className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface SelfContainedLayoutProps {
  onNavigateToWelcome: () => void;
}

export function SelfContainedLayout({ onNavigateToWelcome }: SelfContainedLayoutProps) {
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

  const handleNavigateToClassDetail = () => {
    setActivePage('class-detail');
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'platform-admin':
        return <PlatformAdminDashboard />;
      case 'teacher-dashboard':
        return <TeacherDashboard />;
      case 'teacher-classes':
        return <TeacherClasses onNavigateToClassDetail={handleNavigateToClassDetail} />;
      case 'class-detail':
        return <ClassDetail />;
      case 'ai-concepts-review':
        return <AIConceptsReview />;
      case 'review-ai':
        return <ReviewAI />;
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
                <button
                  onClick={onNavigateToWelcome}
                  className="text-2xl font-bold bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent hover:from-[#0891b2] hover:to-[#7c3aed] transition-all duration-200 hover:scale-105 cursor-pointer"
                >
                  {sidebarOpen ? 'Gemeos' : 'G'}
                </button>
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white/60 hover:text-white transition-colors"
              >
                {sidebarOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
              </button>
            </div>
            {sidebarOpen && (
              <div className="mt-4 p-3 bg-white/5 rounded-lg backdrop-blur-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white">
                    HA
                  </Avatar>
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
                      <ChevronRightIcon className={`w-4 h-4 transition-transform ${expandedMenus.includes(item.page) ? 'rotate-90' : ''}`} />
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
              <h1 className="text-xl font-semibold text-gray-800">Gemeos Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage your educational platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                <BellIcon className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
              </button>
              <Avatar className="h-8 w-8 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white text-sm">
                AD
              </Avatar>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}