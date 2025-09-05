import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbContextType {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  addBreadcrumb: (item: BreadcrumbItem) => void;
  removeBreadcrumb: (index: number) => void;
  clearBreadcrumbs: () => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

interface BreadcrumbProviderProps {
  children: ReactNode;
}

export function BreadcrumbProvider({ children }: BreadcrumbProviderProps) {
  const [breadcrumbs, setBreadcrumbsState] = useState<BreadcrumbItem[]>([]);

  const setBreadcrumbs = useCallback((items: BreadcrumbItem[]) => {
    setBreadcrumbsState(items);
  }, []);

  const addBreadcrumb = useCallback((item: BreadcrumbItem) => {
    setBreadcrumbsState(prev => [...prev, item]);
  }, []);

  const removeBreadcrumb = useCallback((index: number) => {
    setBreadcrumbsState(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearBreadcrumbs = useCallback(() => {
    setBreadcrumbsState([]);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{
      breadcrumbs,
      setBreadcrumbs,
      addBreadcrumb,
      removeBreadcrumb,
      clearBreadcrumbs
    }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
}