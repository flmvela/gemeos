import { test, expect } from '@playwright/test';

test.describe('RBAC Management Pages Tab Test', () => {
  test('Verify Pages tab structure and content', async ({ page }) => {
    // Navigate to RBAC Management page
    await page.goto('http://localhost:8084/admin/rbac-management');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/rbac-management-initial.png',
      fullPage: true 
    });
    
    // Click on Pages tab
    const pagesTab = page.getByRole('tab', { name: /Pages/i });
    await expect(pagesTab).toBeVisible();
    await pagesTab.click();
    await page.waitForTimeout(1000); // Wait for tab transition
    
    // Take screenshot of Pages tab
    await page.screenshot({ 
      path: 'test-results/rbac-pages-tab.png',
      fullPage: true 
    });
    
    // Test 1: Verify title and description
    const pageTitle = page.getByRole('heading', { name: 'Page Registry' });
    await expect(pageTitle).toBeVisible();
    
    const pageDescription = page.getByText('Complete list of all pages in the system with their canonical names and URLs');
    await expect(pageDescription).toBeVisible();
    
    // Test 2: Verify table structure - check for correct columns
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    
    // Check column headers
    const columnHeaders = table.locator('thead th');
    const headerTexts = await columnHeaders.allTextContents();
    console.log('Column Headers:', headerTexts);
    
    // Verify expected columns exist
    expect(headerTexts).toContain('Page Name');
    expect(headerTexts).toContain('URL');
    expect(headerTexts).toContain('Description');
    expect(headerTexts).toContain('Category');
    
    // Test 3: Verify NO role permission columns
    const roleColumns = ['platform_admin', 'tenant_admin', 'teacher', 'student', 'guardian'];
    for (const role of roleColumns) {
      const roleHeader = table.locator(`thead th:has-text("${role}")`);
      await expect(roleHeader).toHaveCount(0);
    }
    
    // Test 4: Verify specific page-to-URL mappings
    const expectedMappings = [
      { name: 'Platform Admin Dashboard', url: '/admin/dashboard' },
      { name: 'Tenant Dashboard', url: '/tenant/dashboard' },
      { name: 'Teacher Dashboard', url: '/teacher/dashboard' },
      { name: 'RBAC Management', url: '/admin/rbac-management' },
      { name: 'Tenant Management', url: '/admin/tenants' }
    ];
    
    for (const mapping of expectedMappings) {
      // Find row containing the page name
      const row = table.locator('tbody tr', { has: page.locator(`td:has-text("${mapping.name}")`) }).first();
      
      if (await row.count() > 0) {
        // Verify URL in the same row
        const urlCell = row.locator('td').nth(1); // URL is in second column
        const urlText = await urlCell.textContent();
        console.log(`Mapping: ${mapping.name} -> ${urlText}`);
        expect(urlText?.trim()).toBe(mapping.url);
      } else {
        console.log(`Warning: Could not find row for ${mapping.name}`);
      }
    }
    
    // Test 5: Verify flat structure (no section groupings)
    const sectionHeaders = page.locator('.section-header, .group-header');
    await expect(sectionHeaders).toHaveCount(0);
    
    // Test 6: Check table rows for proper data
    const tableRows = table.locator('tbody tr');
    const rowCount = await tableRows.count();
    console.log(`Total rows in table: ${rowCount}`);
    
    // Sample first few rows to verify structure
    for (let i = 0; i < Math.min(5, rowCount); i++) {
      const row = tableRows.nth(i);
      const cells = row.locator('td');
      const cellCount = await cells.count();
      
      // Should have 4 columns: Page Name, URL, Description, Category
      expect(cellCount).toBe(4);
      
      const pageName = await cells.nth(0).textContent();
      const url = await cells.nth(1).textContent();
      const description = await cells.nth(2).textContent();
      const category = await cells.nth(3).textContent();
      
      console.log(`Row ${i + 1}: ${pageName} | ${url} | ${description} | ${category}`);
      
      // Verify data integrity
      expect(pageName).toBeTruthy();
      expect(url).toMatch(/^\//); // URLs should start with /
      expect(category).toBeTruthy();
    }
    
    // Test 7: Test responsive design
    // Desktop view
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ 
      path: 'test-results/rbac-pages-desktop.png',
      fullPage: true 
    });
    
    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ 
      path: 'test-results/rbac-pages-tablet.png',
      fullPage: true 
    });
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ 
      path: 'test-results/rbac-pages-mobile.png',
      fullPage: true 
    });
    
    // Test 8: Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Refresh to catch any errors
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Click Pages tab again
    await page.getByRole('tab', { name: /Pages/i }).click();
    await page.waitForTimeout(1000);
    
    // Report console errors
    if (consoleErrors.length > 0) {
      console.log('Console Errors Found:', consoleErrors);
    } else {
      console.log('No console errors detected');
    }
    
    // Final full-page screenshot
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ 
      path: 'test-results/rbac-pages-final.png',
      fullPage: true 
    });
    
    console.log('Test completed successfully!');
  });
});