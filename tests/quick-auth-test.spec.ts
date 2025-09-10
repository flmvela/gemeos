import { test, expect } from '@playwright/test';

test('Quick login test', async ({ page }) => {
  // Navigate to login
  await page.goto('http://localhost:8081/login');
  await page.waitForLoadState('networkidle');
  
  // Check if page loaded
  const loginTitle = await page.locator('text=/Welcome back/i').isVisible();
  console.log('Login page visible:', loginTitle);
  
  // Fill credentials
  await page.fill('input[type="email"]', 'admin@gemeos.ai');
  await page.fill('input[type="password"]', 'digitaltwin');
  
  // Click login
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForURL('**/dashboard', { timeout: 5000 }).catch(() => {
    console.log('Current URL after login:', page.url());
  });
  
  console.log('Final URL:', page.url());
  
  // Check if we're on a dashboard
  expect(page.url()).toMatch(/dashboard/);
});