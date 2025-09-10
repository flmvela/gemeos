Primary Brand Colors
```css
--gemeos-dark-primary: #030213     /* Deep space blue - primary brand */
--gemeos-dark-secondary: #14112e   /* Secondary dark */
--gemeos-medium-primary: #1e1b4b   /* Medium blue */
--gemeos-medium-secondary: #312e81 /* Medium purple */
--gemeos-light-center: #4c46a0     /* Light purple center */
--gemeos-accent-cyan: #06b6d4      /* Turquoise accent */
--gemeos-accent-purple: #8b5cf6    /* Purple accent */
--gemeos-accent-pink: #ec4899      /* Pink accent */
```

Semantic Colors
```css
/* Status Indicators */
--status-online: #10b981     /* Green - online */
--status-away: #f59e0b       /* Yellow - away */
--status-offline: #6b7280    /* Gray - offline */

/* Feedback Colors */
--success: #10b981           /* Green */
--warning: #f59e0b           /* Amber */
--error: #ef4444             /* Red */
--info: #3b82f6              /* Blue */
```

Gradient System
```css
/* Primary Button Gradient */
background: linear-gradient(to right, #06b6d4, #8b5cf6)
hover: linear-gradient(to right, #0891b2, #7c3aed)

/* Avatar Gradients */
primary: linear-gradient(to right, #06b6d4, #8b5cf6)
secondary: linear-gradient(to right, #8b5cf6, #ec4899)

/* Sidebar Background */
background: linear-gradient(180deg, #030213 0%, #1e1b4b 50%, #312e81 100%)
```

📝 Typography System

Font Weights
`font-normal` (400) - Body text, descriptions
`font-medium` (500) - Labels, secondary headings
`font-semibold` (600) - Card titles, section headers
`font-bold` (700) - KPI numbers, primary data

Font Sizes & Usage
```css
text-xs     /* 12px - Timestamps, meta info, badges */
text-sm     /* 14px - Secondary text, table content */
text-base   /* 16px - Primary body text, form inputs */
text-lg     /* 18px - Card titles, section headers */
text-xl     /* 20px - Page titles */
text-2xl    /* 24px - Dashboard main title, KPI numbers */
```

Text Colors
```css
text-gray-900    /* Primary text - #111827 */
text-gray-700    /* Secondary text - #374151 */
text-gray-600    /* Tertiary text - #4b5563 */
text-gray-500    /* Meta text - #6b7280 */
text-white       /* White text on dark backgrounds */
text-white/60    /* Muted white text - 60% opacity */
text-white/70    /* Semi-muted white text - 70% opacity */
```

🧩 Component Patterns

Cards
```tsx
// Standard Card
<Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
  <CardHeader className="p-6">
    <h3 className="text-lg font-semibold text-gray-900">Title</h3>
    <p className="text-gray-600 text-sm">Description</p>
  </CardHeader>
  <CardContent className="p-6 pt-0">
    {/* Content */}
  </CardContent>
</Card>

// KPI Card
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <div className="text-sm font-medium text-gray-700">Label</div>
    <Icon className="h-4 w-4 text-[color]" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-gray-900">Value</div>
    <p className="text-xs text-[color] flex items-center mt-1">
      <TrendingUpIcon className="w-3 h-3 mr-1" />
      Change indicator
    </p>
  </CardContent>
</Card>
```

Buttons
```tsx
// Primary Button
<Button className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white hover:from-[#0891b2] hover:to-[#7c3aed] px-4 py-2 rounded-md font-medium transition-all duration-200">
  <Icon className="w-4 h-4 mr-2" />
  Button Text
</Button>

// Secondary Button
<Button variant="outline" className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md font-medium transition-all duration-200">
  <Icon className="w-4 h-4 mr-2" />
  Button Text
</Button>
```

Tables
```tsx
<table className="w-full">
  <thead>
    <tr className="border-b border-gray-200">
      <th className="text-left py-3 px-4 font-medium text-gray-900">Header</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4">Content</td>
    </tr>
  </tbody>
</table>
```

Badges
```tsx
// Domain Badge
<Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
  Domain
</Badge>

// Status Badge
<Badge className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white px-2 py-1 rounded-full text-xs font-medium">
  <Icon className="w-3 h-3 mr-1" />
  Premium
</Badge>
```

Avatars
```tsx
// Standard Avatar
<Avatar className="h-8 w-8 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] text-white text-xs rounded-full flex items-center justify-center font-medium">
  {initials}
</Avatar>

// Large Avatar
<Avatar className="h-10 w-10 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white text-sm rounded-full flex items-center justify-center font-medium">
  {initials}
</Avatar>
```

🎯 Status Indicators

