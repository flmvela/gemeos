import { test, expect, Page } from '@playwright/test';

const TEST_CONFIG = {
  baseUrl: 'http://localhost:8086',
  platformAdmin: {
    email: 'admin@gemeos.ai',
    password: 'Admin2025!',
    expectedDashboard: '/admin/dashboard',
    role: 'platform_admin'
  },
  tenantAdmin: {
    email: 'flm.velardi+ta1010@gmail.com',
    password: 'Tenant2025!',
    expectedDashboard: '/tenant/dashboard',
    role: 'tenant_admin'
  }
};

// Helper function to clear session
async function clearSession(page: Page) {
  await page.context().clearCookies();
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (error) {
    // Ignore localStorage access errors on initial page load
    console.log('Session cleared (cookies only)');
  }
}

// Helper function to login
async function loginUser(page: Page, email: string, password: string) {
  await page.goto(`${TEST_CONFIG.baseUrl}/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  // Fill login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Click login button and wait for navigation
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }),
    page.click('button[type="submit"]')
  ]);
  
  return page.url();
}

// Helper to check for console errors
async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

test.describe('Authentication System Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session before each test
    await clearSession(page);
    
    // Set up console error monitoring
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`Console error: ${msg.text()}`);
      }
    });
  });

  test('Platform Admin - Complete Flow', async ({ page }) => {
    console.log('Testing Platform Admin Login...');
    
    // Step 1: Login
    const redirectUrl = await loginUser(page, TEST_CONFIG.platformAdmin.email, TEST_CONFIG.platformAdmin.password);
    
    // Verify correct redirect
    expect(redirectUrl).toContain(TEST_CONFIG.platformAdmin.expectedDashboard);
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'platform-admin-dashboard.png', fullPage: true });
    
    // Step 2: Test navigation to different pages
    console.log('Testing Platform Admin Navigation...');
    
    // Navigate to welcome page (public)
    await page.goto(`${TEST_CONFIG.baseUrl}/welcome`);
    await expect(page).toHaveURL(/.*welcome/);
    
    // Navigate back to admin dashboard
    await page.goto(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.platformAdmin.expectedDashboard}`);
    await expect(page).toHaveURL(/.*admin\/dashboard/);
    
    // Try to access tenant dashboard (should redirect or show appropriate page)
    await page.goto(`${TEST_CONFIG.baseUrl}/tenant/dashboard`);
    await page.waitForTimeout(2000);
    const tenantAccessUrl = page.url();
    console.log(`Platform admin accessing tenant dashboard redirected to: ${tenantAccessUrl}`);
    
    // Step 3: Test session persistence
    console.log('Testing Platform Admin Session Persistence...');
    
    // Refresh page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Should still be on admin dashboard or logged in
    const afterRefreshUrl = page.url();
    expect(afterRefreshUrl).not.toContain('/login');
    
    // Navigate away and back
    await page.goto(`${TEST_CONFIG.baseUrl}/welcome`);
    await page.goto(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.platformAdmin.expectedDashboard}`);
    await page.waitForTimeout(2000);
    
    // Should still have access
    expect(page.url()).toContain('/admin');
    
    console.log('✅ Platform Admin tests completed successfully');
  });

  test('Tenant Admin - Complete Flow', async ({ page }) => {
    console.log('Testing Tenant Admin Login...');
    
    // Step 1: Login
    const redirectUrl = await loginUser(page, TEST_CONFIG.tenantAdmin.email, TEST_CONFIG.tenantAdmin.password);
    
    // Verify correct redirect
    expect(redirectUrl).toContain(TEST_CONFIG.tenantAdmin.expectedDashboard);
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'tenant-admin-dashboard.png', fullPage: true });
    
    // Step 2: Test navigation to different pages
    console.log('Testing Tenant Admin Navigation...');
    
    // Navigate to welcome page (public)
    await page.goto(`${TEST_CONFIG.baseUrl}/welcome`);
    await expect(page).toHaveURL(/.*welcome/);
    
    // Navigate back to tenant dashboard
    await page.goto(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.tenantAdmin.expectedDashboard}`);
    await expect(page).toHaveURL(/.*tenant\/dashboard/);
    
    // Try to access platform admin dashboard (should be blocked)
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/dashboard`);
    await page.waitForTimeout(2000);
    const adminAccessUrl = page.url();
    console.log(`Tenant admin accessing platform dashboard redirected to: ${adminAccessUrl}`);
    
    // Should not be on admin dashboard
    expect(adminAccessUrl).not.toContain('/admin/dashboard');
    
    // Step 3: Test session persistence
    console.log('Testing Tenant Admin Session Persistence...');
    
    // Refresh page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Should still be logged in
    const afterRefreshUrl = page.url();
    expect(afterRefreshUrl).not.toContain('/login');
    
    // Navigate away and back
    await page.goto(`${TEST_CONFIG.baseUrl}/welcome`);
    await page.goto(`${TEST_CONFIG.baseUrl}${TEST_CONFIG.tenantAdmin.expectedDashboard}`);
    await page.waitForTimeout(2000);
    
    // Should still have access
    expect(page.url()).toContain('/tenant');
    
    console.log('✅ Tenant Admin tests completed successfully');
  });

  test('Cross-Navigation and Access Control', async ({ page }) => {
    console.log('Testing Cross-Navigation and Access Control...');
    
    // Test 1: Platform Admin accessing tenant routes
    await clearSession(page);
    await loginUser(page, TEST_CONFIG.platformAdmin.email, TEST_CONFIG.platformAdmin.password);
    
    await page.goto(`${TEST_CONFIG.baseUrl}/tenant/dashboard`);
    await page.waitForTimeout(2000);
    const platformToTenant = page.url();
    console.log(`Platform admin → Tenant dashboard: ${platformToTenant}`);
    
    // Test 2: Tenant Admin accessing platform routes
    await clearSession(page);
    await loginUser(page, TEST_CONFIG.tenantAdmin.email, TEST_CONFIG.tenantAdmin.password);
    
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/dashboard`);
    await page.waitForTimeout(2000);
    const tenantToPlatform = page.url();
    console.log(`Tenant admin → Platform dashboard: ${tenantToPlatform}`);
    
    // Verify tenant admin cannot access platform admin routes
    expect(tenantToPlatform).not.toContain('/admin/dashboard');
    
    // Test 3: Both can access public pages
    await page.goto(`${TEST_CONFIG.baseUrl}/welcome`);
    await expect(page).toHaveURL(/.*welcome/);
    
    console.log('✅ Cross-Navigation tests completed successfully');
  });

  test('Session Timeout and Persistence', async ({ page }) => {
    console.log('Testing Session Timeout and Persistence...');
    
    // Login as platform admin
    await loginUser(page, TEST_CONFIG.platformAdmin.email, TEST_CONFIG.platformAdmin.password);
    
    // Store session data
    const sessionData = await page.evaluate(() => {
      return {
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage)
      };
    });
    
    console.log('Session storage keys:', sessionData);
    
    // Multiple page refreshes
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForTimeout(1000);
      const url = page.url();
      expect(url).not.toContain('/login');
      console.log(`Refresh ${i + 1}: Still logged in at ${url}`);
    }
    
    // Navigate through multiple pages
    const routes = ['/welcome', '/admin/dashboard', '/welcome', '/admin/dashboard'];
    for (const route of routes) {
      await page.goto(`${TEST_CONFIG.baseUrl}${route}`);
      await page.waitForTimeout(1000);
      console.log(`Navigated to ${route}: ${page.url()}`);
    }
    
    // Final check - should still be logged in
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('/login');
    
    console.log('✅ Session persistence tests completed successfully');
  });

  test('Console Error Check', async ({ page }) => {
    console.log('Checking for console errors during authentication...');
    
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Test platform admin flow
    await loginUser(page, TEST_CONFIG.platformAdmin.email, TEST_CONFIG.platformAdmin.password);
    await page.goto(`${TEST_CONFIG.baseUrl}/welcome`);
    await page.goto(`${TEST_CONFIG.baseUrl}/admin/dashboard`);
    
    // Clear and test tenant admin flow
    await clearSession(page);
    await loginUser(page, TEST_CONFIG.tenantAdmin.email, TEST_CONFIG.tenantAdmin.password);
    await page.goto(`${TEST_CONFIG.baseUrl}/welcome`);
    await page.goto(`${TEST_CONFIG.baseUrl}/tenant/dashboard`);
    
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
      // Don't fail the test, just report
    } else {
      console.log('✅ No console errors detected');
    }
    
    expect(errors.length).toBe(0);
  });
});