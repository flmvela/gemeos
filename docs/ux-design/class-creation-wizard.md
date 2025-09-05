# UX Design Package: Teacher Class Creation Wizard

## Executive Summary
A comprehensive UX design for a 5-step vertical wizard enabling teachers to create classes efficiently within the Gemeos educational platform. The design prioritizes progressive disclosure, accessibility (WCAG 2.1 AA), and responsive behavior across all devices.

---

## 1. INFORMATION ARCHITECTURE

### 1.1 Page Structure Hierarchy

```
/teacher/classes/create
├── Wizard Container (Vertical Layout)
│   ├── Progress Indicator (Top)
│   ├── Step Content Area (Center)
│   │   ├── Step 1: Domain Selection
│   │   ├── Step 2: Class Configuration
│   │   ├── Step 3: Student Management
│   │   ├── Step 4: Review & Confirmation
│   │   └── Step 5: Success State
│   └── Navigation Controls (Bottom)
└── Context Panel (Optional - Desktop Only)
```

### 1.2 Data Flow Architecture

```
User Input → Validation → Zustand Store → API Call → Database
     ↓            ↓             ↓            ↓          ↓
  UI State    Error State  Local State  Response   Persistence
```

### 1.3 Navigation Flow

```
Entry Points:
- Teacher Dashboard → "Create Class" Button
- Classes List → "New Class" Action
- Quick Actions Menu → "Create Class"

Exit Points:
- Success → View Class Details
- Success → Add Another Class
- Cancel → Return to Previous Page
```

---

## 2. USER JOURNEY MAPS

### 2.1 Primary Journey: Sarah Chen (Music Teacher)

**Scenario**: Creating a weekly piano class for intermediate students

| Step | User Action | Thoughts | Emotions | System Response |
|------|------------|----------|----------|-----------------|
| 1 | Clicks "Create Class" | "I need to set up my Tuesday class" | Motivated | Shows domain selection (auto-selected if single domain) |
| 2 | Configures class details | "Weekly lessons, 4:30 PM works best" | Focused | Real-time validation, shows available time slots |
| 3 | Adds 5 students | "Let me add Emma first, she's confirmed" | Confident | Auto-saves each student, shows count |
| 4 | Reviews details | "Everything looks correct" | Satisfied | Highlights any warnings or missing info |
| 5 | Creates class | "Great, now I can start planning" | Accomplished | Shows success with next actions |

**Pain Points Addressed**:
- Auto-selection reduces clicks
- Inline validation prevents errors
- Auto-save prevents data loss
- Clear progress indication

---

## 3. WIREFRAMES

### 3.1 Step 1: Domain Selection

```
┌─────────────────────────────────────────────────┐
│ Create New Class                          [X]   │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Progress: Step 1 of 5                       │ │
│ │ [●][○][○][○][○] Domain Selection            │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Select Teaching Domain                          │
│ ┌─────────────────────────────────────────────┐ │
│ │ Which subject will you be teaching?         │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ ○ Music Theory & Performance                │ │
│ │   Elementary to advanced music instruction  │ │
│ ├─────────────────────────────────────────────┤ │
│ │ ○ Mathematics                               │ │
│ │   K-12 mathematics curriculum                │ │
│ ├─────────────────────────────────────────────┤ │
│ │ ○ Language Arts                             │ │
│ │   Reading, writing, and communication       │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌──────────────┐  ┌──────────────────────────┐ │
│ │ Cancel       │  │ Continue →               │ │
│ └──────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────┘

Note: If teacher has only 1 domain, skip to Step 2
```

### 3.2 Step 2: Class Configuration

