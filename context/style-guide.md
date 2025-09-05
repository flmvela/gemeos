# Gemeos Design System Style Guide

## Overview
This style guide is derived from the UI screens found in the `context/screens` folder and establishes consistent design patterns for the Gemeos educational platform.

## Color Palette

### Primary Colors
- **Deep Purple**: `#110D59` - Main brand color, used for navigation bars, primary backgrounds
- **Medium Purple**: `#28246F` - Secondary brand color, used for icons and accent elements
- **Purple Gray**: `#7E7BB3` - Tertiary color for secondary text and borders

### Interactive Colors (from Button.svg analysis)
- **Primary Blue**: `#0B5FAE` - Main action buttons, primary CTAs
- **Secondary Blue**: `#0E77D9` - Secondary action buttons
- **Tertiary Blue**: `#08437A` - Less prominent action buttons
- **Disabled Gray**: `#E3E4E8` - Disabled button backgrounds
- **Disabled Text**: `#D3D4DA` - Disabled button text

### Extended Color Palette (from Color Style.svg analysis)
#### Grayscale Tokens
- **Darkest**: `#2B283D` - Deep dark for high contrast text
- **Dark**: `#4C4958` - Dark gray for secondary text
- **Medium**: `#55555F` - Medium gray for muted content
- **Light**: `#7D7A89` - Light gray for borders and dividers
- **Lightest**: `#D9D9D9` - Very light gray for subtle backgrounds

#### Purple Scale Extended
- **Purple 900**: `#110D59` - Main brand (unchanged)
- **Purple 700**: `#28246F` - Secondary brand (unchanged) 
- **Purple 600**: `#44408A` - Medium purple variant
- **Purple 400**: `#7E7BB3` - Light purple for text (unchanged)
- **Purple 300**: `#B4B1E6` - Very light purple
- **Purple 100**: `#DAD9F5` - Ultra light purple tint

#### Blue Action Scale
- **Blue 900**: `#08437A` - Darkest blue for tertiary actions
- **Blue 700**: `#0B5FAE` - Primary action blue (unchanged)
- **Blue 500**: `#0E77D9` - Secondary action blue (unchanged)

### Accent Colors
- **Light Blue**: `#A3D1FC` - Used for active states and highlights
- **Magenta**: `#AF20C7` - Used for status indicators and avatars
- **White**: `#FFFFFF` - Primary text color and card backgrounds

### Background Colors
- **Light Gray**: `#F1F2F4` - Main application background
- **White**: `#FFFFFF` - Card and component backgrounds

### Status Colors (from PNG analysis)
- **Red**: Used for "Hard" difficulty/priority indicators
- **Orange**: Used for "Medium" difficulty/priority indicators
- **Green**: Used for completion/success states

## Typography

### Hierarchy (from Text Style.svg analysis)
- **Large Text**: `#222127` - Primary headings and important labels
- **Medium Text**: `#55555F` - Secondary text, descriptions, form labels
- **Light Text**: `#B3B1BB` - Placeholder text, helper text, timestamps

### Typography Scale
Based on the comprehensive text style specifications:
- **Heading 1**: Large, bold for primary page titles
- **Heading 2**: Medium-large for section headers
- **Heading 3**: Medium for subsection headers
- **Body Large**: Standard text for main content
- **Body Medium**: Default text size for most UI elements
- **Body Small**: Smaller text for captions and metadata
- **Caption**: Very small text for timestamps and fine print

### Font Characteristics
- Clean, sans-serif typography (Inter font family)
- Excellent contrast ratios across all text colors
- Consistent spacing and alignment
- Multiple font weights available (400, 500, 600, 700)

## Layout Patterns

### Sidebar Navigation
- **Width**: 258px fixed width
- **Height**: Full viewport (900px+)
- **Background**: Deep Purple (`#110D59`)
- **Padding**: 16px horizontal margins
- **Border Radius**: 8px for internal components, 10px for certain elements

