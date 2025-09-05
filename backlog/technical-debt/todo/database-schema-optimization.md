# Database Schema Optimization and Cleanup

**Epic:** Infrastructure Optimization
**Priority:** Medium
**Effort:** M
**Status:** TODO
**Assignee:** TBD
**Sprint:** TBD

## Description
Optimize the existing database schema to improve performance, add missing indexes, implement proper constraints, and clean up any unused tables or columns identified during development.

## Acceptance Criteria
- [ ] Add database indexes for frequently queried columns
- [ ] Implement foreign key constraints where missing
- [ ] Add proper unique constraints and check constraints
- [ ] Optimize table structures for better performance
- [ ] Remove unused tables and columns
- [ ] Add database documentation and ERD
- [ ] Implement database backup and migration strategies
- [ ] Add database monitoring and performance tracking

## Current Schema Issues Identified
- Missing indexes on foreign key columns
- Inconsistent naming conventions
- Some tables lack proper constraints
- Need better normalization in some areas
- Missing audit timestamps on some tables

## Technical Notes
- Run EXPLAIN ANALYZE on slow queries
- Add composite indexes for multi-column queries
- Consider partitioning for large tables
- Implement database connection pooling optimization
- Add database query performance monitoring

## Database Performance Improvements
```sql
-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_concepts_domain_id ON concepts(domain_id);
CREATE INDEX IF NOT EXISTS idx_concepts_status ON concepts(status);
CREATE INDEX IF NOT EXISTS idx_learning_goals_concept_id ON learning_goals(concept_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);

-- Add composite indexes
CREATE INDEX IF NOT EXISTS idx_concepts_domain_status ON concepts(domain_id, status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_tenant ON user_roles(user_id, tenant_id);

-- Add constraints for data integrity
ALTER TABLE concepts ADD CONSTRAINT chk_concepts_status 
  CHECK (status IN ('suggested', 'approved', 'rejected', 'archived'));

ALTER TABLE learning_goals ADD CONSTRAINT chk_learning_goals_difficulty 
  CHECK (difficulty BETWEEN 1 AND 5);
```

## Migration Strategy
- Create migration scripts for all schema changes
- Plan for zero-downtime migrations
- Backup strategy before major changes
- Rollback procedures for each migration

## Monitoring Setup
- Query performance monitoring
- Database connection monitoring
- Storage usage tracking
- Index usage statistics

## Testing Requirements
- [ ] Performance tests before and after optimization
- [ ] Data integrity tests for constraints
- [ ] Migration tests with production data samples
- [ ] Backup and restore tests

## Definition of Done
- [ ] All identified performance issues addressed
- [ ] Database properly indexed and constrained
- [ ] Migration scripts tested and documented
- [ ] Performance benchmarks show improvement
- [ ] Database documentation updated
- [ ] Monitoring dashboards created
- [ ] Team trained on new schema changes