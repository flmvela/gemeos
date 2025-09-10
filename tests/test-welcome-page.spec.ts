import { test, expect } from '@playwright/test';

test.describe('Welcome Page Tests', () => {
  test('Welcome page loads without hanging', async ({ page }) => {
    console.log('Testing Welcome page loading...');
    
    // Clear cookies to ensure no session
    await page.context().clearCookies();
    
    // Navigate to welcome page
    await page.goto('http://localhost:8081/welcome');
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    
    // Wait up to 5 seconds for either the hero section or loading to disappear
    await page.waitForTimeout(1000);
    
    // Check if loading spinner is still visible after timeout
    const loadingVisible = await page.locator('text=Loading...').isVisible();
    
    if (loadingVisible) {
      // Wait for the 3-second timeout to trigger
      await page.waitForTimeout(3000);
    }
    
    // Hero section should be visible
    const heroVisible = await page.locator('text=/The Future of Learning/i').isVisible();
    expect(heroVisible).toBe(true);
    
    // Check that we're still on the welcome page (not redirected)
    expect(page.url()).toContain('/welcome');
    
    // Take screenshot for verification
    await page.screenshot({ path: 'welcome-page-loaded.png', fullPage: true });
    
    console.log('✅ Welcome page loaded successfully');
  });
  
  test('Logged out users can see Welcome page content', async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    
    // Navigate to welcome page
    await page.goto('http://localhost:8081/welcome');
    await page.waitForLoadState('networkidle');
    
    // Wait for content to load (accounting for possible auth check)
    await page.waitForTimeout(4000);
    
    // Verify key sections are visible
    const sectionsToCheck = [
      'The Future of Learning',
      'Platform Pillars',
      'How It Works'
    ];
    
    for (const section of sectionsToCheck) {
      const sectionVisible = await page.locator(`text=/${section}/i`).isVisible();
      expect(sectionVisible).toBe(true);
      console.log(`✅ Section "${section}" is visible`);
    }
    
    console.log('✅ All Welcome page sections are accessible');
  });
});