### Cards and Components
- **Border Radius**: 8px standard, 10px for elevated components
- **Spacing**: 16px base unit for margins and padding
- **Shadows**: Subtle elevation for cards and dropdowns

### Grid System
- **List Items**: Consistent 48px height for navigation items
- **Icon Size**: 12px radius for circular elements, varied sizes for functional icons
- **Spacing**: 16px standard gap between components

## Component Patterns

### Button System (from Button.svg analysis)
Based on the comprehensive button design specifications:

#### Primary Buttons
- **Background**: `#0B5FAE` (Primary Blue)
- **Height**: 51px
- **Border Radius**: 8px
- **Text Color**: White
- **Font Weight**: Medium
- **Use Case**: Main actions, CTAs

#### Secondary Buttons  
- **Background**: `#0E77D9` (Lighter Blue)
- **Height**: 51px
- **Border Radius**: 8px
- **Text Color**: White
- **Font Weight**: Medium
- **Use Case**: Secondary actions

#### Tertiary Buttons
- **Background**: `#08437A` (Darker Blue)
- **Height**: 51px  
- **Border Radius**: 8px
- **Text Color**: White
- **Font Weight**: Medium
- **Use Case**: Less prominent actions

#### Button States
- **Normal**: Solid background with brand colors
- **Hover**: 5% opacity overlay (`fill-opacity="0.05"`)
- **Click**: 15% opacity overlay (`fill-opacity="0.15"`)
- **Disabled**: `#E3E4E8` (Light Gray) with `#D3D4DA` (Gray) text

### Form Components (from Component.svg analysis)
Advanced form elements and interactive components:

#### Input Fields (from Text Form.svg analysis)
- **Background**: `#F8F9FD` - Light blue-gray for input backgrounds
- **Border**: Subtle border with 7.5px radius
- **Height**: 48px standard height for text inputs
- **Text Color**: `#55555F` (Medium gray) for input text
- **Placeholder Text**: `#B3B1BB` (Light gray) for placeholder text
- **Focus States**: Blue outline matching button colors
- **Label Text**: `#55555F` positioned above input fields

#### Navigation Elements
- **Active States**: Light blue highlight (`#A3D1FC`)
- **Hover States**: Subtle opacity changes  
- **Icons**: Line-based icons with 1.5px stroke width
- **Text**: White text on dark purple background

#### Complex Components
- **Headers**: Navigation bars with `#110D59` background
- **Sub-headers**: Secondary information areas
- **Card Containers**: White backgrounds with proper spacing
- **Interactive Lists**: Hover states and selection indicators

### Status Indicators
- **Badges**: Rounded rectangles with colored backgrounds
- **Priority Levels**: Color-coded (Red = Hard, Orange = Medium, Green = Complete)
- **User Avatars**: Circular with colored backgrounds

### Data Display
- **Tables/Lists**: Clean rows with proper spacing
- **Cards**: White backgrounds with subtle shadows
- **Statistics**: Clear numerical displays with descriptive labels

## Spacing System

### Base Units
- **Small**: 8px
- **Medium**: 16px (primary spacing unit)
- **Large**: 24px
- **Extra Large**: 48px

### Component Spacing
- **Card Padding**: 16px
- **List Item Height**: 48px
- **Icon Margins**: 8px from text
- **Section Gaps**: 24px between major sections

## Interactive States

### Hover Effects
- Subtle opacity changes (0.8-0.9)
- Background color shifts for clickable elements
- Smooth transitions (0.2s ease)

### Active States
- Distinct color changes using accent colors
- Clear visual feedback for current selection
- Maintained accessibility contrast

### Focus States
- Visible focus indicators for keyboard navigation
- High contrast outlines
- Consistent with brand colors

## Accessibility Guidelines

### Color Contrast
- High contrast between text and backgrounds
- Sufficient color differentiation for status indicators
- Alternative indicators beyond color alone

