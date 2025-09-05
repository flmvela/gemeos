# Teacher Class Creation System - Business Analysis

## Executive Summary

The Teacher Class Creation System enables instructors to efficiently create and configure educational classes within a multi-tenant platform. This system streamlines class setup through a guided vertical wizard, automatically handling domain selection, scheduling, and student invitations while maintaining strict tenant isolation and respecting organizational hierarchies.

## Core Requirements

### 1. Domain Selection and Assignment
- **REQ-001**: System must auto-select domain if teacher has access to only one domain
- **REQ-002**: System must present domain selection interface if teacher has access to multiple domains
- **REQ-003**: Domain selection must respect tenant-specific domain assignments
- **REQ-004**: System must validate teacher's domain access permissions before class creation

### 2. Class Configuration
- **REQ-005**: Class name must be unique within teacher's domain and tenant context
- **REQ-006**: Class level must be selected from domain-specific difficulty_level_labels
- **REQ-007**: Lesson frequency options must include: weekly, bi-weekly, monthly
- **REQ-008**: System must support multiple lesson schedules per class
- **REQ-009**: Student messaging permission must default to tenant's preferred setting
- **REQ-010**: Class capacity limits must respect tenant-level restrictions

### 3. Schedule Management
- **REQ-011**: Each schedule entry must include day of week, start time, and end time
- **REQ-012**: System must detect and prevent schedule conflicts within teacher's existing classes
- **REQ-013**: Schedules must support recurring patterns with start and optional end dates
- **REQ-014**: System must calculate total lesson count based on frequency and schedule duration

### 4. Student Management
- **REQ-015**: System must support bulk student entry (manual and CSV import)
- **REQ-016**: Email validation must occur before invitation sending
- **REQ-017**: Duplicate student detection must check within class and across tenant
- **REQ-018**: Invitation message must support customization with template variables
- **REQ-019**: System must track invitation status (pending, accepted, declined)

## Success Metrics

1. **Class Creation Efficiency**
   - Target: 80% of classes created in under 3 minutes
   - Metric: Average time from wizard start to class activation

2. **Student Invitation Success Rate**
   - Target: 75% invitation acceptance rate within 7 days
   - Metric: Accepted invitations / Total invitations sent

3. **Schedule Utilization**
   - Target: 90% of scheduled lessons conducted
   - Metric: Conducted lessons / Scheduled lessons

4. **Error Reduction**
   - Target: Less than 5% error rate during class creation
   - Metric: Failed creations / Total creation attempts

## Constraints & Assumptions

### Technical Constraints
1. Must integrate with existing Supabase authentication system
2. Must maintain compatibility with current React/TypeScript codebase
3. Must support PostgreSQL row-level security (RLS) policies
4. Maximum 50 students per class initially (configurable per tenant)
5. Schedule times must be stored in UTC with timezone conversion

### Business Assumptions
1. Teachers are pre-authenticated and have assigned domains
2. Tenant administrators have configured difficulty labels
3. Email service is configured for invitation delivery
4. Students may not have existing accounts when invited
5. Class creation implies immediate activation (no draft state)

## Edge Cases & Exceptions

### Scenario 1: Domain Access Changes
**Condition**: Teacher's domain access is revoked after class creation
**Handling**: 
- Existing classes remain active but read-only
- No new students can be added
- Schedules cannot be modified
- System notifies tenant administrator

### Scenario 2: Schedule Conflict Detection
**Condition**: Teacher attempts to create overlapping schedules
**Handling**:
- Real-time conflict detection during schedule input
- Visual indication of conflicting time slots
- Suggestion of alternative time slots
- Option to override with justification

### Scenario 3: Student Email Bounce
**Condition**: Invitation email fails delivery
**Handling**:
- Track bounce status in database
- Notify teacher via dashboard alert
- Provide option to update email and resend
- Generate shareable invitation link as fallback

### Scenario 4: Bulk Import Errors
**Condition**: CSV contains invalid or duplicate entries
**Handling**:
- Pre-import validation with error report
- Row-by-row error indication
- Option to fix and re-upload or skip problematic rows
- Partial import capability with rollback option

### Scenario 5: Concurrent Class Creation
**Condition**: Multiple browser tabs creating classes simultaneously
**Handling**:
- Session-based draft management
- Optimistic locking on schedule slots
- Warning when switching between tabs
- Auto-save progress every 30 seconds

## Dependencies

### Technical Dependencies
1. **Authentication Service**: User session and tenant context
2. **Email Service**: Invitation delivery system
3. **Domain Service**: Domain access validation
4. **Scheduling Service**: Availability and conflict checking
5. **File Upload Service**: CSV parsing for bulk import

