import { test, expect } from '@playwright/test';

test.describe('Domain Concepts Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the domain concepts page
    await page.goto('/admin/domain/472a6e02-8733-431a-bb76-5d517767cab7/concepts');
  });

  test('should not display Back to Learning Domains button', async ({ page }) => {
    // Check that the "Back to Learning Domains" button is not present
    await expect(page.getByRole('button', { name: 'Back to Learning Domains' })).not.toBeVisible();
  });

  test('should not display domain stats counters', async ({ page }) => {
    // Check that the counters (Goals, Concepts, Exercises) are not displayed in the header
    await expect(page.getByText('Goals')).not.toBeVisible();
    await expect(page.getByText('Concepts')).not.toBeVisible();
    await expect(page.getByText('Exercises')).not.toBeVisible();
  });

  test('should display domain name and description', async ({ page }) => {
    // Check that the domain name is displayed
    await expect(page.getByRole('heading', { name: 'Jazz music' })).toBeVisible();
    
    // Check that domain description is displayed
    await expect(page.getByText('This domain focuses on mastering jazz')).toBeVisible();
  });

  test('should display Concept Management section', async ({ page }) => {
    // Check that the "Concept Management" section is still present (should not be touched)
    await expect(page.getByRole('heading', { name: 'Concept Management' })).toBeVisible();
    
    // Check for Add Concept button
    await expect(page.getByRole('button', { name: 'Add Concept' })).toBeVisible();
  });

  test('should display concept tree', async ({ page }) => {
    // Wait for concepts to load
    await page.waitForSelector('[data-testid="concept-tree"]', { timeout: 10000 });
    
    // Check that concepts are displayed in the tree view
    await expect(page.locator('.concept-card')).toBeVisible();
  });

  test('should have consistent page width with dashboard', async ({ page }) => {
    // Check that the page uses the same max-width as the dashboard
    const pageContainer = page.locator('[class*="max-w-7xl"]');
    await expect(pageContainer).toBeVisible();
  });
});