```
┌─────────────────────────────────────────────────┐
│ Create New Class                          [X]   │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Progress: Step 2 of 5                       │ │
│ │ [●][●][○][○][○] Class Details               │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Configure Your Class                            │
│                                                  │
│ Class Name *                                    │
│ ┌─────────────────────────────────────────────┐ │
│ │ Intermediate Piano - Tuesday Group          │ │
│ └─────────────────────────────────────────────┘ │
│ Max 60 characters                               │
│                                                  │
│ Difficulty Level *                              │
│ ┌─────────────────────────────────────────────┐ │
│ │ ▼ Select level                              │ │
│ │ ┌───────────────────────────────────────┐   │ │
│ │ │ Beginner (Level 1)                    │   │ │
│ │ │ Elementary (Level 2)                  │   │ │
│ │ │ → Intermediate (Level 3)              │   │ │
│ │ │ Advanced (Level 4)                    │   │ │
│ │ │ Expert (Level 5)                      │   │ │
│ │ └───────────────────────────────────────┘   │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Lesson Frequency *                              │
│ ┌─────────────────────────────────────────────┐ │
│ │ ● Weekly    ○ Bi-weekly    ○ Monthly       │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Class Schedule                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Slot 1                                      │ │
│ │ Day: [Tuesday ▼]  Time: [4:30 PM - 5:30 PM]│ │
│ │                                   [Remove]  │ │
│ ├─────────────────────────────────────────────┤ │
│ │ [+ Add Another Time Slot]                   │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Student Messaging                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ [✓] Allow students to message each other    │ │
│ │     Enable peer communication within class  │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌──────────────┐  ┌──────────────────────────┐ │
│ │ ← Back       │  │ Continue →               │ │
│ └──────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 3.3 Step 3: Student Management

```
┌─────────────────────────────────────────────────┐
│ Create New Class                          [X]   │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Progress: Step 3 of 5                       │ │
│ │ [●][●][●][○][○] Add Students                │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Add Students to Your Class                      │
│ Students: 3 added                               │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Add New Student                             │ │
│ │ ┌───────────────────┬───────────────────┐   │ │
│ │ │ Name *            │ Email *           │   │ │
│ │ ├───────────────────┼───────────────────┤   │ │
│ │ │ [               ] │ [               ] │   │ │
│ │ └───────────────────┴───────────────────┘   │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │ Personal Invitation Message (Optional)  │ │ │
│ │ │ [                                      ] │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ │ [+ Add Student]                             │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Current Students                                │
│ ┌─────────────────────────────────────────────┐ │
│ │ 1. Emma Rodriguez                           │ │
│ │    emma.r@email.com         [Edit][Remove] │ │
│ ├─────────────────────────────────────────────┤ │
│ │ 2. Michael Chen                             │ │
│ │    m.chen@email.com         [Edit][Remove] │ │
│ ├─────────────────────────────────────────────┤ │
│ │ 3. Sophia Williams                          │ │
│ │    sophia.w@email.com       [Edit][Remove] │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ⓘ Students will receive email invitations      │
│   after class creation                          │
│                                                  │
│ ┌──────────────┐  ┌──────────────────────────┐ │
│ │ ← Back       │  │ Continue →               │ │
│ └──────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 3.4 Step 4: Review & Confirmation

```
┌─────────────────────────────────────────────────┐
│ Create New Class                          [X]   │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Progress: Step 4 of 5                       │ │
│ │ [●][●][●][●][○] Review & Confirm            │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ Review Your Class Details                       │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ CLASS INFORMATION                [Edit]     │ │
│ ├─────────────────────────────────────────────┤ │
│ │ Domain: Music Theory & Performance          │ │
│ │ Name: Intermediate Piano - Tuesday Group    │ │
│ │ Level: Intermediate (Level 3)               │ │
│ │ Frequency: Weekly                           │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ SCHEDULE                         [Edit]     │ │
│ ├─────────────────────────────────────────────┤ │
│ │ • Tuesdays, 4:30 PM - 5:30 PM              │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ STUDENTS (3)                     [Edit]     │ │
│ ├─────────────────────────────────────────────┤ │
│ │ • Emma Rodriguez (emma.r@email.com)        │ │
│ │ • Michael Chen (m.chen@email.com)          │ │
│ │ • Sophia Williams (sophia.w@email.com)     │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ SETTINGS                         [Edit]     │ │
│ ├─────────────────────────────────────────────┤ │
│ │ • Student messaging: Enabled                │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ ⚠ Important: Email invitations will be sent    │
│   immediately after class creation              │
│                                                  │
│ ┌──────────────┐  ┌──────────────────────────┐ │
│ │ ← Back       │  │ Create Class             │ │
│ └──────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 3.5 Step 5: Success State

```
┌─────────────────────────────────────────────────┐
│ Create New Class                          [X]   │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Progress: Complete                          │ │
│ │ [●][●][●][●][●] Success!                    │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│        ┌───────┐                                │
│        │   ✓   │                                │
│        └───────┘                                │
│                                                  │
│     Class Created Successfully!                 │
│                                                  │
│ "Intermediate Piano - Tuesday Group" has been   │
│ created and 3 invitation emails have been sent. │
│                                                  │
│ Class ID: CLS-2025-0142                        │
│                                                  │
│ What would you like to do next?                │
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ [View Class Details]                        │ │
│ │ Go to your new class page                   │ │
│ ├─────────────────────────────────────────────┤ │
│ │ [Create Another Class]                      │ │
│ │ Set up another class                        │ │
│ ├─────────────────────────────────────────────┤ │
│ │ [Go to Dashboard]                           │ │
│ │ Return to teacher dashboard                 │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 4. COMPONENT SPECIFICATIONS

