# 1. Design Tokens & Color System

## Core Color Palette
- **Primary:** `#030213` (Deep navy) – Used for headers, primary buttons, and key UI elements  
- **Background:** `#ffffff` (White) – Main application background  
- **Foreground:** Near-black text (`oklch(0.145 0 0)`)  
- **Muted:** `#ececf0` (Light gray) – Subtle backgrounds and disabled states  
- **Muted Foreground:** `#717182` (Medium gray) – Secondary text  

## Semantic Colors
- **Destructive:** `#d4183d` (Red) – Errors, delete actions  
- **Success/Green:** Used for approved status, positive metrics  
- **Warning/Yellow:** Used for pending status, caution states  
- **Info/Blue:** Used for informational elements, approved concepts  
- **Learning Gradient:** Blue to cyan (`#0ea5e9` to `#06b6d4`)  

## Status-Specific Colors
- **Approved:** `bg-green-100 text-green-800`  
- **Pending:** `bg-yellow-100 text-yellow-800`  
- **Rejected:** `bg-red-100 text-red-800`  
- **AI Suggested:** `bg-blue-100 text-blue-800`  

# 2. Typography System

## Font Hierarchy
- **Base Font Size:** 14px (customizable via `--font-size`)  
- **H1:** 24px (1.5rem) – Page titles  
- **H2:** 20px (1.25rem) – Section headers  
- **H3:** 18px (1.125rem) – Subsection headers  
- **Body:** 16px (1rem) – Default text  
- **Small:** 14px (0.875rem) – Secondary text  
- **Micro:** 12px (0.75rem) – Labels, metadata  

## Font Weights
- **Medium:** 500 – Headings, labels, buttons  
- **Normal:** 400 – Body text, descriptions  

# 3. Component Architecture

## Core UI Components (ShadCN)
- **Cards:** Primary content containers with consistent padding and shadows  
- **Buttons:** Multiple variants (default, outline, ghost, destructive)  
- **Badges:** Status indicators with semantic colors  
- **Tables:** Data display with consistent styling  
- **Tabs:** Navigation within detailed views  
- **Dialogs/Modals:** For complex interactions  
- **Forms:** Input fields, textareas, selects with consistent styling  

## Custom Components
- **DomainCard:** Domain overview with stats and actions  
- **ConceptNode:** Tree view representation of concepts  
- **StatsOverview:** Dashboard metrics display  
- **NavigationOverlay:** Contextual navigation menu  

# 4. Layout & Visual Hierarchy

## Page Structure
```
Header (sticky, z-30)
├── Logo/Title (left)
└── User Profile Menu (right)

Main Content
├── Back Button (conditional)
├── Page Title & Actions
├── Tab Navigation (if applicable)
└── Content Area
    ├── Overview Cards/Stats
    ├── Primary Data Table/List
    └── Detail Panels
```

## Grid System
- **Container:** `container mx-auto px-6` – Consistent max-width with horizontal padding  
- **Cards Grid:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` – Responsive layouts  
- **Stats Display:** `grid grid-cols-3` – Equal width metric displays  

## Spacing System
- **Section Spacing:** `py-8` (32px vertical)  
- **Card Padding:** `p-6` (24px all sides)  
- **Element Gaps:** `gap-4` (16px), `gap-6` (24px), `gap-8` (32px)  

# 5. Iconography

## Icon Library
- **Lucide React** (`h-4 w-4` standard size)  

## Common Icons by Function
- **Navigation:** `ArrowLeft`, `ArrowRight`, `ChevronDown`  
- **Actions:** `Edit3`, `Trash2`, `Plus`, `Settings`  
- **Status:** `Check` (approve), `X` (reject), `Target` (learning goals)  
- **Data:** `Users`, `Network`, `BarChart3`, `Calendar`  
- **Relationships:** `Link`, `Unlink`, `ArrowRight`, `ArrowLeft`  

## Color Coding
- **Green:** Positive actions (`text-green-600`)  
- **Red:** Destructive actions (`text-red-600`)  
- **Blue:** Navigation/info (`text-blue-600`)  
- **Gray:** Neutral actions (`text-gray-600`)  

# 6. Interaction Design

## Hover States
- **Cards:** `hover:shadow-md transition-shadow`  
- **Buttons:** Background color changes with smooth transitions  
- **Table Rows:** `hover:bg-gray-50`  

## Focus States
- **Outline:** Ring-based focus indicators  
- **Accessibility:** Keyboard navigation support  

## Loading States
- **Skeleton:** Placeholder components during data loading  
- **Spinners:** Gradient-based loading animations  

# 7. Navigation Patterns

## Breadcrumb Navigation
- Back buttons with contextual labels  
- Clear hierarchy: Dashboard → Domain → Concepts → Concept Detail  

## Tab Navigation
- Consistent 3-tab structure: Overview, Relationships, Settings  
- State persistence across navigation  

## Action Patterns
- **Primary actions:** Black buttons – Create, Save, Add  
- **Secondary actions:** Outline buttons – Manage, Analytics, Edit  
- **Destructive actions:** Red – Delete, Remove  

# 8. Data Display Patterns

## Tables
- Zebra striping with hover states  
- Action columns with icon buttons  
- Sortable headers with consistent styling  
- Checkboxes for bulk operations  

## Status Management
- Badge-based status indicators  
- Color-coded by semantic meaning  
- Consistent across all entities (domains, concepts)  

## Metrics Display
- Large numbers with descriptive labels  
- Color-coded by metric type  
- Grid-based layouts for consistency  

# 9. Responsive Design

## Breakpoints
- **Mobile:** Single column layouts  
- **Tablet:** `md:` prefix for 2-column grids  
- **Desktop:** `lg:` prefix for 3+ column layouts  

## Adaptive Components
- Hidden elements on mobile (`hidden sm:block`)  
- Responsive grid systems  
- Flexible button groups  

# 10. Dark Mode Support

The system includes comprehensive dark mode support with:
- Complete color palette inversion  
- Consistent contrast ratios  
- Preserved semantic meaning across themes