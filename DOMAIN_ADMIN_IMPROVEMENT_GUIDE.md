# Domain Admin Page Design System Implementation Guide

## Executive Summary
The domain admin page at `/admin/domain/:domainId` requires significant updates to align with the Gemeos Design System Style Guide. This document provides specific, actionable implementation guidance with code examples.

## Priority 1: Color System Implementation (CRITICAL)

### Current Issues
- Generic color classes (`primary`, `accent`, `muted-foreground`)
- Inline style overrides
- Missing brand color implementation

### Required Changes

#### FeatureCard.tsx Color Updates
```tsx
// REMOVE these generic classes:
className="bg-accent text-accent-foreground"
className="text-muted-foreground"

// REPLACE with brand colors:
// For icon containers (matching DomainCard pattern):
<div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#110D59]/10">
  <BookOpen className="h-5 w-5 text-[#110D59]" />
</div>

// For different feature types:
// Learning Concepts - Deep Purple
backgroundColor: '#110D59/10', iconColor: '#110D59'
// Learning Goals - Medium Purple  
backgroundColor: '#28246F/10', iconColor: '#28246F'
// Exercises - Primary Blue
backgroundColor: '#A3D1FC/20', iconColor: '#0B5FAE'
```

#### AdminDomainPage.tsx Typography Colors
```tsx
// REMOVE:
<h2 className="text-muted-foreground">Section Title</h2>
<p className="text-muted-foreground">Description</p>

// REPLACE with:
<h2 className="text-[#110D59] font-semibold">Section Title</h2>
<p className="text-[#55555F]">Description</p>
```

## Priority 2: Button System Implementation (CRITICAL)

### Add Action Buttons to Feature Cards
```tsx
// Add to FeatureCard component:
<div className="flex gap-3 mt-4">
  <button
    onClick={onPrimaryAction}
    className={cn(
      "flex-1 h-[51px] rounded-lg",
      "bg-[#0B5FAE] text-white",
      "font-medium text-sm",
      "flex items-center justify-center gap-2",
      "transition-all duration-200",
      "hover:bg-[#0B5FAE]/90",
      "active:bg-[#0B5FAE]/85",
      "focus:outline-none focus:ring-2 focus:ring-[#0B5FAE] focus:ring-offset-2"
    )}
  >
    <Settings className="h-4 w-4" />
    Manage
  </button>
</div>
```

## Priority 3: Card Styling Updates (IMPORTANT)

### Remove Inline Styles, Use Consistent Classes
```tsx
// REMOVE this pattern from FeatureCard:
<Card
  style={{
    borderRadius: '10px',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1)';
  }}
>

// REPLACE with:
<Card 
  className={cn(
    "relative overflow-hidden",
    "bg-white rounded-lg", // 8px border radius
    "border border-[#E5E7EB]",
    "shadow-sm hover:shadow-lg",
    "transition-all duration-200",
    "hover:scale-[1.01]", // Subtle scale
    "cursor-pointer"
  )}
>
```

## Priority 4: Enhanced Feature Card Component

