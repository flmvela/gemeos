# Authentication System Testing Guide

## Overview

This document provides comprehensive documentation for the Test-Driven Development (TDD) test suite created for the Gemeos Enhanced Authentication System. The test suite covers all aspects of the multi-tenant RBAC system including authentication, authorization, permissions, audit logging, and security.

## Test Structure

### Test Files Organization

```
src/
├── services/
│   └── auth.service.test.ts          # Unit tests for AuthService
├── hooks/
│   └── useAuth.test.tsx              # Integration tests for React hooks
├── test/
│   ├── setup.ts                      # Test configuration and setup
│   ├── mocks/
│   │   └── supabase.mock.ts          # Supabase client mocks
│   └── auth/
│       ├── permission-rbac.test.ts   # RBAC and permission tests
│       ├── multi-tenant.test.ts      # Multi-tenant isolation tests
│       ├── security.test.ts          # Security and edge case tests
│       └── audit-logging.test.ts     # Audit trail tests
```

## Running Tests

### Available Test Commands

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:unit

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run only authentication tests
npm run test:auth

# Run end-to-end tests (Playwright)
npm run test:e2e
```

### Quick Test Runner

```bash
# Run all auth tests with coverage
./run-tests.sh
```

## Test Coverage Areas

### 1. Unit Tests (`auth.service.test.ts`)

#### Singleton Pattern
- Instance creation and reuse
- State persistence across instances

#### Session Management
- User authentication state
- Session loading and caching
- Error handling for failed authentication

#### Tenant Operations
- Tenant switching logic
- Permission cache clearing
- Tenant access validation
- Current tenant persistence

#### User & Role Management
- User invitation flow
- Role assignment
- User removal from tenants
- Role validation

#### Permission System
- Permission checking for different roles
- Platform admin bypass
- Permission caching
- Context-based permissions

#### Audit Logging
- Log creation
- Log retrieval with filters
- Error handling

### 2. Integration Tests (`useAuth.test.tsx`)

#### React Hooks
- `useAuth` - Main authentication hook
- `usePermission` - Permission checking hook
- `useIsPlatformAdmin`, `useIsTenantAdmin`, `useIsTeacher`, `useIsStudent` - Role hooks
- `useCurrentTenant` - Current tenant hook
- `useTenantSwitcher` - Tenant switching functionality
- `useAuthGuard` - Route protection
- `useAuditLog` - Audit logging hook

#### Context Provider
- AuthProvider component
- Context initialization
- State management
- Error boundaries

### 3. RBAC Tests (`permission-rbac.test.ts`)

#### Role Hierarchy
- Hierarchy level enforcement
- Role transition validation
- Privilege escalation prevention

#### Permission Matrix
- Platform Admin: Full system access
- Tenant Admin: Full tenant access
- Teacher: Domain and content management
- Student: Read-only access

#### Conditional Permissions
- Domain-specific permissions
- Tenant-specific overrides
- Resource-based access control

### 4. Multi-tenant Tests (`multi-tenant.test.ts`)

#### Tenant Isolation
- Data separation between tenants
- RLS policy enforcement
- Cross-tenant access prevention

#### Tenant Switching
- Seamless context switching
- Session persistence
- Cache invalidation

#### Tenant Lifecycle
- Creation with defaults
- Suspension handling
- Resource limit enforcement
- User limit validation

### 5. Security Tests (`security.test.ts`)

#### Input Validation
- SQL injection prevention
- XSS protection
- Email validation
- Slug format validation

#### Authentication Security
- Token expiration handling
- Invalid token detection
- Token replay prevention
- Session hijacking prevention

#### Rate Limiting
- Rapid attempt handling
- Exponential backoff
- DoS prevention

#### Privilege Management
- Role elevation prevention
- Valid role transitions
- Permission boundary enforcement

### 6. Audit Logging Tests (`audit-logging.test.ts`)

#### Log Creation
- Authentication events
- User management actions
- Permission changes
- Tenant operations

#### Log Retrieval
- Filtering by resource type
- User-specific queries
- Date range queries
- Pagination support

#### Compliance
- Required field validation
- Immutability enforcement
- Data retention policies
- Privacy compliance

## Test Patterns and Best Practices

### Mocking Strategy

```typescript
// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}));

// Configure specific responses
mockSupabase.auth.getUser.mockResolvedValue({
  data: { user: mockUser },
  error: null
});
```

### Test Data Fixtures

```typescript
// Centralized test data
export const mockSupabaseResponses = {
  user: { /* user data */ },
  tenants: [ /* tenant data */ ],
  roles: { /* role definitions */ },
  permissions: [ /* permission list */ ]
};
```

### Async Testing

```typescript
// Proper async/await handling
await waitFor(() => {
  expect(result.current.loading).toBe(false);
});

// Act wrapper for state updates
await act(async () => {
  await result.current.switchTenant('tenant-2');
});
```

### Error Testing

```typescript
// Test both success and failure paths
await expect(
  authService.someMethod()
).rejects.toThrow('Expected error');

// Graceful error handling
expect(console.error).toHaveBeenCalledWith(
  'Error message:',
  expect.any(Error)
);
```

## Coverage Metrics

### Target Coverage
- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

### Coverage Report

Generate and view coverage:
```bash
npm run test:coverage
# Open coverage/index.html in browser
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Run Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
```

## Troubleshooting

### Common Issues

1. **Test Timeouts**
   ```typescript
   // Increase timeout for slow operations
   test('slow operation', async () => {
     // test code
   }, 10000); // 10 second timeout
   ```

2. **Mock Reset Issues**
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
     localStorage.clear();
   });
   ```

3. **React Hook Errors**
   ```typescript
   // Always use wrapper
   const { result } = renderHook(
     () => useAuth(),
     { wrapper: AuthProvider }
   );
   ```

## Test Maintenance

### Adding New Tests

1. Follow TDD principles: Write test first, then implementation
2. Use descriptive test names
3. Group related tests in describe blocks
4. Mock external dependencies
5. Test both success and failure paths

### Updating Existing Tests

1. Run tests before making changes
2. Update tests when requirements change
3. Maintain test coverage levels
4. Update mock data as needed

## Performance Considerations

- Use `vi.fn()` for function mocks
- Clear mocks between tests
- Use specific matchers over generic ones
- Batch related assertions

## Security Testing Checklist

- [ ] Input validation (XSS, SQL injection)
- [ ] Authentication token handling
- [ ] Session management
- [ ] Rate limiting
- [ ] Privilege escalation prevention
- [ ] Audit trail completeness
- [ ] Data isolation between tenants
- [ ] Error message information disclosure

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [TDD Principles](https://martinfowler.com/bliki/TestDrivenDevelopment.html)