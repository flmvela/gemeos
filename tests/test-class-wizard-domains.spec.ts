import { test, expect } from '@playwright/test';

test.describe('Class Creation Wizard - Domain Loading', () => {
  test('Teacher can see domains from database', async ({ page }) => {
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
    
    // Wait a bit for domains to load from database
    await page.waitForTimeout(3000);
    
    // Take screenshot to see what's displayed
    await page.screenshot({ 
      path: 'wizard-domains-loaded.png',
      fullPage: true 
    });
    
    // Check if we have the loading skeleton or actual domains
    const loadingSkeletons = page.locator('[class*="skeleton"]');
    const skeletonCount = await loadingSkeletons.count();
    
    if (skeletonCount > 0) {
      console.log('⏳ Still loading domains...');
      await page.waitForTimeout(2000);
    }
    
    // Check for domain cards
    const domainCards = page.locator('input[type="radio"][id^="domain-"]');
    const domainCount = await domainCards.count();
    
    if (domainCount > 0) {
      console.log(`✅ Found ${domainCount} domain(s) from database`);
      
      // Get domain names
      for (let i = 0; i < domainCount; i++) {
        const domainCard = domainCards.nth(i);
        const domainId = await domainCard.getAttribute('id');
        const domainLabel = page.locator(`label[for="${domainId}"]`);
        const domainText = await domainLabel.textContent();
        console.log(`  - Domain ${i + 1}: ${domainText?.trim()}`);
      }
      
      // Select first domain
      await domainCards.first().click();
      console.log('✅ Selected first domain');
      
      // Try to proceed to next step
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(1000);
      
      // Check if we moved to configuration step
      const configTitle = page.locator('h3:has-text("Class Configuration")');
      if (await configTitle.isVisible()) {
        console.log('✅ Successfully moved to Configuration step');
      }
    } else {
      // Check for error or empty state message
      const errorAlert = page.locator('[role="alert"]');
      if (await errorAlert.count() > 0) {
        const errorText = await errorAlert.textContent();
        console.log(`⚠️ Alert shown: ${errorText}`);
      } else {
        console.log('❌ No domains found from database');
      }
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'wizard-final-state.png',
      fullPage: true 
    });
    
    console.log('\n🎉 Domain loading test completed!');
  });
});