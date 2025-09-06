# UX Design Package: Accept Invitation Page
## Gemeos Learning Platform

---

## 1. USER JOURNEY MAP

### Primary User Flow: Accepting Tenant Admin Invitation

#### Journey Stages:

**Stage 1: Email Reception**
- User receives invitation email
- User clicks "Accept Invitation" button
- System generates secure link with tenant ID parameter

**Stage 2: Landing on Accept Page**
- User arrives at `/accept-invite?tenant=<tenant-id>`
- System validates invitation token
- System checks user authentication status

**Stage 3: Authentication Branch**

*Path A: New User (No Account)*
- Display welcome message with tenant name
- Show password creation form
- Request basic profile information

*Path B: Existing User (Has Account)*
- Display welcome back message
- Show simplified password confirmation
- Auto-populate email from invitation

**Stage 4: Password Setup**
- User enters password
- System validates password requirements
- User confirms password
- User submits form

**Stage 5: Success State**
- System creates/updates user account
- System assigns user to tenant with admin role
- System displays success message
- System auto-redirects to `/admin/dashboard`

**Stage 6: Dashboard Landing**
- User lands on admin dashboard
- System displays welcome tour (first-time users)
- User begins tenant administration

### Error Recovery Paths:

**Invalid/Expired Token:**
- Display clear error message
- Provide option to request new invitation
- Link to contact support

**Network/System Errors:**
- Maintain form state
- Display retry option
- Provide fallback contact method

---

## 2. INFORMATION ARCHITECTURE

### Page Hierarchy:
```
/accept-invite
├── Header Section
│   ├── Gemeos Logo
│   ├── Help Link
│   └── Language Selector (optional)
├── Main Content
│   ├── Invitation Context Card
│   │   ├── Tenant Name
│   │   ├── Inviter Information
│   │   └── Role Assignment
│   ├── Authentication Form
│   │   ├── Email Display (read-only)
│   │   ├── Password Input
│   │   ├── Password Confirmation
│   │   └── Security Requirements
│   └── Action Buttons
│       ├── Primary: Accept & Continue
│       └── Secondary: Cancel
└── Footer
    ├── Terms of Service
    ├── Privacy Policy
    └── Support Contact
```

---

## 3. WIREFRAME SPECIFICATIONS

### Desktop Layout (1440px viewport)

