# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **AI Content Management System** - Complete implementation with Review AI dashboard
  - Review AI page for reviewing and approving AI-generated content
  - Support for concepts, learning goals, and exercises
  - Batch approval/rejection workflow
  - AI suggestions service layer
  - Supabase Edge Functions for AI processing (GPT-4 integration)
  - Comprehensive database schema for AI content management
- **Learning Goals Enhancements**
  - Added title column extracted from goal_description
  - Added description column for UI compatibility
  - Standardized Bloom's Taxonomy levels (6 levels)
  - Performance indexes and RLS policies
- **Documentation**
  - AI Content Management Implementation guide
  - Database schema documentation
  - Usage guides for different user roles
- Comprehensive CLAUDE.md documentation for Claude Code guidance

### Changed
- Navigation sidebar updated with Review AI links for admins and teachers
- Learning goals table structure enhanced for better UI support

### Fixed
- Learning goals table now has proper title field for display
- Database migrations handle edge cases and missing columns
- RLS policies simplified for compatibility

### Removed
-

## Edge Functions Deployment Log

### [Date: 2025-01-13]
- Function: ai-content-processor
- Changes: Initial deployment - Main AI processing pipeline for concepts, learning goals, and exercises
- Status: Ready for deployment
- Commit: ad5e082

### [Date: 2025-01-13]
- Function: ai-concept-enrichment
- Changes: Initial deployment - Specialized concept enrichment with hierarchy generation
- Status: Ready for deployment
- Commit: ad5e082