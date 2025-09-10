import { test, expect } from '@playwright/test';

test.describe('RBAC Management Pages Tab Comprehensive Test', () => {
  test('Complete test of Pages tab requirements', async ({ page }) => {
    console.log('=== RBAC PAGES TAB TEST STARTING ===');
    
    // Step 1: Navigate and Login
    console.log('Step 1: Navigating to application...');
    await page.goto('http://localhost:8084');
    await page.waitForLoadState('networkidle');
    
    // Check if we need to login
    const loginButton = page.locator('button:has-text("Sign in")');
    if (await loginButton.isVisible()) {
      console.log('Login required, authenticating...');
      
      // Fill in login credentials (adjust as needed)
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await loginButton.click();
      
      // Wait for navigation after login
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    // Step 2: Navigate to RBAC Management
    console.log('Step 2: Navigating to RBAC Management page...');
    await page.goto('http://localhost:8084/admin/rbac-management');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/01-rbac-management-page.png',
      fullPage: true 
    });
    
    // Step 3: Click on Pages tab
    console.log('Step 3: Looking for Pages tab...');
    
    // Try different selectors for the Pages tab
    let pagesTab = page.getByRole('tab', { name: 'Pages' });
    if (!await pagesTab.isVisible()) {
      pagesTab = page.locator('button:has-text("Pages")').first();
    }
    if (!await pagesTab.isVisible()) {
      pagesTab = page.locator('[role="tab"]:has-text("Pages")');
    }
    
    if (await pagesTab.isVisible()) {
      console.log('Pages tab found, clicking...');
      await pagesTab.click();
      await page.waitForTimeout(1500);
      
      // Take screenshot after clicking Pages tab
      await page.screenshot({ 
        path: 'test-results/02-pages-tab-active.png',
        fullPage: true 
      });
      
      // === TEST REQUIREMENTS VERIFICATION ===
      console.log('\n=== STARTING REQUIREMENTS VERIFICATION ===\n');
      
      // Test 1: Verify title changed to "Page Registry"
      console.log('TEST 1: Verifying title is "Page Registry"...');
      const pageTitle = page.locator('h2, h3').filter({ hasText: 'Page Registry' }).first();
      const titleVisible = await pageTitle.isVisible();
      console.log(`✓ Title "Page Registry": ${titleVisible ? 'PASS' : 'FAIL'}`);
      
      // Test 2: Verify description
      console.log('\nTEST 2: Verifying description...');
      const description = page.locator('text=Complete list of all pages in the system with their canonical names and URLs');
      const descriptionVisible = await description.isVisible();
      console.log(`✓ Description present: ${descriptionVisible ? 'PASS' : 'FAIL'}`);
      
      // Test 3: Verify table structure
      console.log('\nTEST 3: Verifying table structure...');
      const table = page.locator('table').first();
      const tableVisible = await table.isVisible();
      console.log(`✓ Table present: ${tableVisible ? 'PASS' : 'FAIL'}`);
      
      if (tableVisible) {
        // Check column headers
        const headers = await table.locator('thead th').allTextContents();
        console.log('Column headers found:', headers);
        
        const requiredColumns = ['Page Name', 'URL', 'Description', 'Category'];
        const missingColumns = requiredColumns.filter(col => !headers.some(h => h.includes(col)));
        console.log(`✓ Required columns present: ${missingColumns.length === 0 ? 'PASS' : 'FAIL'}`);
        if (missingColumns.length > 0) {
          console.log('  Missing columns:', missingColumns);
        }
        
        // Test 4: Verify NO role columns
        console.log('\nTEST 4: Verifying removal of role columns...');
        const roleColumns = ['platform_admin', 'tenant_admin', 'teacher', 'student', 'guardian'];
        const foundRoleColumns = roleColumns.filter(role => 
          headers.some(h => h.toLowerCase().includes(role.replace('_', ' ')))
        );
        console.log(`✓ Role columns removed: ${foundRoleColumns.length === 0 ? 'PASS' : 'FAIL'}`);
        if (foundRoleColumns.length > 0) {
          console.log('  Found role columns that should be removed:', foundRoleColumns);
        }
        
        // Test 5: Verify specific page mappings
        console.log('\nTEST 5: Verifying page-to-URL mappings...');
        const mappings = [
          { name: 'Platform Admin Dashboard', url: '/admin/dashboard' },
          { name: 'Tenant Dashboard', url: '/tenant/dashboard' },
          { name: 'Teacher Dashboard', url: '/teacher/dashboard' },
          { name: 'RBAC Management', url: '/admin/rbac-management' },
          { name: 'Tenant Management', url: '/admin/tenants' }
        ];
        
        for (const mapping of mappings) {
          const row = table.locator('tbody tr').filter({ hasText: mapping.name }).first();
          if (await row.count() > 0) {
            const cells = await row.locator('td').allTextContents();
            const urlFound = cells[1]?.trim() === mapping.url;
            console.log(`  ${mapping.name} -> ${mapping.url}: ${urlFound ? 'PASS' : 'FAIL'}`);
            if (!urlFound && cells[1]) {
              console.log(`    Found URL: ${cells[1]}`);
            }
          } else {
            console.log(`  ${mapping.name}: NOT FOUND`);
          }
        }
        
        // Test 6: Verify flat structure (no groupings)
        console.log('\nTEST 6: Verifying flat structure (no section groupings)...');
        const sectionHeaders = await page.locator('.section-header, .group-header, .category-header').count();
        console.log(`✓ No section groupings: ${sectionHeaders === 0 ? 'PASS' : 'FAIL'}`);
        if (sectionHeaders > 0) {
          console.log(`  Found ${sectionHeaders} section headers`);
        }
        
        // Test 7: Count and sample rows
        console.log('\nTEST 7: Analyzing table data...');
        const rows = table.locator('tbody tr');
        const rowCount = await rows.count();
        console.log(`Total rows in table: ${rowCount}`);
        
        // Sample first 3 rows
        console.log('\nFirst 3 rows sample:');
        for (let i = 0; i < Math.min(3, rowCount); i++) {
          const cells = await rows.nth(i).locator('td').allTextContents();
          console.log(`  Row ${i + 1}:`);
          console.log(`    Page Name: ${cells[0]?.trim()}`);
          console.log(`    URL: ${cells[1]?.trim()}`);
          console.log(`    Description: ${cells[2]?.trim().substring(0, 50)}...`);
          console.log(`    Category: ${cells[3]?.trim()}`);
        }
      }
      
      // Test 8: Responsive design
      console.log('\nTEST 8: Testing responsive design...');
      
      // Desktop
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.screenshot({ 
        path: 'test-results/03-pages-desktop-1440.png',
        fullPage: true 
      });
      console.log('✓ Desktop view (1440px) captured');
      
      // Tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.screenshot({ 
        path: 'test-results/04-pages-tablet-768.png',
        fullPage: true 
      });
      console.log('✓ Tablet view (768px) captured');
      
      // Mobile
      await page.setViewportSize({ width: 375, height: 812 });
      await page.screenshot({ 
        path: 'test-results/05-pages-mobile-375.png',
        fullPage: true 
      });
      console.log('✓ Mobile view (375px) captured');
      
      // Test 9: Console errors
      console.log('\nTEST 9: Checking for console errors...');
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Reload page to catch any errors
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Re-click Pages tab
      const pagesTabReload = page.getByRole('tab', { name: 'Pages' }).or(page.locator('button:has-text("Pages")').first());
      if (await pagesTabReload.isVisible()) {
        await pagesTabReload.click();
        await page.waitForTimeout(1000);
      }
      
      console.log(`✓ Console errors: ${consoleErrors.length === 0 ? 'NONE (PASS)' : consoleErrors.length + ' errors found (FAIL)'}`);
      if (consoleErrors.length > 0) {
        consoleErrors.forEach((err, i) => console.log(`  Error ${i + 1}: ${err}`));
      }
      
      // Final screenshot
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.screenshot({ 
        path: 'test-results/06-pages-final-verification.png',
        fullPage: true 
      });
      
      console.log('\n=== TEST SUMMARY ===');
      console.log('All requirements have been tested.');
      console.log('Screenshots saved in test-results/ directory');
      console.log('Please review the screenshots and console output for complete verification.');
      
    } else {
      console.error('ERROR: Pages tab not found!');
      console.log('Available tabs/buttons on page:');
      const buttons = await page.locator('button, [role="tab"]').allTextContents();
      buttons.forEach(b => console.log(`  - ${b}`));
      
      await page.screenshot({ 
        path: 'test-results/ERROR-no-pages-tab.png',
        fullPage: true 
      });
    }
    
    console.log('\n=== TEST COMPLETED ===');
  });
});