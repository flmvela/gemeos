import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:8081';
const PLATFORM_ADMIN = {
  email: 'admin@gemeos.ai',
  password: 'Admin2025!'
};

// Helper function to take screenshots
async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `/Users/fabiovelardi/gemeos/screenshots/admin-${name}.png`,
    fullPage: true 
  });
}

test('Platform Admin Login and Dashboard', async ({ page }) => {
  // Set viewport to desktop size
  await page.setViewportSize({ width: 1440, height: 900 });
  
  // Navigate to login page
  await page.goto(`${BASE_URL}/login`);
  console.log('✅ Navigated to login page');
  
  // Take screenshot of login page
  await takeScreenshot(page, 'login-page');
  
  // Fill in login credentials
  await page.fill('input[type="email"]', PLATFORM_ADMIN.email);
  await page.fill('input[type="password"]', PLATFORM_ADMIN.password);
  console.log('✅ Filled in credentials');
  
  // Click login button
  await page.click('button[type="submit"]');
  console.log('✅ Clicked login button');
  
  // Wait for navigation - could be admin or tenant dashboard
  await page.waitForURL((url) => {
    return url.pathname.includes('/dashboard') || 
           url.pathname.includes('/admin') || 
           url.pathname.includes('/tenant');
  }, { timeout: 10000 });
  console.log('✅ Successfully redirected after login');
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle');
  
  // Verify we're on the correct page
  const url = page.url();
  console.log(`📍 Current URL: ${url}`);
  
  // Check for dashboard elements
  const dashboardTitle = await page.locator('h1').first().textContent();
  console.log(`📊 Dashboard Title: ${dashboardTitle}`);
  
  // Take screenshot of dashboard
  await takeScreenshot(page, 'dashboard');
  
  // Look for key admin elements
  const elements = {
    'Sidebar': await page.locator('[data-sidebar]').isVisible(),
    'Dashboard Header': await page.locator('h1').first().isVisible(),
    'Navigation': await page.locator('nav').first().isVisible()
  };
  
  console.log('\n🔍 Dashboard Elements:');
  for (const [name, visible] of Object.entries(elements)) {
    console.log(`  ${visible ? '✅' : '❌'} ${name}`);
  }
  
  // Check for admin-specific menu items
  const adminMenuItems = [
    'Platform Administration',
    'Tenant Admin',
    'Domain Admin',
    'Teacher Area'
  ];
  
  console.log('\n📋 Admin Menu Items:');
  for (const item of adminMenuItems) {
    const isVisible = await page.locator(`text="${item}"`).isVisible().catch(() => false);
    console.log(`  ${isVisible ? '✅' : '❌'} ${item}`);
  }
  
  // Keep browser open for 5 seconds to view the result
  await page.waitForTimeout(5000);
  
  console.log('\n🎉 Platform Admin login test completed successfully!');
});