```
┌─────────────────────────────────────────────────────────────┐
│                         HEADER                              │
│  [Gemeos Logo]                              [Help] [Lang]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                     MAIN CONTENT AREA                       │
│                                                              │
│     ┌──────────────────────────────────────────────┐       │
│     │            INVITATION CONTEXT CARD            │       │
│     │                                                │       │
│     │  You've been invited to join:                 │       │
│     │  ┌──────────────────────────────────┐        │       │
│     │  │  [Tenant Logo]                    │        │       │
│     │  │  TENANT NAME                      │        │       │
│     │  │  as Tenant Administrator          │        │       │
│     │  └──────────────────────────────────┘        │       │
│     │                                                │       │
│     │  Invited by: John Doe (john@example.com)      │       │
│     │  Sent: January 5, 2025                        │       │
│     └──────────────────────────────────────────────┘       │
│                                                              │
│     ┌──────────────────────────────────────────────┐       │
│     │           SET YOUR PASSWORD                   │       │
│     │                                                │       │
│     │  Email                                        │       │
│     │  ┌────────────────────────────────────┐      │       │
│     │  │  user@example.com (read-only)       │      │       │
│     │  └────────────────────────────────────┘      │       │
│     │                                                │       │
│     │  New Password *                               │       │
│     │  ┌────────────────────────────────────┐      │       │
│     │  │  ••••••••                    [👁]   │      │       │
│     │  └────────────────────────────────────┘      │       │
│     │  Password Strength: [████████░░░░░░░░]       │       │
│     │                                                │       │
│     │  Confirm Password *                           │       │
│     │  ┌────────────────────────────────────┐      │       │
│     │  │  ••••••••                    [👁]   │      │       │
│     │  └────────────────────────────────────┘      │       │
│     │                                                │       │
│     │  ✓ At least 8 characters                      │       │
│     │  ✓ One uppercase letter                       │       │
│     │  ✓ One lowercase letter                       │       │
│     │  ✓ One number                                 │       │
│     │  ○ One special character (!@#$%^&*)           │       │
│     │                                                │       │
│     │  ┌─────────────────────────────────────┐     │       │
│     │  │   ACCEPT INVITATION & CONTINUE       │     │       │
│     │  └─────────────────────────────────────┘     │       │
│     │                                                │       │
│     │  [ ] I agree to the Terms of Service and      │       │
│     │      Privacy Policy                            │       │
│     │                                                │       │
│     │         [Decline Invitation]                  │       │
│     └──────────────────────────────────────────────┘       │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                         FOOTER                              │
│   Terms of Service | Privacy Policy | Contact Support       │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout (375px viewport)

```
┌─────────────────────┐
│      HEADER         │
│  [Logo]    [?] [≡]  │
├─────────────────────┤
│                     │
│  INVITATION CARD    │
│  ┌─────────────┐    │
│  │ Tenant Info │    │
│  │             │    │
│  │ Compact     │    │
│  │ View        │    │
│  └─────────────┘    │
│                     │
│  PASSWORD FORM      │
│  ┌─────────────┐    │
│  │             │    │
│  │ Full Width  │    │
│  │ Inputs      │    │
│  │             │    │
│  │ [ACCEPT]    │    │
│  │             │    │
│  └─────────────┘    │
│                     │
├─────────────────────┤
│      FOOTER         │
└─────────────────────┘
```

---

## 4. COMPONENT SPECIFICATIONS

### 4.1 Invitation Context Card

**Purpose:** Display invitation details and build trust

**Visual Design:**
- Background: White (#FFFFFF)
- Border: 1px solid #E5E7EB
- Border Radius: 8px
- Padding: 24px
- Box Shadow: 0 1px 3px rgba(0,0,0,0.1)

**Content Elements:**
- Tenant Logo/Avatar (64x64px)
- Tenant Name (Heading 2, #222127)
- Role Badge (Background: #DAD9F5, Text: #110D59)
- Inviter Info (Body Medium, #55555F)
- Timestamp (Caption, #B3B1BB)

### 4.2 Password Input Fields

**Visual Design:**
- Background: #F8F9FD
- Border: 1px solid transparent
- Border Radius: 7.5px
- Height: 48px
- Font Size: 14px
- Text Color: #55555F
- Placeholder: #B3B1BB

**States:**
- Default: Border transparent
- Focus: Border #0B5FAE, Box shadow: 0 0 0 3px rgba(11,95,174,0.1)
- Error: Border #EF4444, Background: #FEF2F2
- Success: Border #10B981, Background: #F0FDF4

**Password Visibility Toggle:**
- Icon: Eye/EyeOff from Lucide
- Color: #7D7A89
- Hover: #55555F
- Size: 16px

### 4.3 Password Strength Indicator

**Visual Design:**
- Container Height: 4px
- Border Radius: 2px
- Background: #E5E7EB
- Fill Colors:
  - Weak (0-25%): #EF4444
  - Fair (26-50%): #F59E0B
  - Good (51-75%): #3B82F6
  - Strong (76-100%): #10B981

**Requirements Checklist:**
- Icon Size: 16px
- Met: Green checkmark (#10B981)
- Unmet: Gray circle (#D9D9D9)
- Text: Body Small (#55555F)

### 4.4 Primary Action Button

**Specifications:**
- Height: 51px
- Background: Linear gradient from #0B5FAE to #0E77D9
- Border Radius: 8px
- Text: White, Font Weight 500, 16px
- Padding: 0 24px

**States:**
- Default: Gradient background
- Hover: 5% darker overlay
- Active: 15% darker overlay
- Disabled: Background #E3E4E8, Text #D3D4DA
- Loading: Show spinner, text "Accepting invitation..."

### 4.5 Secondary Actions

**Decline Link:**
- Style: Text button
- Color: #7D7A89
- Hover: #55555F, underline
- Font Size: 14px

---

## 5. STATE MANAGEMENT REQUIREMENTS

### Component States:

**1. Loading States:**
- Initial token validation
- Password submission
- Redirect preparation

**2. Error States:**
- Invalid/expired token
- Password mismatch
- Weak password
- Network errors
- Server errors

**3. Success States:**
- Valid token confirmed
- Password accepted
- Account created/updated
- Redirect initiated

### Form Validation States:

```typescript
interface AcceptInvitationState {
  // Invitation Data
  invitation: {
    id: string;
    tenantId: string;
    tenantName: string;
    inviterName: string;
    inviterEmail: string;
    role: string;
    expiresAt: Date;
  } | null;
  
