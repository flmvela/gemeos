import { test, expect, Page } from '@playwright/test';

test.describe('Teacher Students Page', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Navigate to the teacher dashboard
    await page.goto('http://localhost:8080/teacher/dashboard');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should login as teacher and access students page', async () => {
    // Check if we're on login page and need to authenticate
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // If we're redirected to login, fill in credentials
    if (currentUrl.includes('/login') || await page.locator('input[type="email"]').isVisible()) {
      console.log('Login page detected, logging in...');
      
      // Fill in email
      await page.fill('input[type="email"]', 'flm.velardi+teacher13@gmail.com');
      
      // Fill in password
      await page.fill('input[type="password"]', 'Digitaltwin1!');
      
      // Click login button
      await page.click('button[type="submit"]');
      
      // Wait for navigation after login
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Give some time for redirect
    }
    
    // Take a screenshot after login
    await page.screenshot({ path: '.playwright-mcp/after-teacher-login.png', fullPage: true });
    console.log('Screenshot saved: after-teacher-login.png');
    
    // Check current URL after login
    const postLoginUrl = page.url();
    console.log('Post-login URL:', postLoginUrl);
    
    // Look for "View Students" button or similar
    console.log('Looking for View Students button...');
    
    // Try different possible selectors for the students button
    const possibleSelectors = [
      'text=View Students',
      'text=Students',
      'button:has-text("Students")',
      'a:has-text("Students")',
      '[data-testid="view-students"]',
      'button:has-text("View Students")'
    ];
    
    let studentsButton = null;
    for (const selector of possibleSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        studentsButton = page.locator(selector);
        if (await studentsButton.isVisible()) {
          console.log(`Found students button with selector: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!studentsButton || !(await studentsButton.isVisible())) {
      console.log('View Students button not found. Taking screenshot of current page...');
      await page.screenshot({ path: '.playwright-mcp/teacher-dashboard-no-students-button.png', fullPage: true });
      
      // Get all buttons and links text for debugging
      const allButtons = await page.locator('button, a').allTextContents();
      console.log('All buttons/links found:', allButtons);
      
      // Try to navigate directly to students page if button not found
      console.log('Attempting to navigate directly to students page...');
      await page.goto('http://localhost:8080/teacher/students');
      await page.waitForLoadState('networkidle');
    } else {
      // Click the students button
      console.log('Clicking View Students button...');
      await studentsButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    
    // Take screenshot of the students page
    await page.screenshot({ path: '.playwright-mcp/teacher-students-page.png', fullPage: true });
    console.log('Screenshot saved: teacher-students-page.png');
    
    // Check current URL
    const studentsPageUrl = page.url();
    console.log('Students page URL:', studentsPageUrl);
    
    // Check for students or empty state
    console.log('Checking for students or empty state...');
    
    // Look for common empty state indicators
    const emptyStateSelectors = [
      'text=No students found',
      'text=No students yet',
      'text=Empty',
      '[data-testid="empty-state"]',
      '.empty-state'
    ];
    
    let hasEmptyState = false;
    for (const selector of emptyStateSelectors) {
      try {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          console.log(`Empty state found with selector: ${selector}`);
          const text = await element.textContent();
          console.log(`Empty state text: ${text}`);
          hasEmptyState = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Look for student data
    const studentSelectors = [
      '.student-card',
      '[data-testid="student-item"]',
      '.student-list-item',
      'table tbody tr',
      '.student-row'
    ];
    
    let studentsFound = 0;
    for (const selector of studentSelectors) {
      try {
        const elements = page.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          studentsFound = count;
          console.log(`Found ${count} students with selector: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // Get all text content for analysis
    const pageText = await page.textContent('body');
    console.log('Page contains students-related text:', pageText?.toLowerCase().includes('student'));
    
    // Check browser console for errors
    console.log('Checking browser console...');
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
    
    // Get any existing console messages
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Refresh to capture any console messages
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Final screenshot after reload
    await page.screenshot({ path: '.playwright-mcp/teacher-students-page-final.png', fullPage: true });
    
    // Report findings
    console.log('=== STUDENTS PAGE ANALYSIS ===');
    console.log(`Students found: ${studentsFound}`);
    console.log(`Has empty state: ${hasEmptyState}`);
    console.log(`Current URL: ${studentsPageUrl}`);
    console.log(`Console messages: ${consoleMessages.length > 0 ? consoleMessages.join(', ') : 'None captured'}`);
  });

  test.afterAll(async () => {
    if (page) {
      await page.close();
    }
  });
});