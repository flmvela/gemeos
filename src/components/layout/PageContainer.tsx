import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Centralized page container component that provides consistent
 * width, padding, and spacing across all admin pages.
 * 
 * Features:
 * - p-6: Consistent page padding
 * - space-y-8: Consistent section spacing
 * - mx-auto max-w-7xl: Centered content with max width
 * - Matches AdminDashboard layout exactly
 */
export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`p-6 space-y-8 ${className}`}>
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </div>
  );
}
