import { test, expect } from '@playwright/test';

test.describe('Class Creation Wizard - Simple Test', () => {
  test('Teacher can open class creation wizard and see all steps', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:8080/login');
    
    // Wait for the login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in login credentials
    await page.fill('input[type="email"]', 'flm.velardi+teacher13@gmail.com');
    await page.fill('input[type="password"]', 'Digitaltwin1!');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/teacher/dashboard', { timeout: 15000 });
    console.log('✅ Logged in successfully');
    
    // Look for and click "Add Class" button
    const addClassButton = page.locator('button:has-text("Add Class")');
    await expect(addClassButton).toBeVisible({ timeout: 10000 });
    await addClassButton.click();
    
    // Wait for class creation landing page
    await page.waitForSelector('text="Ready to Create Your First Class?"', { timeout: 5000 });
    console.log('✅ Class creation landing page loaded');
    
    // Click the "Create New Class" button on the landing page to open the wizard
    await page.click('button:has-text("Create New Class")');
    
    // Wait for wizard modal to open
    await page.waitForSelector('h2:has-text("Create New Class")', { timeout: 5000 });
    console.log('✅ Wizard opened successfully');
    
    // Verify all wizard steps are visible in the sidebar
    const sidebar = page.locator('div.w-full.sm\\:w-64');
    await expect(sidebar.locator('text="Select Domain"')).toBeVisible();
    await expect(sidebar.locator('text="Class Configuration"')).toBeVisible();
    await expect(sidebar.locator('text="Schedule Sessions"')).toBeVisible();
    await expect(sidebar.locator('text="Add Students"')).toBeVisible();
    await expect(sidebar.locator('text="Review & Create"')).toBeVisible();
    console.log('✅ All wizard steps are visible');
    
    // Check that Step 1 (Domain Selection) is active
    await expect(page.locator('text="Step 1 of 5"')).toBeVisible();
    console.log('✅ Domain selection step is active');
    
    // Check for mock domains
    const domainCards = page.locator('[id^="domain-"]');
    const domainCount = await domainCards.count();
    console.log(`✅ Found ${domainCount} domain(s) available`);
    
    if (domainCount > 0) {
      // Select first domain
      await domainCards.first().click();
      await page.waitForTimeout(500);
      console.log('✅ Selected first domain');
      
      // Click Next to go to Configuration step
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(1000);
      
      // Check if we're on Configuration step
      const configStepActive = await page.locator('text="Step 2 of 5"').isVisible().catch(() => false);
      if (configStepActive) {
        console.log('✅ Navigated to Configuration step');
        
        // Fill in class name
        await page.fill('input[id="className"]', 'Test Class');
        console.log('✅ Filled class name');
        
        // Scroll down to see difficulty levels
        await page.evaluate(() => {
          const content = document.querySelector('[class*="overflow-y-auto"]');
          if (content) content.scrollTop = content.scrollHeight;
        });
        await page.waitForTimeout(500);
        
        // Try to select a difficulty level
        const difficultyCheckbox = page.locator('input[type="checkbox"]').first();
        const checkboxCount = await difficultyCheckbox.count();
        console.log(`✅ Found ${checkboxCount} difficulty level checkbox(es)`);
        
        if (checkboxCount > 0) {
          // Click the parent container instead of checkbox directly
          const difficultyContainer = page.locator('div:has(> input[type="checkbox"])').first();
          await difficultyContainer.click();
          console.log('✅ Selected difficulty level');
        }
      }
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'wizard-final-state.png',
      fullPage: true 
    });
    
    // Close wizard
    await page.click('button:has-text("Cancel")');
    console.log('✅ Wizard closed');
    
    console.log('\n🎉 Class Creation Wizard test completed successfully!');
  });
});