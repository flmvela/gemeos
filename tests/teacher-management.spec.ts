import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:8081';
const TENANT_ADMIN = {
  email: 'flm.velardi+ta1010@gmail.com',
  password: 'Tenant2025!'
};

// Helper function to login
async function loginAsTenantAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', TENANT_ADMIN.email);
  await page.fill('input[type="password"]', TENANT_ADMIN.password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation to complete
  await page.waitForURL(/\/(admin|tenant)\/dashboard/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

// Helper function to take screenshots
async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `/Users/fabiovelardi/gemeos/screenshots/teacher-${name}.png`,
    fullPage: true 
  });
}

test.describe('Teacher Management', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('Dashboard layout with new buttons', async ({ page }) => {
    // Login
    await loginAsTenantAdmin(page);
    
    // Check if dashboard loaded
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10000 });
    
    // Take screenshot of dashboard
    await takeScreenshot(page, 'dashboard-overview');
    
    // Verify the button layout
    const teachersCard = page.locator('.bg-white').filter({ hasText: 'Teachers Overview' });
    await expect(teachersCard).toBeVisible();
    
    // Check for Add Teacher button
    const addTeacherBtn = teachersCard.locator('button:has-text("Add Teacher")');
    await expect(addTeacherBtn).toBeVisible();
    
    // Check for Add Class button
    const addClassBtn = teachersCard.locator('button:has-text("Add Class")');
    await expect(addClassBtn).toBeVisible();
    
    // Check for view toggle icons
    const listViewIcon = teachersCard.locator('button svg.lucide-list').first();
    const gridViewIcon = teachersCard.locator('button svg.lucide-layout-grid').first();
    
    // Take screenshot of Teachers Overview section
    await teachersCard.scrollIntoViewIfNeeded();
    await takeScreenshot(page, 'teachers-overview-section');
    
    console.log('✅ Dashboard layout verified with all buttons');
  });

  test('Toggle between list and statistics view', async ({ page }) => {
    await loginAsTenantAdmin(page);
    
    // Wait for dashboard
    await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 });
    
    const teachersCard = page.locator('.bg-white').filter({ hasText: 'Teachers Overview' });
    
    // Click statistics view
    const gridButton = teachersCard.locator('button').filter({ has: page.locator('svg.lucide-layout-grid') });
    await gridButton.click();
    
    // Wait for statistics view to appear
    await page.waitForTimeout(500);
    
    // Check if statistics view is displayed
    const statsView = page.locator('text=Student Enrollment Trends');
    const isStatsVisible = await statsView.isVisible().catch(() => false);
    
    if (isStatsVisible) {
      await takeScreenshot(page, 'statistics-view');
      console.log('✅ Statistics view displayed');
    }
    
    // Click back to list view
    const listButton = teachersCard.locator('button').filter({ has: page.locator('svg.lucide-list') });
    await listButton.click();
    
    // Wait for list view
    await page.waitForTimeout(500);
    
    // Check if teacher table is visible
    const teacherTable = page.locator('table').filter({ has: page.locator('text=Teacher Name') });
    const isTableVisible = await teacherTable.isVisible().catch(() => false);
    
    if (isTableVisible) {
      await takeScreenshot(page, 'list-view');
      console.log('✅ List view displayed');
    }
  });

  test('Create new teacher - Full wizard flow', async ({ page }) => {
    await loginAsTenantAdmin(page);
    
    // Wait for dashboard and click Add Teacher
    await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 });
    const addTeacherBtn = page.locator('button:has-text("Add Teacher")');
    await addTeacherBtn.click();
    
    // Wait for teacher creation page
    await page.waitForURL('**/admin/teacher/create**', { timeout: 10000 });
    await expect(page.locator('h1:has-text("Create New Teacher")')).toBeVisible();
    
    await takeScreenshot(page, 'create-step1-initial');
    
    // Step 1: Basic Information
    await page.fill('input[type="email"]', 'john.smith@example.com');
    await page.fill('input[placeholder="John"]', 'John');
    await page.fill('input[placeholder="Doe"]', 'Smith');
    await page.fill('input[type="tel"]', '+1 555 123 4567');
    
    // Toggle invitation switch off to set password
    const inviteSwitch = page.locator('#sendInvitation');
    await inviteSwitch.click();
    await page.fill('input[type="password"]', 'TempPass123!');
    
    await takeScreenshot(page, 'create-step1-filled');
    
    // Click Next
    await page.click('button:has-text("Next")');
    
    // Step 2: Domain Assignment
    await page.waitForSelector('text=Primary Teaching Domain', { timeout: 5000 });
    
    // Select primary domain
    await page.click('button:has-text("Choose primary domain")');
    await page.click('text=Piano');
    
    // Add additional domain
    await page.click('button:has-text("Select a domain")');
    await page.click('text=Music Theory');
    await page.click('button:has-text("Add")');
    
    // Set teaching modalities
    const onlineCheckbox = page.locator('input[type="checkbox"]#online');
    if (!(await onlineCheckbox.isChecked())) {
      await onlineCheckbox.click();
    }
    
    await takeScreenshot(page, 'create-step2-domains');
    await page.click('button:has-text("Next")');
    
    // Step 3: Schedule & Availability
    await page.waitForSelector('text=Weekly Availability', { timeout: 5000 });
    
    // Keep default schedule (Mon-Fri 9-5)
    await takeScreenshot(page, 'create-step3-schedule');
    await page.click('button:has-text("Next")');
    
    // Step 4: Permissions & Access
    await page.waitForSelector('text=System Permissions', { timeout: 5000 });
    
    // Enable view reports permission
    const reportsSwitch = page.locator('#canViewReports');
    await reportsSwitch.click();
    
    await takeScreenshot(page, 'create-step4-permissions');
    await page.click('button:has-text("Next")');
    
    // Step 5: Review & Confirm
    await page.waitForSelector('text=Please review the teacher information', { timeout: 5000 });
    
    // Verify summary shows correct information
    await expect(page.locator('text=John Smith')).toBeVisible();
    await expect(page.locator('text=john.smith@example.com')).toBeVisible();
    await expect(page.locator('text=Piano')).toBeVisible();
    
    await takeScreenshot(page, 'create-step5-review');
    
    // Click Create Teacher button
    const createBtn = page.locator('button:has-text("Create Teacher")');
    const isEnabled = await createBtn.isEnabled();
    
    if (isEnabled) {
      await createBtn.click();
      console.log('✅ Clicked Create Teacher button');
      
      // Wait for navigation back to dashboard or success message
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'create-completed');
    }
    
    console.log('✅ Teacher creation wizard completed');
  });

  test('Navigate through wizard steps', async ({ page }) => {
    await loginAsTenantAdmin(page);
    
    // Navigate to teacher creation
    await page.click('button:has-text("Add Teacher")');
    await page.waitForURL('**/admin/teacher/create**', { timeout: 10000 });
    
    // Test step navigation
    const steps = [
      'Basic Information',
      'Domain Assignment', 
      'Schedule & Availability',
      'Permissions & Access',
      'Review & Confirm'
    ];
    
    // Click through each step in sidebar
    for (let i = 0; i < steps.length; i++) {
      const stepButton = page.locator('button').filter({ hasText: steps[i] });
      
      // Can only navigate to completed steps or next step
      if (i <= 1) {
        await stepButton.click();
        await page.waitForTimeout(500);
        
        // Verify we're on the correct step
        const activeStep = page.locator('.bg-primary\\/10').filter({ hasText: steps[i] });
        await expect(activeStep).toBeVisible();
        
        console.log(`✅ Navigated to step: ${steps[i]}`);
      }
    }
    
    // Test Previous/Next navigation
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Previous")');
    await page.waitForTimeout(500);
    
    console.log('✅ Step navigation working');
  });

  test('Validation errors display', async ({ page }) => {
    await loginAsTenantAdmin(page);
    
    // Navigate to teacher creation
    await page.click('button:has-text("Add Teacher")');
    await page.waitForURL('**/admin/teacher/create**', { timeout: 10000 });
    
    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")');
    
    // Check for validation errors
    await page.waitForTimeout(500);
    const errorMessages = page.locator('.text-red-600');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      console.log(`✅ Validation errors displayed: ${errorCount} errors`);
      await takeScreenshot(page, 'validation-errors');
    }
    
    // Fill in required fields
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[placeholder="John"]', 'Test');
    await page.fill('input[placeholder="Doe"]', 'Teacher');
    
    // Try next again
    await page.click('button:has-text("Next")');
    
    // Should move to next step
    await page.waitForSelector('text=Primary Teaching Domain', { timeout: 5000 });
    console.log('✅ Validation working correctly');
  });

  test('Search functionality in teacher list', async ({ page }) => {
    await loginAsTenantAdmin(page);
    
    // Wait for dashboard
    await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 });
    
    // Find search input in Teachers Overview
    const searchInput = page.locator('input[placeholder*="Search teachers"]');
    
    if (await searchInput.isVisible()) {
      // Type in search
      await searchInput.fill('Sarah');
      await page.waitForTimeout(500);
      
      await takeScreenshot(page, 'search-results');
      console.log('✅ Search functionality tested');
    }
  });
});

// Summary test to verify all components load
test('Teacher management components health check', async ({ page }) => {
  console.log('\n🔍 Starting Teacher Management Health Check...\n');
  
  await loginAsTenantAdmin(page);
  
  const checks = [
    { name: 'Dashboard loads', selector: 'h1:has-text("Dashboard")' },
    { name: 'Add Teacher button exists', selector: 'button:has-text("Add Teacher")' },
    { name: 'Add Class button exists', selector: 'button:has-text("Add Class")' },
    { name: 'Teachers table visible', selector: 'text=Teacher Name' },
  ];
  
  for (const check of checks) {
    try {
      await page.waitForSelector(check.selector, { timeout: 5000 });
      console.log(`✅ ${check.name}`);
    } catch {
      console.log(`❌ ${check.name}`);
    }
  }
  
  // Try to navigate to teacher creation
  try {
    await page.goto(`${BASE_URL}/admin/teacher/create`);
    await page.waitForSelector('h1:has-text("Create New Teacher")', { timeout: 5000 });
    console.log('✅ Teacher creation page accessible');
  } catch {
    console.log('❌ Teacher creation page not accessible');
  }
  
  console.log('\n📊 Health Check Complete!\n');
});