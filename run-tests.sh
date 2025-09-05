#!/bin/bash

# Authentication System Test Runner
# This script runs all authentication tests and generates a coverage report

echo "========================================"
echo "Running Authentication System Tests"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run a test suite
run_test_suite() {
    local suite_name=$1
    local test_command=$2
    
    echo -e "${YELLOW}Running $suite_name...${NC}"
    if npm run $test_command; then
        echo -e "${GREEN}✓ $suite_name passed${NC}"
        return 0
    else
        echo -e "${RED}✗ $suite_name failed${NC}"
        return 1
    fi
    echo ""
}

# Track overall success
all_passed=true

# Run unit tests
echo "1. Unit Tests"
echo "----------------------------------------"
if ! run_test_suite "AuthService Tests" "test:unit -- src/services/auth.service.test.ts"; then
    all_passed=false
fi

# Run integration tests
echo "2. Integration Tests"
echo "----------------------------------------"
if ! run_test_suite "React Hooks Tests" "test:unit -- src/hooks/useAuth.test.tsx"; then
    all_passed=false
fi

# Run RBAC tests
echo "3. RBAC and Permission Tests"
echo "----------------------------------------"
if ! run_test_suite "Permission System Tests" "test:unit -- src/test/auth/permission-rbac.test.ts"; then
    all_passed=false
fi

# Run multi-tenant tests
echo "4. Multi-tenant Tests"
echo "----------------------------------------"
if ! run_test_suite "Multi-tenant System Tests" "test:unit -- src/test/auth/multi-tenant.test.ts"; then
    all_passed=false
fi

# Run security tests
echo "5. Security Tests"
echo "----------------------------------------"
if ! run_test_suite "Security and Edge Case Tests" "test:unit -- src/test/auth/security.test.ts"; then
    all_passed=false
fi

# Run audit logging tests
echo "6. Audit Logging Tests"
echo "----------------------------------------"
if ! run_test_suite "Audit System Tests" "test:unit -- src/test/auth/audit-logging.test.ts"; then
    all_passed=false
fi

# Generate coverage report
echo "========================================"
echo "Generating Coverage Report"
echo "========================================"
npm run test:coverage

# Summary
echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"

if [ "$all_passed" = true ]; then
    echo -e "${GREEN}All tests passed successfully!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi