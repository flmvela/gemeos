import React from "react";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
  }>;
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className="flex items-center text-muted-foreground"
      style={{ 
        marginBottom: '1.5rem',
        fontSize: '0.875rem',
        gap: '8px'
      }}
    >
      <Home style={{ width: '16px', height: '16px' }} />
      {items.map((item, index) => (
        <div key={index} className="flex items-center" style={{ gap: '8px' }}>
          <ChevronRight style={{ width: '16px', height: '16px' }} />
          {item.href ? (
            <a href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </a>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
