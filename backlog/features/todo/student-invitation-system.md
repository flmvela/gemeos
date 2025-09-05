# Student Invitation and Class Join System

**Epic:** Class Management System  
**Priority:** High
**Effort:** L
**Status:** TODO
**Assignee:** TBD
**Sprint:** TBD

## Description
Implement a comprehensive student invitation system that allows teachers to invite students to classes via email, bulk CSV upload, and shareable join codes. Include student account creation and class enrollment workflows.

## Acceptance Criteria
- [ ] Teachers can send individual student invitations via email
- [ ] Bulk student invitation via CSV upload with validation
- [ ] Generate unique class join codes (6-character alphanumeric)
- [ ] Students can join classes using invitation links
- [ ] Students can join classes using class codes
- [ ] Student account creation on first class join
- [ ] Invitation expiry system (configurable, default 14 days)
- [ ] Pending invitations dashboard for teachers
- [ ] Email templates for invitation notifications

## Dependencies
- Email notification service integration
- Student user role implementation
- Class creation system
- CSV processing utilities

## Technical Notes
- Use Supabase Auth for student account creation
- Implement secure invitation tokens with expiration
- Create invitation_links table for tracking
- Add background job processing for bulk invitations
- Integrate with email service (SendGrid/Mailgun)

## Database Schema Changes
```sql
-- Student invitations table
CREATE TABLE student_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id),
  teacher_id UUID REFERENCES teachers(id),
  email VARCHAR(255) NOT NULL,
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'sent',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Class join codes table
CREATE TABLE class_join_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id),
  code VARCHAR(6) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student class enrollments
CREATE TABLE student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id),
  class_id UUID REFERENCES classes(id),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active',
  UNIQUE(student_id, class_id)
);
```

## Testing Requirements
- [ ] Unit tests for invitation generation and validation
- [ ] Integration tests for email sending
- [ ] E2E tests for complete invitation workflow
- [ ] Load tests for bulk invitation processing
- [ ] Security tests for invitation token validation

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Database migrations applied
- [ ] Email templates designed and tested
- [ ] Tests passing (95%+ coverage)
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] UX/UI review completed