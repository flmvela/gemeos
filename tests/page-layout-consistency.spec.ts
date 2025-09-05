import { test, expect } from '@playwright/test';

test.describe('Page Layout Consistency', () => {
  const pages = [
    { name: 'Admin Dashboard', url: '/admin/dashboard' },
    { name: 'Domain Detail', url: '/admin/domain/472a6e02-8733-431a-bb76-5d517767cab7' },
    { name: 'Domain Concepts', url: '/admin/domain/472a6e02-8733-431a-bb76-5d517767cab7/concepts' },
  ];

  for (const { name, url } of pages) {
    test(`${name} should have consistent page width`, async ({ page }) => {
      await page.goto(url);
      
      // Check that all pages use the PageContainer with max-w-7xl
      const pageContainer = page.locator('[class*="max-w-7xl"]');
      await expect(pageContainer).toBeVisible();
      
      // Check that the container has the expected padding
      const containerWithPadding = page.locator('[class*="p-6"]');
      await expect(containerWithPadding).toBeVisible();
    });

    test(`${name} should have consistent spacing`, async ({ page }) => {
      await page.goto(url);
      
      // Check that pages use consistent vertical spacing
      const spacingContainer = page.locator('[class*="space-y-8"], [class*="space-y-6"]');
      await expect(spacingContainer).toBeVisible();
    });
  }

  test('should have same visual width across all admin pages', async ({ page, browserName }) => {
    const measurements = [];
    
    for (const { url } of pages) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // Measure the actual content width
      const contentWidth = await page.locator('[class*="max-w-7xl"]').first().evaluate(el => {
        return el.getBoundingClientRect().width;
      });
      
      measurements.push({ url, width: contentWidth });
    }
    
    // All pages should have the same content width
    const firstWidth = measurements[0].width;
    for (const { url, width } of measurements) {
      expect(width).toBe(firstWidth);
    }
  });
});