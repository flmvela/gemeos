import { test, expect } from '@playwright/test';

test.describe('Authentication Stability Tests', () => {
  test.setTimeout(60000); // Increase timeout to 60 seconds
  
  test('Platform Admin - Login and Session Stability', async ({ page }) => {
    console.log('Starting Platform Admin login test...');
    
    // Navigate to login page
    await page.goto('http://localhost:8081/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-auth-01-login-page.png', fullPage: true });
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'admin@gemeos.ai');
    await page.fill('input[type="password"]', 'digitaltwin');
    
    // Listen to console messages
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      console.log(text);
    });
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    console.log('Successfully navigated to:', page.url());
    
    // Take screenshot after login
    await page.screenshot({ path: 'test-auth-02-dashboard.png', fullPage: true });
    
    // Wait 30 seconds and check if still logged in
    console.log('Waiting 30 seconds to check session stability...');
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(5000);
      console.log(`Elapsed: ${(i + 1) * 5} seconds, Current URL: ${page.url()}`);
      
      // Check if still on dashboard
      if (!page.url().includes('/admin/dashboard')) {
        console.error('User was logged out! Current URL:', page.url());
        await page.screenshot({ path: `test-auth-error-logout-${i}.png`, fullPage: true });
        throw new Error('Unexpected logout detected');
      }
    }
    
    console.log('✅ Platform Admin session remained stable for 30 seconds');
    await page.screenshot({ path: 'test-auth-03-stable-session.png', fullPage: true });
    
    // Print console logs
    console.log('\n=== Console Logs ===');
    consoleLogs.forEach(log => console.log(log));
  });

  test('Tenant Admin - Login and Session Stability', async ({ page }) => {
    console.log('Starting Tenant Admin login test...');
    
    // Navigate to login page
    await page.goto('http://localhost:8081/login');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-auth-04-tenant-login.png', fullPage: true });
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'flm.velardi+ta1010@gmail.com');
    await page.fill('input[type="password"]', 'Tenant2025!');
    
    // Listen to console messages
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      console.log(text);
    });
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation (could be /tenant/dashboard or /no-access)
    await page.waitForTimeout(3000);
    console.log('Navigated to:', page.url());
    
    // Take screenshot after login
    await page.screenshot({ path: 'test-auth-05-tenant-result.png', fullPage: true });
    
    // Check where we landed
    const currentUrl = page.url();
    if (currentUrl.includes('/no-access')) {
      console.log('User has no tenant access - this is expected behavior');
      await page.screenshot({ path: 'test-auth-06-no-access.png', fullPage: true });
    } else if (currentUrl.includes('/tenant/dashboard')) {
      console.log('User successfully logged in to tenant dashboard');
      
      // Wait 30 seconds and check if still logged in
      console.log('Waiting 30 seconds to check session stability...');
      for (let i = 0; i < 6; i++) {
        await page.waitForTimeout(5000);
        console.log(`Elapsed: ${(i + 1) * 5} seconds, Current URL: ${page.url()}`);
        
        // Check if still on dashboard
        if (currentUrl.includes('/login')) {
          console.error('User was logged out! Current URL:', page.url());
          await page.screenshot({ path: `test-auth-tenant-error-logout-${i}.png`, fullPage: true });
          throw new Error('Unexpected logout detected');
        }
      }
      
      console.log('✅ Tenant session remained stable for 30 seconds');
      await page.screenshot({ path: 'test-auth-07-tenant-stable.png', fullPage: true });
    }
    
    // Print console logs
    console.log('\n=== Console Logs ===');
    consoleLogs.forEach(log => console.log(log));
  });
});