### 4.1 Core Components

#### Progress Indicator Component
```typescript
interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{
    label: string;
    status: 'completed' | 'current' | 'upcoming';
  }>;
}
```

**Visual Specifications:**
- Height: 80px
- Step circles: 32px diameter
- Connecting lines: 2px height, 100% width between steps
- Colors:
  - Completed: primary (#3B82F6)
  - Current: primary with pulse animation
  - Upcoming: muted (#9CA3AF)
- Typography: 14px regular for labels

#### Form Field Component
```typescript
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: ReactNode;
}
```

**Visual Specifications:**
- Label: 14px medium, color: foreground
- Required indicator: red asterisk
- Help text: 12px regular, color: muted-foreground
- Error text: 12px medium, color: destructive
- Spacing: 8px between elements

#### Student Card Component
```typescript
interface StudentCardProps {
  name: string;
  email: string;
  personalMessage?: string;
  onEdit: () => void;
  onRemove: () => void;
}
```

**Visual Specifications:**
- Card padding: 16px
- Border: 1px solid border-color
- Border radius: 8px
- Hover state: background-color: accent
- Action buttons: ghost variant, icon size 16px

### 4.2 Layout Specifications

#### Desktop Layout (≥1024px)
- Container max-width: 800px
- Container padding: 32px
- Card padding: 24px
- Two-column layout for form fields where appropriate
- Fixed position progress indicator

#### Tablet Layout (768px - 1023px)
- Container max-width: 100%
- Container padding: 24px
- Card padding: 20px
- Single column layout
- Sticky progress indicator

#### Mobile Layout (<768px)
- Container padding: 16px
- Card padding: 16px
- Single column layout
- Collapsible progress indicator
- Full-width buttons
- Stacked navigation buttons

---

## 5. INTERACTION DESIGN

### 5.1 Micro-interactions

#### Field Focus States
- **Trigger**: User clicks/tabs to field
- **Animation**: Border color transitions to primary (200ms ease)
- **Feedback**: Subtle shadow appears (0 2px 4px rgba(0,0,0,0.1))

#### Button States
- **Default**: Background: primary, cursor: pointer
- **Hover**: Background: primary/90, transform: translateY(-1px)
- **Active**: transform: translateY(0), box-shadow: inset
- **Disabled**: opacity: 0.5, cursor: not-allowed
- **Loading**: Show spinner, disable interaction

#### Progress Animation
- **Step completion**: Circle fills with checkmark (300ms ease-out)
- **Line progression**: Width animates from 0 to 100% (500ms ease-in-out)
- **Step activation**: Pulse animation (1.5s infinite)

#### Validation Feedback
- **Success**: Green checkmark appears (fade-in 200ms)
- **Error**: Red X with shake animation (100ms x 3)
- **Warning**: Yellow triangle with pulse (1s x 2)

### 5.2 Form Validation Rules

#### Real-time Validation
- **Class Name**: Min 3 chars, max 60 chars, alphanumeric + spaces
- **Email**: RFC 5322 compliant, domain verification
- **Schedule**: No overlapping time slots, future dates only
- **Students**: Min 0, max 30 per class

#### Validation Timing
- **On blur**: Validate individual fields
- **On change**: Clear errors if valid
- **On submit**: Validate all fields
- **Debounce**: 500ms for async validations

### 5.3 Navigation Flow Control

#### Forward Navigation
- **Enabled when**: Current step validation passes
- **Behavior**: Smooth scroll to top, focus first field
- **Animation**: Slide-in from right (300ms ease-out)

#### Backward Navigation
- **Always enabled**: Except on success screen
- **Preserves data**: All input maintained
- **Animation**: Slide-in from left (300ms ease-out)

#### Exit Confirmation
- **Trigger**: User clicks close or navigates away
- **Dialog**: "You have unsaved changes. Are you sure?"
- **Options**: "Save Draft", "Discard", "Cancel"

---

## 6. RESPONSIVE DESIGN SPECIFICATIONS

### 6.1 Breakpoint System

```css
/* Mobile First Approach */
base: 0px - 639px
sm: 640px - 767px
md: 768px - 1023px
lg: 1024px - 1279px
xl: 1280px+
```

### 6.2 Component Adaptations

#### Mobile Adaptations
- **Progress Indicator**: Horizontal scroll with active step centered
- **Form Layout**: Single column, full-width inputs
- **Buttons**: Full-width, stacked vertically
- **Student Cards**: Condensed view with expand/collapse
- **Schedule Picker**: Native date/time inputs

#### Tablet Adaptations
- **Progress Indicator**: Condensed horizontal view
- **Form Layout**: Mixed 1-2 column based on content
- **Buttons**: Side-by-side with min-width 120px
- **Student Cards**: Two-column grid
- **Schedule Picker**: Custom dropdown components

#### Desktop Adaptations
- **Progress Indicator**: Full horizontal with labels
- **Form Layout**: Optimal 2-column for related fields
- **Buttons**: Right-aligned navigation
- **Student Cards**: List view with inline actions
- **Schedule Picker**: Calendar widget with time slots

### 6.3 Touch Targets

- **Minimum size**: 44x44px (WCAG 2.5.5)
- **Spacing**: 8px minimum between targets
- **Mobile buttons**: 48px height
- **Checkbox/Radio**: 24x24px with 44x44px hit area

---

## 7. ACCESSIBILITY SPECIFICATIONS

### 7.1 WCAG 2.1 AA Compliance

#### Keyboard Navigation
```
Tab Order Flow:
1. Progress indicator (read-only)
2. Step heading (h2)
3. First interactive element
4. Sequential through form
5. Navigation buttons
```

#### Screen Reader Announcements
```html
<!-- Progress -->
<div role="progressbar" 
     aria-valuenow="2" 
     aria-valuemin="1" 
     aria-valuemax="5"
     aria-label="Step 2 of 5: Class Configuration">

<!-- Required Fields -->
<label for="className">
  Class Name
  <span aria-label="required">*</span>
</label>

<!-- Error Messages -->
<div role="alert" aria-live="assertive">
  Class name must be at least 3 characters
</div>

<!-- Success State -->
<div role="status" aria-live="polite">
  Class created successfully. 3 invitations sent.
</div>
```

#### Focus Management
- **Focus trap**: Within wizard container
- **Focus restoration**: Returns to trigger element on close
- **Skip links**: "Skip to main content", "Skip to navigation"
- **Focus visible**: 2px solid outline, 2px offset

#### Color Contrast
- **Normal text**: 4.5:1 minimum ratio
- **Large text**: 3:1 minimum ratio
- **Interactive elements**: 3:1 against background
- **Error states**: Not solely color-dependent

### 7.2 Assistive Technology Support

#### Form Controls
```html
<!-- Dropdown with description -->
<select id="level" 
        aria-describedby="level-help"
        aria-invalid="false"
        aria-required="true">
  <option value="">Select level</option>
  <option value="1">Beginner (Level 1)</option>
</select>
<span id="level-help">Choose the difficulty level for your class</span>

<!-- Grouped Radio Buttons -->
<fieldset role="radiogroup" aria-required="true">
  <legend>Lesson Frequency</legend>
  <input type="radio" id="weekly" name="frequency" value="weekly">
  <label for="weekly">Weekly</label>
</fieldset>
```

#### Dynamic Content
- **Live regions**: aria-live for validation messages
- **Loading states**: aria-busy during async operations
- **Expandable sections**: aria-expanded for collapsibles
- **Count updates**: aria-atomic for student count

---

## 8. ERROR HANDLING & VALIDATION

### 8.1 Error States Design

#### Field-Level Errors
```
Visual Design:
- Border: 2px solid destructive (#EF4444)
- Background: destructive/5 (subtle red tint)
- Icon: Error icon (16px) inline with message
- Message: Below field, 12px, destructive color
```

#### Form-Level Errors
```
Visual Design:
- Alert banner at top of form
- Icon: Warning triangle (24px)
- Background: destructive/10
- Border: 1px solid destructive
- Multiple errors listed with bullets
```

#### Network Errors
```
Visual Design:
- Modal overlay or inline alert
- Retry button prominent
- Error code/details collapsible
- Contact support link
```

### 8.2 Validation Patterns

#### Preventive Validation
- **Input masks**: Phone numbers, dates
- **Character limits**: Real-time counter
- **Format hints**: Placeholder text
- **Restricted input**: Numbers only where appropriate

#### Progressive Validation
```javascript
// Validation stages
1. Format check (client-side, instant)
2. Business rules (client-side, on blur)
3. Server validation (async, on submit)
4. Final confirmation (server response)
```

### 8.3 Error Recovery

#### Auto-save Draft
- **Frequency**: Every 30 seconds
- **Trigger**: On valid field change
- **Storage**: localStorage with expiry
- **Recovery**: Prompt on return

#### Validation Error Priority
```
1. Security errors (injection attempts)
2. Required field errors
3. Format errors
4. Business logic errors
5. Warnings (non-blocking)
```

---

## 9. VISUAL DESIGN SYSTEM

### 9.1 Color Palette

```css
/* Using existing shadcn/ui design tokens */

/* Primary Actions */
--primary: hsl(222.2 47.4% 11.2%);
--primary-foreground: hsl(210 40% 98%);

/* Secondary Elements */
--secondary: hsl(210 40% 96.1%);
--secondary-foreground: hsl(222.2 47.4% 11.2%);

/* Backgrounds */
--background: hsl(0 0% 100%);
--foreground: hsl(222.2 84% 4.9%);
--card: hsl(0 0% 100%);
--card-foreground: hsl(222.2 84% 4.9%);

/* Borders & Dividers */
--border: hsl(214.3 31.8% 91.4%);
--input: hsl(214.3 31.8% 91.4%);

/* States */
--muted: hsl(210 40% 96.1%);
--muted-foreground: hsl(215.4 16.3% 46.9%);
--accent: hsl(210 40% 96.1%);
--accent-foreground: hsl(222.2 47.4% 11.2%);

/* Feedback */
--destructive: hsl(0 84.2% 60.2%);
--destructive-foreground: hsl(210 40% 98%);
--success: hsl(142 76% 36%);
--warning: hsl(38 92% 50%);
```

### 9.2 Typography Scale

```css
/* Using Inter font family */

/* Headings */
.h1 { font-size: 2rem; line-height: 2.5rem; font-weight: 600; }
.h2 { font-size: 1.5rem; line-height: 2rem; font-weight: 600; }
.h3 { font-size: 1.25rem; line-height: 1.75rem; font-weight: 500; }

/* Body Text */
.body-large { font-size: 1rem; line-height: 1.5rem; }
.body-default { font-size: 0.875rem; line-height: 1.25rem; }
.body-small { font-size: 0.75rem; line-height: 1rem; }

/* Labels & Captions */
.label { font-size: 0.875rem; font-weight: 500; }
.caption { font-size: 0.75rem; color: var(--muted-foreground); }
```

### 9.3 Spacing System

```css
/* 4px base unit */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### 9.4 Component Styling

#### Cards
```css
.wizard-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: var(--space-6);
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}
```

#### Buttons
```css
.btn-primary {
  background: var(--primary);
  color: var(--primary-foreground);
  padding: var(--space-2) var(--space-4);
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 200ms ease;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
```

#### Form Elements
```css
.form-input {
  width: 100%;
  padding: var(--space-2);
  border: 1px solid var(--input);
  border-radius: 0.375rem;
  background: var(--background);
  transition: border-color 200ms ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
}
```

---

## 10. PERFORMANCE OPTIMIZATIONS

### 10.1 Code Splitting Strategy

```javascript
// Lazy load wizard steps
const DomainSelection = lazy(() => import('./steps/DomainSelection'));
const ClassConfiguration = lazy(() => import('./steps/ClassConfiguration'));
const StudentManagement = lazy(() => import('./steps/StudentManagement'));
const ReviewConfirmation = lazy(() => import('./steps/ReviewConfirmation'));
const SuccessState = lazy(() => import('./steps/SuccessState'));
```

### 10.2 State Management

```javascript
// Zustand store structure
interface ClassCreationStore {
  // Wizard state
  currentStep: number;
  completedSteps: Set<number>;
  
  // Form data
  domain: Domain | null;
  classConfig: ClassConfiguration;
  students: Student[];
  
  // Actions
  setStep: (step: number) => void;
  updateClassConfig: (config: Partial<ClassConfiguration>) => void;
  addStudent: (student: Student) => void;
  removeStudent: (id: string) => void;
  
  // Persistence
  saveDraft: () => void;
  loadDraft: () => void;
  clearDraft: () => void;
}
```

### 10.3 Optimization Techniques

#### Debounced Validation
```javascript
const debouncedValidate = useMemo(
  () => debounce((value: string) => {
    validateEmail(value);
  }, 500),
  []
);
```

#### Virtualized Student List
```javascript
// Use react-window for large student lists
<FixedSizeList
  height={400}
  itemCount={students.length}
  itemSize={80}
  width="100%"
>
  {StudentRow}
</FixedSizeList>
```

#### Optimistic Updates
```javascript
// Update UI immediately, rollback on error
const addStudent = async (student: Student) => {
  // Optimistic update
  updateStudents([...students, student]);
  
  try {
    await api.addStudent(student);
  } catch (error) {
    // Rollback
    updateStudents(students);
    showError(error);
  }
};
```

---

## 11. TESTING REQUIREMENTS

### 11.1 Component Testing

```javascript
describe('ClassCreationWizard', () => {
  it('should auto-select domain when teacher has only one', async () => {
    renderWithSingleDomain();
    expect(screen.getByText('Class Configuration')).toBeInTheDocument();
  });
  
  it('should validate required fields before progression', async () => {
    render(<ClassCreationWizard />);
    const continueButton = screen.getByText('Continue');
    
    fireEvent.click(continueButton);
    
    expect(screen.getByText('Please select a domain')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  
  it('should save draft on unmount', () => {
    const { unmount } = render(<ClassCreationWizard />);
    fillClassDetails();
    
    unmount();
    
    expect(localStorage.getItem('class-draft')).toBeTruthy();
  });
});
```

### 11.2 Accessibility Testing

```javascript
describe('Accessibility', () => {
  it('should be keyboard navigable', async () => {
    render(<ClassCreationWizard />);
    
    // Tab through elements
    userEvent.tab();
    expect(screen.getByRole('progressbar')).toHaveFocus();
    
    userEvent.tab();
    expect(screen.getByRole('radio', { name: /Music/ })).toHaveFocus();
  });
  
  it('should announce progress updates', () => {
    render(<ClassCreationWizard />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '1');
    expect(progressBar).toHaveAttribute('aria-valuemax', '5');
  });
});
```

### 11.3 Integration Testing

```javascript
describe('E2E Class Creation', () => {
  it('should complete full wizard flow', async () => {
    // Step 1: Domain Selection
    cy.visit('/teacher/classes/create');
    cy.findByRole('radio', { name: /Music/ }).click();
    cy.findByRole('button', { name: /Continue/ }).click();
    
    // Step 2: Configuration
    cy.findByLabelText(/Class Name/).type('Intermediate Piano');
    cy.findByLabelText(/Difficulty Level/).select('3');
    cy.findByRole('button', { name: /Continue/ }).click();
    
    // Step 3: Students
    cy.findByLabelText(/Name/).type('Emma Rodriguez');
    cy.findByLabelText(/Email/).type('emma@example.com');
    cy.findByRole('button', { name: /Add Student/ }).click();
    cy.findByRole('button', { name: /Continue/ }).click();
    
    // Step 4: Review
    cy.findByRole('button', { name: /Create Class/ }).click();
    
    // Step 5: Success
    cy.findByText(/Class Created Successfully/).should('exist');
  });
});
```

---

## 12. IMPLEMENTATION NOTES

### 12.1 File Structure

```
src/
├── pages/
│   └── teacher/
│       └── ClassCreation.tsx
├── components/
│   └── class-creation/
│       ├── ClassCreationWizard.tsx
│       ├── ProgressIndicator.tsx
│       ├── steps/
│       │   ├── DomainSelection.tsx
│       │   ├── ClassConfiguration.tsx
│       │   ├── StudentManagement.tsx
│       │   ├── ReviewConfirmation.tsx
│       │   └── SuccessState.tsx
│       ├── forms/
│       │   ├── ClassDetailsForm.tsx
│       │   ├── ScheduleSelector.tsx
│       │   └── StudentForm.tsx
│       └── cards/
│           └── StudentCard.tsx
├── hooks/
│   ├── useClassCreation.ts
│   ├── useWizardNavigation.ts
│   └── useFormValidation.ts
├── stores/
│   └── classCreationStore.ts
└── utils/
    ├── validation.ts
    └── classHelpers.ts
```

### 12.2 API Integration Points

```typescript
// Required API endpoints
POST   /api/classes                 // Create class
GET    /api/domains                  // Fetch available domains
GET    /api/difficulty-levels        // Fetch difficulty labels
POST   /api/classes/:id/students    // Add students
POST   /api/invitations/send        // Send invitations
GET    /api/teacher/schedule        // Check schedule conflicts
```

### 12.3 State Persistence Strategy

```javascript
// LocalStorage schema
{
  "class-wizard-draft": {
    "version": "1.0",
    "timestamp": "2025-01-09T10:00:00Z",
    "expiresAt": "2025-01-10T10:00:00Z",
    "data": {
      "currentStep": 2,
      "domain": { "id": "123", "name": "Music" },
      "classConfig": {
        "name": "Intermediate Piano",
        "level": 3,
        "frequency": "weekly",
        "schedules": [...]
      },
      "students": [...]
    }
  }
}
```

### 12.4 Route Configuration

```javascript
// Add to App.tsx routes
<Route path="/teacher/classes/create" element={
  <RouteProtection requiredRole="teacher">
    <ClassCreationWizard />
  </RouteProtection>
} />
```

---

## DESIGN RATIONALE

### Progressive Disclosure
The vertical wizard pattern reveals complexity gradually, reducing cognitive overload. Each step focuses on one primary task, making the process feel manageable despite collecting substantial information.

### Auto-Selection Logic
When a teacher has only one domain, automatically progressing to step 2 saves time and reduces friction. This follows Hick's Law by eliminating unnecessary choices.

### Inline Validation
Real-time validation with clear error messages prevents frustration at the final submission. Users can correct issues immediately rather than discovering problems after investing time in the form.

### Mobile-First Responsive Design
Starting with mobile constraints ensures the interface works well on all devices. The progressive enhancement approach adds complexity only where screen space permits.

### Accessibility as Foundation
Building with WCAG 2.1 AA compliance from the start ensures the wizard is usable by all teachers, including those using assistive technologies. This is not just compliance but good UX practice.

### Draft Persistence
Auto-saving drafts respects users' time and prevents data loss from interruptions. The 24-hour expiry balances persistence with data hygiene.

---

## CONCLUSION

This comprehensive UX design for the teacher class creation wizard prioritizes user efficiency, accessibility, and system integrity. The progressive disclosure pattern, combined with intelligent defaults and robust validation, creates an intuitive experience that scales from mobile to desktop while maintaining WCAG 2.1 AA compliance.

The design leverages existing shadcn/ui components and patterns, ensuring consistency with the broader Gemeos platform while introducing specific optimizations for the class creation workflow. Implementation should focus on the core happy path first, with edge cases and advanced features added iteratively based on user feedback.