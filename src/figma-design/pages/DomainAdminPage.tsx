import React from 'react';
import { AdminDomainPage } from '../AdminDomainPage';
import { Domain } from '../../types/dashboard';

interface DomainAdminPageProps {
  domain: Domain;
  onNavigateBack: () => void;
  onNavigateToConcepts: (domainId: string) => void;
}

export function DomainAdminPage({
  domain,
  onNavigateBack,
  onNavigateToConcepts
}: DomainAdminPageProps) {
  return (
    <main className="container mx-auto px-6 py-8">
      <AdminDomainPage 
        domain={domain}
        onNavigateBack={onNavigateBack}
        onNavigateToConcepts={onNavigateToConcepts}
      />
    </main>
  );
}