  // Form State
  form: {
    password: string;
    confirmPassword: string;
    agreedToTerms: boolean;
  };
  
  // Validation State
  validation: {
    passwordStrength: 'weak' | 'fair' | 'good' | 'strong';
    passwordsMatch: boolean;
    requirements: {
      minLength: boolean;
      hasUppercase: boolean;
      hasLowercase: boolean;
      hasNumber: boolean;
      hasSpecial: boolean;
    };
  };
  
  // UI State
  ui: {
    isLoading: boolean;
    isSubmitting: boolean;
    showPassword: boolean;
    showConfirmPassword: boolean;
    error: string | null;
    successMessage: string | null;
  };
}
```

---

## 6. INTERACTION SPECIFICATIONS

### Password Validation Rules:

**Real-time Validation:**
- Trigger on input change
- Debounce: 300ms
- Update strength indicator
- Update requirements checklist

**Requirements:**
1. Minimum 8 characters
2. At least 1 uppercase letter
3. At least 1 lowercase letter
4. At least 1 number
5. At least 1 special character (recommended)

**Strength Calculation:**
```javascript
calculateStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 20;
  if (/[a-z]/.test(password)) strength += 20;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[0-9]/.test(password)) strength += 20;
  if (/[^A-Za-z0-9]/.test(password)) strength += 20;
  return Math.min(strength, 100);
}
```

### Form Submission Flow:

1. **Pre-submission Validation:**
   - Check all requirements met
   - Verify passwords match
   - Ensure terms accepted

2. **Submission Process:**
   - Disable form inputs
   - Show loading state
   - Call acceptInvitation API

3. **Success Handling:**
   - Show success message (2 seconds)
   - Trigger redirect to dashboard

4. **Error Handling:**
   - Re-enable form
   - Display specific error message
   - Maintain form data
   - Focus first error field

---

## 7. ACCESSIBILITY REQUIREMENTS (WCAG 2.1 AA)

### Keyboard Navigation:
- All interactive elements keyboard accessible
- Logical tab order
- Visible focus indicators (3px blue outline)
- Skip links for screen readers

### Screen Reader Support:
- Proper heading hierarchy (h1 > h2 > h3)
- ARIA labels for icons
- Form field associations
- Error announcements
- Progress indicators

### Color Contrast:
- Text on background: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum
- Error states clearly distinguishable

### Form Accessibility:
```html
<div role="group" aria-labelledby="password-label">
  <label id="password-label" for="password">
    New Password
    <span aria-label="required">*</span>
  </label>
  <input
    id="password"
    type="password"
    aria-describedby="password-help password-error"
    aria-invalid="false"
    aria-required="true"
  />
  <div id="password-help" role="status" aria-live="polite">
    Password strength: Good
  </div>
  <div id="password-error" role="alert" aria-live="assertive">
    <!-- Error messages appear here -->
  </div>
</div>
```

---

## 8. RESPONSIVE DESIGN SPECIFICATIONS

### Breakpoints:
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+
- Large Desktop: 1440px+

### Mobile Adaptations:
- Stack form elements vertically
- Full-width buttons
- Simplified invitation card
- Bottom sheet for terms
- Touch-friendly targets (44px minimum)

### Tablet Adaptations:
- Center content with max-width: 600px
- Maintain desktop layout structure
- Adjust padding/spacing

---

## 9. ERROR STATE DESIGNS

### Token Validation Errors:

**Expired Invitation:**
```
┌─────────────────────────────────────┐
│         ⚠️ Invitation Expired        │
│                                      │
│  This invitation link has expired.   │
│  Please contact your administrator   │
│  to request a new invitation.        │
│                                      │
│  [Request New Invitation]            │
│  [Contact Support]                   │
└─────────────────────────────────────┘
```

**Invalid Token:**
```
┌─────────────────────────────────────┐
│         ❌ Invalid Invitation        │
│                                      │
│  This invitation link is not valid.  │
│  Please check the link or contact    │
│  support for assistance.             │
│                                      │
│  [Go to Login]                       │
│  [Contact Support]                   │
└─────────────────────────────────────┘
```

### Form Validation Errors:
- Display inline below affected field
- Red border on input (#EF4444)
- Red error text (#DC2626)
- Icon: AlertCircle (16px)

---

## 10. INTEGRATION SPECIFICATIONS

### Service Integration Points:

**1. Invitation Service:**
```typescript
// Get invitation details
invitationService.getInvitationByToken(token)

