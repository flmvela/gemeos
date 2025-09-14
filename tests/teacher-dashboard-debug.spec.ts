import { test, expect, Page } from '@playwright/test';

test.describe('Teacher Dashboard Debug Test', () => {
  test('Test teacher dashboard classes loading and debug logs', async ({ page }) => {
    // Set up console log tracking
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(`ERROR: ${text}`);
      } else if (text.includes('fetchClasses') || text.includes('Classes') || text.includes('DEBUG')) {
        consoleLogs.push(`${msg.type().toUpperCase()}: ${text}`);
      }
    });

    // Navigate to the application
    console.log('🔍 Navigating to teacher dashboard...');
    await page.goto('http://localhost:8080/teacher/dashboard');
    
    // Wait for login page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're on login page
    const isLoginPage = await page.locator('input[type="email"]').isVisible();
    
    if (isLoginPage) {
      console.log('📝 Login page detected, filling credentials...');
      
      // Fill in login credentials
      await page.fill('input[type="email"]', 'flm.velardi+teacher13@gmail.com');
      await page.fill('input[type="password"]', 'Digitaltwin1!');
      
      // Click login button
      await page.click('button[type="submit"]');
      
      // Wait for redirect after login
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Give extra time for auth to process
    }
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    
    // Look for classes section
    console.log('🔍 Looking for classes section...');
    
    // Check for loading states
    const loadingElements = await page.locator('text=Loading').count();
    console.log(`📊 Found ${loadingElements} loading elements`);
    
    // Check for "No classes yet" message
    const noClassesMessage = await page.locator('text=No classes yet').isVisible();
    console.log(`📝 "No classes yet" message visible: ${noClassesMessage}`);
    
    // Check for any class-related content
    const classListElements = await page.locator('[class*="class"], [data-testid*="class"]').count();
    console.log(`📚 Found ${classListElements} class-related elements`);
    
    // Take screenshot of the classes section
    console.log('📸 Taking screenshot of classes section...');
    await page.screenshot({ 
      path: '.playwright-mcp/teacher-dashboard-classes-debug.png',
      fullPage: true 
    });
    
    // Wait a bit more and check logs again
    await page.waitForTimeout(2000);
    
    // Report findings
    console.log('\n=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));
    
    console.log('\n=== CONSOLE ERRORS ===');
    consoleErrors.forEach(error => console.log(error));
    
    console.log('\n=== SUMMARY ===');
    console.log(`- Console logs captured: ${consoleLogs.length}`);
    console.log(`- Console errors: ${consoleErrors.length}`);
    console.log(`- Loading elements found: ${loadingElements}`);
    console.log(`- "No classes yet" message: ${noClassesMessage}`);
    console.log(`- Class-related elements: ${classListElements}`);
    
    // Check if we can find specific class-related debug logs
    const fetchClassesLogs = consoleLogs.filter(log => log.includes('fetchClasses'));
    console.log(`- fetchClasses debug logs: ${fetchClassesLogs.length}`);
    fetchClassesLogs.forEach(log => console.log(`  ${log}`));
  });
});