### Interactive Elements
- Minimum 44px touch targets
- Clear focus indicators
- Proper semantic markup

## Icon System (from Iconography.svg analysis)

### Style Specifications
- **Primary Color**: `#130F26` - Dark navy for standard icons
- **Secondary Color**: `#200E32` - Darker variant for emphasis
- **Line Weight**: Clean, minimal stroke design
- **Corner Style**: Rounded line caps and joins
- **Consistent Grid**: All icons aligned to 24px grid system

### Icon Categories
Based on comprehensive iconography analysis:
- **Navigation Icons**: Arrows (left, right, up, down, circular)
- **Action Icons**: Play, export, import, close, expand
- **UI Icons**: Chevrons, carets, interface controls
- **Directional Icons**: Comprehensive set of directional indicators

### Size Variants
- **Small**: 16px for inline text icons
- **Medium**: 20px for standard UI icons  
- **Large**: 24px for prominent interface elements
- **Extra Large**: 32px for feature icons and headers

### Color Usage
- **Dark Backgrounds**: White icons for maximum contrast
- **Light Backgrounds**: `#130F26` (Dark navy) for clarity
- **Interactive States**: Blue tints matching button colors
- **Disabled States**: `#B3B1BB` (Light gray) for inactive icons

### Usage Guidelines
- Consistent icon placement (left of text in navigation)
- 8px standard spacing between icons and text
- Semantic meaning maintained across the application
- Proper alignment within button and menu components

## Cards and Containers

### Elevation
- **Level 1**: Subtle shadow for basic cards
- **Level 2**: Medium shadow for modals and dropdowns
- **Level 3**: Strong shadow for floating elements

### Borders
- **Radius**: 8px standard, 10px for prominent elements
- **Color**: Light gray (`#E5E7EB`) for subtle borders
- **Width**: 1px standard

## Data Visualization

### Progress Indicators
- Circular and linear progress bars
- Brand color gradients
- Clear percentage or status labels

### Status Badges
- Consistent sizing and shape
- Color-coded by meaning
- Readable typography

## Implementation Notes

### CSS Variables Recommended
```css
/* Brand Colors */
--primary-purple: #110D59;
--secondary-purple: #28246F;
--accent-blue: #A3D1FC;

/* Extended Purple Scale */
--purple-900: #110D59;
--purple-700: #28246F;
--purple-600: #44408A;
--purple-400: #7E7BB3;
--purple-300: #B4B1E6;
--purple-100: #DAD9F5;

/* Button Colors */
--button-primary: #0B5FAE;
--button-secondary: #0E77D9;
--button-tertiary: #08437A;
--button-disabled: #E3E4E8;
--button-disabled-text: #D3D4DA;

/* Typography Colors */
--text-primary: #222127;
--text-secondary: #55555F;
--text-placeholder: #B3B1BB;

/* Grayscale Tokens */
--gray-darkest: #2B283D;
--gray-dark: #4C4958;
--gray-medium: #55555F;
--gray-light: #7D7A89;
--gray-lightest: #D9D9D9;

/* Form Elements */
--input-background: #F8F9FD;
--input-border-radius: 7.5px;
--input-height: 48px;

/* Icon Colors */
--icon-primary: #130F26;
--icon-secondary: #200E32;

/* Layout */
--background-light: #F1F2F4;
--border-radius: 8px;
--spacing-unit: 16px;
--button-height: 51px;
--icon-spacing: 8px;
```

### Component Consistency
- Maintain consistent spacing using the 16px base unit
- Use established color palette throughout
- Follow the established typography hierarchy
- Implement consistent hover and focus states

## Quality Assurance

### Design Review Checklist
- [ ] Colors match the established palette
- [ ] Spacing follows the 16px grid system
- [ ] Typography hierarchy is maintained
- [ ] Interactive states are consistent
- [ ] Accessibility guidelines are followed
- [ ] Component patterns are reused appropriately

This style guide should be referenced for all UI development to ensure consistency across the Gemeos platform.