// Accept invitation
invitationService.acceptInvitation(invitationId, userId)
```

**2. Auth Service:**
```typescript
// Create/update user account
supabase.auth.signUp({
  email: invitation.email,
  password: formData.password,
  options: {
    data: {
      tenant_id: invitation.tenant_id,
      role: invitation.role_name
    }
  }
})

// Sign in after account creation
supabase.auth.signInWithPassword({
  email: invitation.email,
  password: formData.password
})
```

### URL Parameters:
- `tenant`: Tenant ID from invitation
- `token`: Invitation token (optional, for enhanced security)
- `email`: Pre-filled email (optional)

### API Response Handling:

**Success Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "tenant_id": "tenant-id",
    "role": "tenant_admin"
  },
  "redirect": "/admin/dashboard"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "INVITATION_EXPIRED",
    "message": "This invitation has expired",
    "details": "Please request a new invitation"
  }
}
```

---

## 11. SUCCESS STATE DESIGN

### Success Animation:
```
┌─────────────────────────────────────┐
│                                      │
│         ✅ Success!                  │
│                                      │
│   Your account has been created      │
│   and you've been added as a         │
│   Tenant Administrator.              │
│                                      │
│   Redirecting to dashboard...        │
│                                      │
│   [████████████░░░░░░░]              │
│                                      │
└─────────────────────────────────────┘
```

**Specifications:**
- Duration: 2 seconds before redirect
- Animation: Checkmark fade-in with scale
- Progress bar: Linear animation
- Background: Subtle green gradient overlay

---

## 12. IMPLEMENTATION NOTES

### Performance Optimizations:
- Lazy load heavy components
- Debounce password validation
- Prefetch dashboard route
- Cache tenant information
- Minimize API calls

### Security Considerations:
- Never log passwords
- Use HTTPS only
- Implement rate limiting
- Token expiration checks
- CSRF protection
- XSS prevention

### Analytics Events:
- `invitation_page_viewed`
- `password_strength_changed`
- `invitation_accepted`
- `invitation_declined`
- `validation_error`
- `redirect_initiated`

---

## 13. DESIGN RATIONALE

### Key Design Decisions:

**1. Single-Page Flow:**
- Reduces cognitive load
- Clear, focused task
- Minimizes dropout rate

**2. Password Strength Indicator:**
- Provides immediate feedback
- Educates users on security
- Reduces support tickets

**3. Invitation Context Card:**
- Builds trust
- Confirms correct invitation
- Sets expectations

**4. Auto-Redirect:**
- Seamless user experience
- Reduces clicks
- Clear success state

**5. Progressive Disclosure:**
- Shows only essential fields
- Optional fields hidden initially
- Reduces form intimidation

---

## 14. FUTURE ENHANCEMENTS

### Phase 2 Considerations:
- Social authentication options
- Two-factor authentication setup
- Profile photo upload
- Team welcome message
- Onboarding checklist
- Resource library access
- Mobile app deep linking

---

## APPENDIX: COMPONENT LIBRARY MAPPING

### Existing Components to Reuse:
- `Card` from '@/components/ui/card'
- `Input` from '@/components/ui/input'
- `Button` from '@/components/ui/button'
- `Label` from '@/components/ui/label'
- `Alert` from '@/components/ui/alert'
- `Progress` from '@/components/ui/progress'
- `Checkbox` from '@/components/ui/checkbox'

### New Components Required:
- `PasswordStrengthIndicator`
- `InvitationCard`
- `RequirementsList`
- `SuccessRedirect`

---

This comprehensive UX design package provides all necessary specifications for implementing the accept-invitation page while maintaining consistency with the Gemeos design system and ensuring a smooth, secure user experience.