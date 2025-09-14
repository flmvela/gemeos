import { test, expect } from '@playwright/test';

test.describe('Class Creation Wizard', () => {
  test('Teacher can access and navigate class creation wizard', async ({ page }) => {
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
    
    // Take screenshot of teacher dashboard
    await page.screenshot({ 
      path: 'teacher-dashboard.png',
      fullPage: true 
    });
    
    // Look for and click "Add Class" button
    const addClassButton = page.locator('button:has-text("Add Class")');
    await expect(addClassButton).toBeVisible({ timeout: 10000 });
    await addClassButton.click();
    
    // Wait for class creation landing page
    await page.waitForSelector('text="Create New Class"', { timeout: 5000 });
    
    // Click the "Create New Class" button on the landing page to open the wizard
    await page.click('button:has-text("Create New Class")');
    
    // Wait for wizard modal to open
    await page.waitForSelector('h2:has-text("Create New Class")', { timeout: 5000 });
    
    // Take screenshot of wizard - Domain Selection step
    await page.screenshot({ 
      path: 'wizard-step-1-domain.png',
      fullPage: true 
    });
    
    // Select a domain (if available)
    const domainCard = page.locator('[id^="domain-"]').first();
    if (await domainCard.count() > 0) {
      await domainCard.click();
      await page.waitForTimeout(500);
      
      // Click Next
      await page.click('button:has-text("Next")');
      
      // Wait for Configuration step
      await page.waitForSelector('text="Class Configuration"', { timeout: 5000 });
      
      // Take screenshot of Configuration step
      await page.screenshot({ 
        path: 'wizard-step-2-configuration.png',
        fullPage: true 
      });
      
      // Fill in class name
      await page.fill('input[id="className"]', 'Test Piano Class');
      
      // Select difficulty levels - click on the difficulty level card/container
      const difficultyCard = page.locator('div:has(input[type="checkbox"])').first();
      if (await difficultyCard.count() > 0) {
        await difficultyCard.click();
        await page.waitForTimeout(500);
      }
      
      // Click Next
      await page.click('button:has-text("Next")');
      
      // Wait for Sessions step
      await page.waitForSelector('text="Schedule Sessions"', { timeout: 10000 });
      
      // Take screenshot of Sessions step
      await page.screenshot({ 
        path: 'wizard-step-3-sessions.png',
        fullPage: true 
      });
      
      // Select recurring sessions
      await page.click('label[for="recurring"]');
      await page.waitForTimeout(500);
      
      // Click Next
      await page.click('button:has-text("Next")');
      
      // Wait for Students step
      await page.waitForSelector('text="Add Students"', { timeout: 5000 });
      
      // Take screenshot of Students step
      await page.screenshot({ 
        path: 'wizard-step-4-students.png',
        fullPage: true 
      });
      
      // Add a student email
      await page.fill('input[type="email"]', 'student1@example.com');
      await page.click('button:has-text("Add")');
      await page.waitForTimeout(500);
      
      // Click Next
      await page.click('button:has-text("Next")');
      
      // Wait for Review step
      await page.waitForSelector('text="Review & Create"', { timeout: 5000 });
      
      // Take screenshot of Review step
      await page.screenshot({ 
        path: 'wizard-step-5-review.png',
        fullPage: true 
      });
      
      console.log('✅ Successfully navigated through all wizard steps');
      
      // Close wizard
      await page.click('button:has-text("Cancel")');
    } else {
      console.log('⚠️ No domains available for selection');
      
      // Take screenshot of empty domain state
      await page.screenshot({ 
        path: 'wizard-no-domains.png',
        fullPage: true 
      });
    }
    
    // Final dashboard screenshot
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'teacher-dashboard-final.png',
      fullPage: true 
    });
  });
});