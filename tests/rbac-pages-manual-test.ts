import { chromium } from 'playwright';

async function testRBACPagesTab() {
  console.log('=== MANUAL RBAC PAGES TAB TEST ===\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('INSTRUCTIONS:');
    console.log('1. Browser will open automatically');
    console.log('2. Please login manually if required');
    console.log('3. Navigate to RBAC Management page');
    console.log('4. Click on the Pages tab');
    console.log('5. Test will continue automatically after 15 seconds\n');
    
    // Navigate to the application
    await page.goto('http://localhost:8084/admin/rbac-management');
    
    // Wait for manual login
    console.log('Waiting 15 seconds for manual login and navigation...');
    await page.waitForTimeout(15000);
    
    console.log('\n=== STARTING AUTOMATED VERIFICATION ===\n');
    
    // Try to find and click Pages tab
    const pagesTab = page.locator('[role="tab"]:has-text("Pages"), button:has-text("Pages")').first();
    if (await pagesTab.isVisible()) {
      console.log('Pages tab found, clicking...');
      await pagesTab.click();
      await page.waitForTimeout(2000);
    }
    
    // Take screenshots
    await page.screenshot({ 
      path: 'test-results/manual-01-current-state.png',
      fullPage: true 
    });
    
    // Perform verifications
    console.log('\n=== VERIFICATION RESULTS ===\n');
    
    // 1. Check title
    const title = await page.locator('h2:has-text("Page Registry"), h3:has-text("Page Registry")').isVisible();
    console.log(`1. Title "Page Registry": ${title ? '✅ PASS' : '❌ FAIL'}`);
    
    // 2. Check description
    const desc = await page.locator('text=Complete list of all pages in the system').isVisible();
    console.log(`2. Description present: ${desc ? '✅ PASS' : '❌ FAIL'}`);
    
    // 3. Check table structure
    const table = page.locator('table').first();
    if (await table.isVisible()) {
      console.log('3. Table structure:');
      
      const headers = await table.locator('thead th').allTextContents();
      console.log('   Headers found:', headers.map(h => h.trim()).filter(h => h));
      
      // Check for required columns
      const hasPageName = headers.some(h => h.includes('Page Name'));
      const hasURL = headers.some(h => h.includes('URL'));
      const hasDescription = headers.some(h => h.includes('Description'));
      const hasCategory = headers.some(h => h.includes('Category'));
      
      console.log(`   - Page Name column: ${hasPageName ? '✅' : '❌'}`);
      console.log(`   - URL column: ${hasURL ? '✅' : '❌'}`);
      console.log(`   - Description column: ${hasDescription ? '✅' : '❌'}`);
      console.log(`   - Category column: ${hasCategory ? '✅' : '❌'}`);
      
      // Check for removed role columns
      const roleColumns = ['platform_admin', 'tenant_admin', 'teacher', 'student', 'guardian'];
      const hasRoleColumns = roleColumns.some(role => 
        headers.some(h => h.toLowerCase().includes(role.replace('_', ' ')))
      );
      console.log(`   - Role columns removed: ${!hasRoleColumns ? '✅ PASS' : '❌ FAIL'}`);
      
      // Sample data
      console.log('\n4. Sample data (first 3 rows):');
      const rows = table.locator('tbody tr');
      const rowCount = await rows.count();
      
      for (let i = 0; i < Math.min(3, rowCount); i++) {
        const cells = await rows.nth(i).locator('td').allTextContents();
        console.log(`   Row ${i + 1}:`);
        if (cells[0]) console.log(`     Page: ${cells[0].trim()}`);
        if (cells[1]) console.log(`     URL: ${cells[1].trim()}`);
        if (cells[2]) console.log(`     Desc: ${cells[2].trim().substring(0, 40)}...`);
        if (cells[3]) console.log(`     Category: ${cells[3].trim()}`);
      }
      
      // Check specific mappings
      console.log('\n5. Checking specific page mappings:');
      const mappings = [
        { name: 'Platform Admin Dashboard', url: '/admin/dashboard' },
        { name: 'Tenant Dashboard', url: '/tenant/dashboard' },
        { name: 'Teacher Dashboard', url: '/teacher/dashboard' }
      ];
      
      for (const map of mappings) {
        const row = rows.filter({ hasText: map.name }).first();
        if (await row.count() > 0) {
          const cells = await row.locator('td').allTextContents();
          const urlMatches = cells[1]?.trim() === map.url;
          console.log(`   ${map.name}: ${urlMatches ? '✅' : '❌'} (found: ${cells[1]?.trim()})`);
        } else {
          console.log(`   ${map.name}: ❌ NOT FOUND`);
        }
      }
    } else {
      console.log('3. Table not found ❌');
    }
    
    // Take responsive screenshots
    console.log('\n6. Taking responsive screenshots...');
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ 
      path: 'test-results/manual-02-tablet.png',
      fullPage: true 
    });
    console.log('   Tablet view saved ✅');
    
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ 
      path: 'test-results/manual-03-mobile.png',
      fullPage: true 
    });
    console.log('   Mobile view saved ✅');
    
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ 
      path: 'test-results/manual-04-desktop-final.png',
      fullPage: true 
    });
    console.log('   Desktop view saved ✅');
    
    console.log('\n=== TEST COMPLETED ===');
    console.log('Screenshots saved in test-results/ directory');
    console.log('\nPress Ctrl+C to close the browser...');
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(60000);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testRBACPagesTab().catch(console.error);