Based on the current tenant dashboard implementation in `/components/SelfContainedLayout.tsx`, here are all the components used:

Custom SVG Icon Components
`HomeIcon` - Dashboard navigation
`SettingsIcon` - Settings & Setup navigation  
`UsersIcon` - Students card and table
`GraduationCapIcon` - Teachers card and navigation
`SchoolIcon` - Classes card and table
`CrownIcon` - Premium badge
`ChevronRightIcon` - Menu expansion arrows
`MenuIcon` - Sidebar toggle (open)
`XIcon` - Sidebar toggle (close)
`BookOpenIcon` - Domains/learning content
`TrendingUpIcon` - Growth indicators
`ActivityIcon` - Usage metrics
`UserPlusIcon` - Add teacher button
`PlusIcon` - Add class button
`MailIcon` - New messages card
`BellIcon` - Notifications in teacher table

Simple UI Components (Custom Built)
`Card` - Main container component
`CardHeader` - Card header section
`CardContent` - Card content section  
`Button` - Action buttons with variants (default, outline)
`Badge` - Status indicators and domain tags
`Avatar` - User profile circles with initials

Main Layout Components
`Dashboard` - Main dashboard content component
`SelfContainedLayout` - Complete tenant admin layout wrapper

Current Dashboard Structure

Top Cards Section (4 cards):
Teachers Card - Shows total teachers (12) with growth indicator
Students Card - Shows total students (289) with growth indicator  
Classes Card - Shows total classes (28) with growth indicator
New Messages Card - Shows unread messages (7)

Action Buttons:
Add Teacher - Primary gradient button
Add Class - Secondary outline button

Main Content:
Teachers Overview Table with columns:
Teacher Name (with avatar and status)
Domains Taught (with badges)
Number of Classes 
Number of Students
Notifications (bell with indicator)

Sidebar Navigation:
Collapsible menu system with:
Dashboard
Settings & Setup (with submenu)
Teacher Management (with submenu)
Class Management (with submenu)  
Student Overview (with submenu)

Layout Features:
Responsive sidebar (collapsible)
Tenant branding with Gemeos logo and Premium badge
Usage tracking at bottom of sidebar
Header with breadcrumb and user info

External Dependencies
The tenant dashboard is completely self-contained with no external component library dependencies - all UI components are custom-built inline within the `SelfContainedLayout.tsx` file.

Styling
Uses Tailwind CSS classes
Implements Gemeos brand colors (#030213, #06b6d4, gradients)
Responsive design with mobile-friendly collapsible sidebar
Hover effects and smooth transitions throughout
