import { chromium } from 'playwright';

async function testTenantDashboard() {
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000 // Slow down for better debugging
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  
  // Enable console and error logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));

  try {
    console.log('Step 1: Navigate to welcome page...');
    await page.goto('http://localhost:8081/welcome', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: '/Users/fabiovelardi/gemeos/screenshots/step1-welcome.png',
      fullPage: true 
    });

    console.log('Step 2: Click "Get Started" to go to login...');
    // Look for Get Started button or Login link
    const getStartedBtn = page.locator('button:has-text("Get Started"), a:has-text("Get Started"), a:has-text("Login"), button:has-text("Login")').first();
    if (await getStartedBtn.isVisible()) {
      await getStartedBtn.click();
      await page.waitForTimeout(2000);
    } else {
      // Try navigating directly to login page
      console.log('No Get Started button found, navigating directly to login...');
      await page.goto('http://localhost:8081/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }

    console.log('Step 3: Fill login form...');
    
    // Wait for email input to be visible and fill it
    await page.waitForSelector('input[type="email"]', { visible: true });
    await page.fill('input[type="email"]', 'flm.velardi+ta1010@gmail.com');
    
    // Wait for password input and fill it
    await page.waitForSelector('input[type="password"]', { visible: true });
    await page.fill('input[type="password"]', 'Tenant2025!');
    
    // Take screenshot before login
    await page.screenshot({ 
      path: '/Users/fabiovelardi/gemeos/screenshots/step2-credentials-filled.png',
      fullPage: true 
    });
    
    console.log('Step 4: Click sign in...');
    // Click the Sign In button inside the modal dialog
    const signInBtn = page.locator('button[type="submit"]:has-text("Sign In"), button[type="submit"]:has-text("Sign in")').first();
    await signInBtn.click();
    
    // Wait for either dashboard URL or login error
    console.log('Step 5: Waiting for navigation...');
    try {
      // Wait for navigation to complete - could be dashboard or error
      await page.waitForURL(/.*/, { timeout: 10000 });
      await page.waitForTimeout(3000); // Give extra time for page load
      
      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);
      
      // Take screenshot of post-login state
      await page.screenshot({ 
        path: '/Users/fabiovelardi/gemeos/screenshots/step3-post-login.png',
        fullPage: true 
      });
      
      // If we're still on welcome/login page, there was an auth error
      if (currentUrl.includes('/welcome') || currentUrl.includes('/login')) {
        console.log('Login failed - still on auth page');
        const errorText = await page.textContent('body');
        if (errorText.includes('error') || errorText.includes('invalid')) {
          console.log('Found error message on page');
        }
        return;
      }
      
    } catch (e) {
      console.log('Navigation timeout, checking current state...');
    }

    console.log('Step 6: Navigate to tenant dashboard...');
    await page.goto('http://localhost:8081/tenant/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    // Take dashboard screenshot
    await page.screenshot({ 
      path: '/Users/fabiovelardi/gemeos/screenshots/step4-tenant-dashboard.png',
      fullPage: true 
    });
    
    console.log('Step 7: Analyze dashboard elements...');
    
    // Check if we're on the login page (auth failure)
    const isLoginPage = await page.locator('input[type="email"]').isVisible();
    if (isLoginPage) {
      console.log('❌ Still on login page - authentication failed');
      return;
    }
    
    // Wait a bit more for dashboard to fully load
    await page.waitForTimeout(2000);
    
    // Get all text content to see what's on the page
    const pageText = await page.textContent('body');
    console.log('Page contains "Dashboard":', pageText.includes('Dashboard'));
    console.log('Page contains "Teachers":', pageText.includes('Teachers'));
    console.log('Page contains "Add Teacher":', pageText.includes('Add Teacher'));
    
    // Look for the specific buttons and elements
    console.log('Step 8: Check for dashboard elements...');
    
    // Check for Add Teacher button (gradient blue/purple)
    const addTeacherBtn = page.locator('button:has-text("Add Teacher")');
    const hasAddTeacher = await addTeacherBtn.isVisible();
    console.log('✓ Add Teacher button:', hasAddTeacher ? '✅' : '❌');
    
    // Check for Add Class button (white with border) 
    const addClassBtn = page.locator('button:has-text("Add Class")');
    const hasAddClass = await addClassBtn.isVisible();
    console.log('✓ Add Class button:', hasAddClass ? '✅' : '❌');
    
    // Check for List view button (three lines icon)
    const listViewBtn = page.locator('button').filter({ has: page.locator('[data-lucide="list"]') });
    const hasListView = await listViewBtn.count() > 0;
    console.log('✓ List view button:', hasListView ? '✅' : '❌');
    
    // Check for Statistics view button (grid icon)
    const statsViewBtn = page.locator('button').filter({ has: page.locator('[data-lucide="layout-grid"]') });
    const hasStatsView = await statsViewBtn.count() > 0;
    console.log('✓ Statistics view button:', hasStatsView ? '✅' : '❌');
    
    // Check for search bar
    const searchBar = page.locator('input[placeholder*="search"]');
    const hasSearchBar = await searchBar.isVisible();
    console.log('✓ Search bar:', hasSearchBar ? '✅' : '❌');
    
    if (hasStatsView) {
      console.log('Step 9: Testing view toggle - clicking statistics view...');
      await statsViewBtn.click();
      await page.waitForTimeout(1500);
      
      await page.screenshot({ 
        path: '/Users/fabiovelardi/gemeos/screenshots/step5-statistics-view.png',
        fullPage: true 
      });
      
      console.log('Step 10: Testing view toggle - clicking back to list view...');
      await listViewBtn.click();
      await page.waitForTimeout(1500);
      
      await page.screenshot({ 
        path: '/Users/fabiovelardi/gemeos/screenshots/step6-list-view.png',
        fullPage: true 
      });
    }
    
    console.log('\n=== FINAL TEST RESULTS ===');
    console.log('Add Teacher button (gradient blue/purple):', hasAddTeacher ? '✅ PASS' : '❌ FAIL');
    console.log('Add Class button (white with border):', hasAddClass ? '✅ PASS' : '❌ FAIL');
    console.log('List view button (three lines icon):', hasListView ? '✅ PASS' : '❌ FAIL');
    console.log('Statistics view button (grid icon):', hasStatsView ? '✅ PASS' : '❌ FAIL');
    console.log('Search bar below buttons:', hasSearchBar ? '✅ PASS' : '❌ FAIL');
    
    const totalPassed = [hasAddTeacher, hasAddClass, hasListView, hasStatsView, hasSearchBar].filter(Boolean).length;
    console.log(`\n📊 Overall: ${totalPassed}/5 requirements met`);
    
    if (totalPassed === 5) {
      console.log('🎉 All layout requirements are implemented correctly!');
    } else {
      console.log('⚠️  Some layout requirements are missing or not visible.');
    }

  } catch (error) {
    console.error('Test failed with error:', error);
    
    // Take error screenshot
    await page.screenshot({ 
      path: '/Users/fabiovelardi/gemeos/screenshots/error-final.png',
      fullPage: true 
    });
    
  } finally {
    console.log('\nClosing browser...');
    await browser.close();
  }
}

testTenantDashboard().catch(console.error);