Online Status Dots
```tsx
// Online
<div className="w-2 h-2 rounded-full bg-green-400" />

// Away
<div className="w-2 h-2 rounded-full bg-yellow-400" />

// Offline
<div className="w-2 h-2 rounded-full bg-gray-400" />
```

Notification Indicators
```tsx
// Active Notification
<div className="relative">
  <BellIcon className="w-5 h-5 text-amber-500" />
  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
  </div>
</div>

// Inactive Notification
<BellIcon className="w-5 h-5 text-gray-300" />
```

📐 Spacing & Layout

Grid Systems
```tsx
// KPI Cards (4 columns)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// Main Layout (3 columns)
<div className="grid lg:grid-cols-3 gap-6">

// Content Areas
<div className="space-y-6">  /* Vertical spacing between sections */
<div className="space-y-4">  /* Vertical spacing between items */
<div className="space-y-3">  /* Tight vertical spacing */
```

Padding Standards
```css
p-2    /* 8px - Tight padding */
p-3    /* 12px - Menu items, small buttons */
p-4    /* 16px - Standard padding */
p-6    /* 24px - Card headers/content */
px-4   /* Horizontal: 16px - Buttons */
py-2   /* Vertical: 8px - Buttons */
py-3   /* Vertical: 12px - Table cells */
```

Margins & Gaps
```css
gap-1    /* 4px - Badge spacing */
gap-3    /* 12px - Icon-text spacing */
gap-4    /* 16px - Form elements */
gap-6    /* 24px - Card grids */
mb-2     /* 8px - Small bottom margin */
mt-1     /* 4px - Tiny top margin */
mr-2     /* 8px - Icon right margin */
```

🎨 Sidebar Design System

Sidebar Background
```css
background: linear-gradient(180deg, #030213 0%, #1e1b4b 50%, #312e81 100%)
```

Navigation States
```tsx
// Active Navigation Item
className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 bg-white/15 text-white font-medium`}

// Inactive Navigation Item
className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 text-white/70 hover:text-white hover:bg-white/10`}

// Sub-menu Active
className={`w-full text-left p-2 rounded-md transition-all duration-200 bg-white/12 text-white font-medium`}

// Sub-menu Inactive
className={`w-full text-left p-2 rounded-md transition-all duration-200 text-white/60 hover:text-white hover:bg-white/8`}
```

🔄 Interactive States

Hover Effects
```css
/* Table Rows */
hover:bg-gray-50 transition-colors

/* Buttons */
hover:from-[#0891b2] hover:to-[#7c3aed] transition-all duration-200

/* Navigation */
hover:text-white hover:bg-white/10 transition-all duration-200
```

Transitions
```css
transition-all duration-200    /* Standard transition */
transition-colors             /* Color-only transition */
transition-transform          /* Transform-only transition */
```

🎯 Icon System

Icon Sizes
```tsx
className="w-3 h-3"    /* 12px - Tiny icons in text */
className="w-4 h-4"    /* 16px - Standard icons */
className="w-5 h-5"    /* 20px - Navigation icons */
className="w-8 h-8"    /* 32px - Small avatars */
className="w-10 h-10"  /* 40px - Medium avatars */
className="w-12 h-12"  /* 48px - Large placeholders */
```

Icon Colors by Context
```tsx
// KPI Card Icons
className="h-4 w-4 text-blue-600"    /* Teachers */
className="h-4 w-4 text-purple-600"  /* Students */
className="h-4 w-4 text-pink-600"    /* Classes */
className="h-4 w-4 text-amber-600"   /* Messages */

// Table Icons
className="w-4 h-4 text-gray-400"    /* Data context icons */

// Notification Icons
className="w-5 h-5 text-amber-500"   /* Active notifications */
className="w-5 h-5 text-gray-300"    /* Inactive notifications */
```

📊 Data Visualization

Progress Bars
```tsx
<div className="w-full bg-gray-200 rounded-full h-2 mt-2">
  <div className="bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] h-2 rounded-full" style={{ width: '87%' }} />
</div>
```

KPI Growth Indicators
```tsx
<p className="text-xs text-green-600 flex items-center mt-1">
  <TrendingUpIcon className="w-3 h-3 mr-1" />
  +2 from last month
</p>
```

🔧 Implementation Guidelines

Component Import Pattern
```tsx
import { Button } from "./components/ui/button";
import { Card, CardHeader, CardContent } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Avatar } from "./components/ui/avatar";
```

Responsive Design
```tsx
// Mobile-first approach
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
className="flex flex-col lg:flex-row"
className="space-y-4 lg:space-y-0 lg:space-x-4"
```

Accessibility Patterns
```tsx
// Proper semantic HTML
<table>
<thead>
<th scope="col">

// Screen reader friendly
aria-label="Add new teacher"
alt="Teacher avatar"

// Keyboard navigation
tabIndex={0}
```