### Complete Refactored FeatureCard.tsx
```tsx
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Settings, BarChart3, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  count?: number;
  comingSoon?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  colorScheme?: 'purple' | 'blue' | 'green';
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  count,
  comingSoon,
  highlighted = false,
  onClick,
  colorScheme = 'purple'
}: FeatureCardProps) {
  const getColorStyles = () => {
    switch(colorScheme) {
      case 'blue':
        return {
          bg: 'bg-[#A3D1FC]/20',
          icon: 'text-[#0B5FAE]',
          stat: 'text-[#0B5FAE]'
        };
      case 'green':
        return {
          bg: 'bg-[#22C55E]/10',
          icon: 'text-[#22C55E]',
          stat: 'text-[#22C55E]'
        };
      default:
        return {
          bg: 'bg-[#110D59]/10',
          icon: 'text-[#110D59]',
          stat: 'text-[#110D59]'
        };
    }
  };

  const colors = getColorStyles();

  return (
    <Card 
      className={cn(
        "relative overflow-hidden h-full",
        "bg-white rounded-lg",
        "border border-[#E5E7EB]",
        "shadow-sm hover:shadow-lg",
        "transition-all duration-200",
        "cursor-pointer group"
      )}
      onClick={onClick}
    >
      {/* Status indicator line at top */}
      {highlighted && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#110D59]" />
      )}
      
      <CardHeader className="p-6 pb-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          {/* Icon with proper brand colors */}
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full",
            colors.bg
          )}>
            <Icon className={cn("h-5 w-5", colors.icon)} />
          </div>
          
          {/* Count or Coming Soon badge */}
          <div className="flex items-center gap-2">
            {comingSoon ? (
              <Badge className="px-3 py-1 text-xs uppercase tracking-wider rounded-full bg-[#7E7BB3] text-white border-0">
                Coming Soon
              </Badge>
            ) : count !== undefined ? (
              <div className={cn("text-2xl font-bold", colors.stat)}>
                {count}
              </div>
            ) : null}
            <ChevronRight className="h-5 w-5 text-[#7E7BB3] group-hover:text-[#110D59] transition-colors" />
          </div>
        </div>
        
        {/* Title with proper typography */}
        <div>
          <CardTitle className="text-lg font-semibold text-[#110D59] group-hover:text-[#0B5FAE] transition-colors">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-0">
        <CardDescription className="text-sm text-[#55555F] leading-relaxed line-clamp-2">
          {description}
        </CardDescription>
        
        {/* Action buttons if not coming soon */}
        {!comingSoon && (
          <div className="mt-4">
            <button
              className={cn(
                "w-full h-[51px] rounded-lg",
                "bg-[#0E77D9] text-white",
                "font-medium text-sm",
                "flex items-center justify-center gap-2",
                "transition-all duration-200",
                "hover:bg-[#0E77D9]/90",
                "active:bg-[#0E77D9]/85",
                "focus:outline-none focus:ring-2 focus:ring-[#0E77D9] focus:ring-offset-2"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              <Settings className="h-4 w-4" />
              Manage
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Priority 5: Update AdminDomainPage.tsx

### Section Headers with Proper Styling
```tsx
// Replace section headers:
<section className="mb-8">
  <h2 className="text-2xl font-semibold mb-6 text-[#110D59]">
    Learning Setup & Content Management
  </h2>
  {/* ... */}
</section>
```

### Update Feature Card Usage
```tsx
<FeatureCard
  title="Learning Concepts"
  description="Number of concepts in the domain; manage concepts and relationships."
  icon={BookOpen}
  count={mockData.conceptsCount}
  colorScheme="purple"
  onClick={() => navigate(`/admin/domain/${domainId}/concepts`)}
/>
```

## CSS Variables to Add

Create or update your CSS configuration:
```css
:root {
  /* Brand Colors */
  --primary-purple: #110D59;
  --secondary-purple: #28246F;
  --purple-gray: #7E7BB3;
  
  /* Action Colors */
  --primary-blue: #0B5FAE;
  --secondary-blue: #0E77D9;
  --tertiary-blue: #08437A;
  
  /* Extended Purple Scale */
  --purple-300: #B4B1E6;
  --purple-100: #DAD9F5;
  
  /* Typography */
  --text-primary: #222127;
  --text-secondary: #55555F;
  --text-light: #B3B1BB;
  
  /* Component Standards */
  --button-height: 51px;
  --border-radius: 8px;
  --border-color: #E5E7EB;
}
```

## Testing Checklist

After implementation, verify:
- [ ] All colors match the style guide palette
- [ ] Buttons are 51px height with 8px border radius
- [ ] Typography uses correct colors and weights
- [ ] Cards have consistent 8px border radius
- [ ] Hover states use opacity changes, not aggressive scales
- [ ] Focus states visible for keyboard navigation
- [ ] No inline styles remain
- [ ] Icons use brand colors with proper backgrounds
- [ ] Section headers use primary brand colors
- [ ] Badges styled consistently with proper colors

## Reference Implementation
Always refer to `/src/components/admin-dashboard/DomainCard.tsx` as the gold standard for implementing the Gemeos Design System.

## Next Steps
1. Implement color system changes (1-2 hours)
2. Add button system to cards (1 hour)
3. Update typography throughout (30 minutes)
4. Refine card styling and remove inline styles (1 hour)
5. Test all interactive states (30 minutes)
6. Accessibility audit with keyboard navigation (30 minutes)

Total estimated time: 5 hours for complete implementation