import { chromium } from 'playwright';
import path from 'path';

async function testDashboard() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  
  // Enable console logging for debugging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error));

  try {
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({ 
      path: '/Users/fabiovelardi/gemeos/screenshots/01-initial-page.png',
      fullPage: true 
    });

    // Check if we're on login page or already logged in
    const isLoginPage = await page.locator('input[type="email"]').isVisible();
    
    if (isLoginPage) {
      console.log('Logging in...');
      
      // Fill login credentials
      await page.fill('input[type="email"]', 'flm.velardi+ta1010@gmail.com');
      await page.waitForTimeout(500);
      await page.fill('input[type="password"]', 'Tenant2025!');
      await page.waitForTimeout(500);
      
      // Click login button
      await page.click('button:has-text("Sign in")');
      
      // Wait for navigation after login
      try {
        await page.waitForURL('**/dashboard**', { timeout: 10000 });
        console.log('Successfully logged in and redirected to dashboard');
      } catch (e) {
        console.log('Waiting for login to complete...');
        await page.waitForTimeout(5000);
        
        // Check current URL
        const currentURL = page.url();
        console.log('Current URL after login:', currentURL);
        
        // If still on login page, there might be an error
        if (currentURL.includes('localhost:8081') && !currentURL.includes('dashboard')) {
          console.log('Still on login page, checking for errors...');
          await page.screenshot({ 
            path: '/Users/fabiovelardi/gemeos/screenshots/login-error.png',
            fullPage: true 
          });
        }
      }
    }

    // Navigate to tenant dashboard
    console.log('Navigating to tenant dashboard...');
    await page.goto('http://localhost:8081/tenant/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take dashboard screenshot
    await page.screenshot({ 
      path: '/Users/fabiovelardi/gemeos/screenshots/02-tenant-dashboard.png',
      fullPage: true 
    });

    // Check for the new button layout elements
    console.log('Checking button layout...');
    
    // Wait for the page to fully load
    await page.waitForTimeout(2000);
    
    // Log all buttons on the page for debugging
    const allButtons = await page.locator('button').allTextContents();
    console.log('All buttons found:', allButtons);
    
    // Look for Add Teacher button (gradient blue/purple)
    const addTeacherBtn = page.locator('button:has-text("Add Teacher"), button:has-text("Invite Teacher"), button:has-text("Teacher")').first();
    const hasAddTeacher = await addTeacherBtn.isVisible();
    console.log('Add Teacher button visible:', hasAddTeacher);
    
    // Look for Add Class button (white with border)
    const addClassBtn = page.locator('button:has-text("Add Class"), button:has-text("Create Class"), button:has-text("Class")').first();
    const hasAddClass = await addClassBtn.isVisible();
    console.log('Add Class button visible:', hasAddClass);
    
    // Look for view toggle buttons - list view (three lines icon)
    const listViewBtn = page.locator('button[aria-label*="list"], button[title*="list"], button:has(svg):has-text("")').first();
    const hasListView = await listViewBtn.count() > 0;
    console.log('List view button visible:', hasListView);
    
    // Look for view toggle buttons - grid view (4 squares icon)  
    const gridViewBtn = page.locator('button[aria-label*="grid"], button[title*="grid"], button:has(svg):has-text("")').nth(1);
    const hasGridView = await gridViewBtn.count() > 0;
    console.log('Grid view button visible:', hasGridView);

    // Try clicking on grid view if it exists
    if (hasGridView) {
      console.log('Clicking grid view...');
      await gridViewBtn.click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ 
        path: '/Users/fabiovelardi/gemeos/screenshots/03-dashboard-grid-view.png',
        fullPage: true 
      });
      
      // Click back to list view
      if (hasListView) {
        console.log('Clicking list view...');
        await listViewBtn.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
          path: '/Users/fabiovelardi/gemeos/screenshots/04-dashboard-list-view.png',
          fullPage: true 
        });
      }
    }

    // Check for search bar
    const searchBar = page.locator('input[placeholder*="search"], input[type="search"]');
    const hasSearchBar = await searchBar.isVisible();
    console.log('Search bar visible:', hasSearchBar);

    console.log('Test completed successfully!');
    
    // Summary
    console.log('\n=== LAYOUT VERIFICATION SUMMARY ===');
    console.log('Add Teacher button:', hasAddTeacher ? '✓' : '✗');
    console.log('Add Class button:', hasAddClass ? '✓' : '✗');
    console.log('List view button:', hasListView ? '✓' : '✗');
    console.log('Grid view button:', hasGridView ? '✓' : '✗');
    console.log('Search bar:', hasSearchBar ? '✓' : '✗');

  } catch (error) {
    console.error('Error during test:', error);
    
    // Take error screenshot
    await page.screenshot({ 
      path: '/Users/fabiovelardi/gemeos/screenshots/error-state.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

testDashboard().catch(console.error);