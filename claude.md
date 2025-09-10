# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gemeos is a learning management system (LMS) built with React, TypeScript, Vite, and Supabase. It features multi-tenant architecture with role-based access control for platform admins, tenant admins, domain admins, and teachers.

## Commands

### Development
```bash
npm run dev          # Start development server on port 8080
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing
```bash
npm run test         # Run Vitest unit tests
npm run test:unit    # Run unit tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run test:auth    # Run authentication-specific tests

npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:ui  # Run Playwright tests with UI
npm run test:e2e:headed # Run Playwright tests in headed mode
npm run test:e2e:debug # Debug Playwright tests
```

### Code Quality
```bash
npm run lint         # Run ESLint
```

## Architecture

### Frontend Structure
- **Pages**: React Router v6 with nested routes under `/teacher/*`, `/admin/*`, `/tenant-admin/*`
- **State Management**: TanStack Query for server state, custom stores for complex features (tenant wizard, teacher wizard)
- **UI Components**: shadcn/ui components with Tailwind CSS
- **Authentication**: Custom AuthProvider with Supabase, RouteProtection wrapper for protected routes
- **Design System**: Gemeos brand colors defined in `/context/style-guide.md`, design principles in `/context/design-principles.md`

### Backend Services
- **Supabase**: PostgreSQL database with Row Level Security (RLS)
- **Edge Functions**: Located in `supabase/functions/`, handling email, AI guidance, content processing
- **Authentication**: Supabase Auth with custom invitation flow for tenant admins and teachers
- **File Storage**: Google Cloud Storage integration for content uploads

### Key Services (src/services/)
- `auth.service.ts`: Authentication and session management
- `tenant.service.ts`: Multi-tenant operations
- `teacher.service.ts`: Teacher management and invitations
- `platform-admin.service.ts`: Platform-level administration
- `invitation.service.ts`: Handles tenant admin and teacher invitations
- `email.service.ts`: Email sending via Supabase functions

## Development Process

### Feature Development Workflow
1. **Requirements Gathering**: Product manager provides initial requirements
2. **Clarification**: Business-engineer and project-manager clarify ambiguities
3. **Process Design**: Create textual use cases (step, actor, input, system behavior, output)
4. **UX Design**: Create UI mockups for user flow validation
5. **Technical Specs**: Define database schema, backend logic, cloud services
6. **Implementation**: Development following approved specifications
7. **Quality Assurance**: Test all process steps, forms, database operations, check logs for errors
8. **Acceptance Testing**: Product manager reviews implementation
9. **Deployment**: Commit to GitHub and deploy

### Task Management
- Tasks are created in `backlog/tasks/todo/*.md`
- Completed tasks move to `backlog/tasks/done/`
- Process tasks by smallest prefix number first (1-task.md, 2-task.md, etc.)
- Completed features documented in `backlog/features/done/*.md`

## Visual Verification

After implementing frontend changes:
1. Review modified components/pages
2. Navigate to affected pages using Playwright MCP
3. Verify against design system (`/context/design-principles.md`, `/context/style-guide.md`)
4. Validate feature implementation meets requirements
5. Capture full-page screenshot at desktop viewport (1440px)
6. Check browser console for errors

## Testing Strategy

### Unit Tests (Vitest)
- Located alongside components as `*.test.tsx` or in `__tests__/` folders
- Setup file: `src/test/setup.ts`
- Coverage excludes: node_modules, test files, configs, type definitions

### E2E Tests (Playwright)
- Located in `tests/*.spec.ts`
- Base URL: `http://localhost:8080`
- Runs against local dev server
- Configured for Chromium, Firefox, and WebKit

## Supabase Operations

### Edge Functions
```bash
npx supabase functions deploy <function-name>  # Deploy edge function
npx supabase functions serve                    # Run functions locally
```

### Database
- No subqueries allowed in Supabase
- SQL commands must be executed manually
- Migrations in `supabase/migrations/`
- RLS policies enforce multi-tenant security

## Environment Configuration
- Local Supabase project: `jfolpnyipoocflcrachg`
- Development server: `http://localhost:8080`
- Vite aliases: `@/` maps to `./src/`

## Important Notes
- Always check `/context/playwright-instructions.md` for browser automation guidance
- Use design-reviewer agent for comprehensive design validation before PRs
- Prefer editing existing files over creating new ones
- Never create documentation files unless explicitly requested