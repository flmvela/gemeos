import { test, expect } from '@playwright/test';

test('Teacher Dashboard Classes Debug Check', async ({ page }) => {
  // Capture console logs
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    console.log(`Browser console [${msg.type()}]: ${text}`);
  });

  // Navigate to teacher dashboard
  await page.goto('http://localhost:8080/teacher/dashboard');
  
  // Wait for login form to be visible
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  // Fill in login credentials
  await page.fill('input[type="email"]', 'flm.velardi+teacher13@gmail.com');
  await page.fill('input[type="password"]', 'Digitaltwin1!');
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for dashboard to load - look for teacher dashboard specific elements
  await page.waitForSelector('text=Teacher Dashboard', { timeout: 15000 });
  
  // Wait a bit more for classes to load
  await page.waitForTimeout(3000);
  
  // Wait for any async operations to complete - classes should be loading
  await page.waitForTimeout(5000);
  
  // Take screenshot first
  await page.screenshot({ 
    path: '.playwright-mcp/teacher-dashboard-classes-debug.png', 
    fullPage: true 
  });
  
  // Check if classes are loaded or if "No classes yet" is shown
  const hasNoClasses = await page.locator('text=No classes yet').count();
  const myClassesText = await page.locator('text=My Classes').count();
  const classesText = await page.locator('text=Classes').count();
  const classCards = await page.locator('[data-testid="class-card"], .class-item, [class*="class"]').count();
  
  console.log(`"My Classes" text found: ${myClassesText}`);
  console.log(`"Classes" text found: ${classesText}`);  
  console.log(`Class cards found: ${classCards}`);
  console.log(`"No classes yet" shown: ${hasNoClasses > 0}`);
  
  // Filter and display relevant console logs
  const relevantLogs = consoleLogs.filter(log => 
    log.includes('fetchClasses') ||
    log.includes('Fetching classes for teacher') ||
    log.includes('Classes fetched') ||
    log.includes('Classes set') ||
    log.includes('user_id') ||
    log.includes('session') ||
    log.includes('ERROR') ||
    log.includes('error')
  );
  
  console.log('\n=== RELEVANT CONSOLE LOGS ===');
  relevantLogs.forEach(log => console.log(log));
  console.log('=== END RELEVANT LOGS ===\n');
  
  console.log('\n=== ALL CONSOLE LOGS ===');
  consoleLogs.forEach(log => console.log(log));
  console.log('=== END ALL LOGS ===\n');
  
  // Basic assertions
  expect(await page.locator('text=Teacher Dashboard').count()).toBeGreaterThan(0);
});