### Business Dependencies
1. **Tenant Configuration**: Active subscription and feature flags
2. **Domain Setup**: At least one domain configured with difficulty labels
3. **Teacher Onboarding**: Completed profile with teaching credentials
4. **Email Templates**: Approved invitation message templates
5. **Timezone Data**: Accurate timezone database for scheduling

## Risks & Mitigations

### Risk 1: Invitation Spam
**Probability**: Medium
**Impact**: High - Email service blacklisting
**Mitigation**: 
- Rate limiting per teacher (max 100 invitations/day)
- CAPTCHA for bulk operations
- Email verification before sending
- Monitoring of bounce rates

### Risk 2: Data Loss During Creation
**Probability**: Low
**Impact**: High - User frustration and data re-entry
**Mitigation**:
- Auto-save functionality every 30 seconds
- Browser local storage for draft recovery
- Session persistence across page refreshes
- Confirmation before navigation away

### Risk 3: Schedule Timezone Errors
**Probability**: Medium
**Impact**: Medium - Missed lessons
**Mitigation**:
- Clear timezone display in UI
- Confirmation of interpreted time in user's timezone
- Email confirmations with local time
- Timezone change detection and alerts

### Risk 4: Unauthorized Access
**Probability**: Low
**Impact**: High - Data breach
**Mitigation**:
- Row-level security in database
- JWT token validation
- Tenant isolation checks
- Audit logging of all operations

## Open Questions

1. **Recurring Schedule Exceptions**: How should the system handle holidays or one-time schedule changes?
   - Option A: Manual override per instance
   - Option B: Holiday calendar integration
   - Option C: Bulk reschedule functionality

2. **Student Pre-requisites**: Should classes enforce pre-requisite concept completion?
   - Option A: Soft warnings only
   - Option B: Hard blocks with override capability
   - Option C: Automatic prerequisite assignment

3. **Class Templates**: Should teachers be able to save class configurations as templates?
   - Option A: Personal templates only
   - Option B: Shared within domain
   - Option C: Marketplace for templates

4. **Waitlist Management**: How to handle classes at capacity?
   - Option A: Simple waitlist with manual promotion
   - Option B: Automatic promotion on cancellation
   - Option C: No waitlist, suggest alternative classes

5. **Co-teaching Support**: Should multiple teachers be assignable to one class?
   - Option A: Single teacher only
   - Option B: Primary and assistant teachers
   - Option C: Unlimited co-teachers with role definitions

## User Personas

### Primary: Sarah Chen - Music Teacher
- **Context**: Teaches piano to 30 students across 4 skill levels
- **Goals**: Quickly set up semester classes, manage recurring schedules
- **Pain Points**: Manual student entry, schedule conflict management
- **Success Criteria**: Create all classes for new semester in under 30 minutes

### Secondary: Marcus Johnson - Domain Administrator
- **Context**: Manages 15 teachers across 3 music domains
- **Goals**: Ensure consistent class setup, monitor capacity
- **Pain Points**: Lack of visibility into class creation patterns
- **Success Criteria**: Dashboard showing class utilization and teacher efficiency

### Tertiary: Emma Rodriguez - Student
- **Context**: Invited to beginner piano class
- **Goals**: Easy enrollment, clear schedule understanding
- **Pain Points**: Confusing invitation process, timezone confusion
- **Success Criteria**: Join class within 2 minutes of receiving invitation

## Workflow Scenarios

### Scenario 1: Single Domain Teacher - First Class
1. Teacher logs in and navigates to "Create Class"
2. System auto-selects the only available domain (Piano)
3. Teacher enters class name "Beginner Piano - Spring 2025"
4. Selects difficulty level "Beginner" from dropdown
5. Chooses "Weekly" frequency
6. Adds schedule: Mondays 3:00-4:00 PM
7. Enters 5 student emails manually
8. Customizes invitation message
9. Reviews and creates class
10. System sends invitations and confirms creation

### Scenario 2: Multi-Domain Teacher - Bulk Import
1. Teacher with Math and Science access clicks "Create Class"
2. Selects "Mathematics" domain from list
3. Configures "Advanced Algebra" class
4. Sets bi-weekly frequency
5. Adds two schedules (Tuesday/Thursday)
6. Uploads CSV with 25 students
7. System validates and shows 2 duplicates
8. Teacher chooses to skip duplicates
9. Reviews final list and creates class
10. System processes bulk invitations

### Scenario 3: Recurring Class with Breaks
1. Teacher creates "Summer Music Camp" class
2. Sets custom frequency pattern
3. Defines date range June 1 - August 31
4. Adds break periods for holidays
5. System calculates 10 total sessions
6. Teacher confirms and proceeds
7. Students receive schedule with all dates