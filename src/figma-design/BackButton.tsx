import React from 'react';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label: string;
  onClick: () => void;
}

export function BackButton({ label, onClick }: BackButtonProps) {
  return (
    <div className="border-b bg-white">
      <div className="container mx-auto px-6 py-4">
        <Button variant="ghost" size="sm" onClick={onClick}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {label}
        </Button>
      </div>
    </div>
  );
}