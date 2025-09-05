import React from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  description?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}
