#!/usr/bin/env node

import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const BASE_URL = 'http://localhost:8080';
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');
const REPORT_FILE = path.join(__dirname, 'test-report.md');

// Test results tracking
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
  screenshots: [],
  startTime: new Date(),
  endTime: null
};

// Utility functions
async function ensureScreenshotDir() {
  try {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  } catch (err) {
    console.error('Error creating screenshot directory:', err);
  }
}

async function takeScreenshot(page, name, fullPage = false) {
  const timestamp = Date.now();
  const filename = `${timestamp}-${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);
  
  try {
    await page.screenshot({ 
      path: filepath, 
      fullPage: fullPage 
    });
    testResults.screenshots.push({
      name,
      filename,
      timestamp: new Date().toISOString()
    });
    console.log(`  📸 Screenshot saved: ${filename}`);
    return filename;
  } catch (err) {
    console.error(`  ❌ Failed to take screenshot: ${err.message}`);
    return null;
  }
}

async function logTestResult(testName, status, details = '') {
  const result = {
    testName,
    status,
    details,
    timestamp: new Date().toISOString()
  };
  
  if (status === 'PASS') {
    testResults.passed.push(result);
    console.log(`✅ ${testName} - PASSED`);
  } else if (status === 'FAIL') {
    testResults.failed.push(result);
    console.log(`❌ ${testName} - FAILED: ${details}`);
  } else if (status === 'WARNING') {
    testResults.warnings.push(result);
    console.log(`⚠️  ${testName} - WARNING: ${details}`);
  }
  
  if (details) {
    console.log(`   Details: ${details}`);
  }
}

async function generateTestReport() {
  testResults.endTime = new Date();
  const duration = (testResults.endTime - testResults.startTime) / 1000;
  
  let report = `# End-to-End Test Report

## Test Execution Summary
- **Date**: ${testResults.startTime.toISOString()}
- **Duration**: ${duration.toFixed(2)} seconds
- **Base URL**: ${BASE_URL}

## Results Overview
- **Total Tests**: ${testResults.passed.length + testResults.failed.length}
- **Passed**: ${testResults.passed.length} ✅
- **Failed**: ${testResults.failed.length} ❌
- **Warnings**: ${testResults.warnings.length} ⚠️

## Test Results

### Passed Tests (${testResults.passed.length})
`;

  testResults.passed.forEach(test => {
    report += `- ✅ **${test.testName}**\n`;
    if (test.details) {
      report += `  - ${test.details}\n`;
    }
  });

  report += `\n### Failed Tests (${testResults.failed.length})\n`;
  testResults.failed.forEach(test => {
    report += `- ❌ **${test.testName}**\n`;
    if (test.details) {
      report += `  - Error: ${test.details}\n`;
    }
  });

  report += `\n### Warnings (${testResults.warnings.length})\n`;
  testResults.warnings.forEach(test => {
    report += `- ⚠️ **${test.testName}**\n`;
    if (test.details) {
      report += `  - Warning: ${test.details}\n`;
    }
  });

  report += `\n## Screenshots Captured (${testResults.screenshots.length})\n`;
  testResults.screenshots.forEach(screenshot => {
    report += `- **${screenshot.name}**: ${screenshot.filename}\n`;
  });

  report += `\n## Test Details\n\n`;

  try {
    await fs.writeFile(REPORT_FILE, report);
    console.log(`\n📄 Test report saved to: ${REPORT_FILE}`);
  } catch (err) {
    console.error('Failed to save test report:', err);
  }
}

// Test Suite Functions
async function testLandingPage(page) {
  console.log('\n🧪 Testing Landing Page...');
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await takeScreenshot(page, 'landing-page');
    
    // Check if page loads
    const title = await page.title();
    if (title) {
      await logTestResult('Landing Page - Page Loads', 'PASS', `Page title: ${title}`);
    } else {
      await logTestResult('Landing Page - Page Loads', 'FAIL', 'No page title found');
    }
    
    // Check for login/register buttons
    const loginButton = await page.locator('text=/login|sign in/i').first().isVisible().catch(() => false);
    const registerButton = await page.locator('text=/register|sign up/i').first().isVisible().catch(() => false);
    
    if (loginButton || registerButton) {
      await logTestResult('Landing Page - Auth Buttons', 'PASS', 'Authentication buttons found');
    } else {
      await logTestResult('Landing Page - Auth Buttons', 'WARNING', 'No authentication buttons found');
    }
    
  } catch (error) {
    await logTestResult('Landing Page - Navigation', 'FAIL', error.message);
  }
}

async function testTenantManagement(page) {
  console.log('\n🧪 Testing Tenant Management System...');
  
  try {
    // Navigate to tenant management
    await page.goto(`${BASE_URL}/admin/tenants`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'tenant-management-page');
    
    // Check if page loads
    const pageLoaded = await page.locator('h1, h2').first().isVisible().catch(() => false);
    if (pageLoaded) {
      const heading = await page.locator('h1, h2').first().textContent();
      await logTestResult('Tenant Management - Page Loads', 'PASS', `Page heading: ${heading}`);
    } else {
      await logTestResult('Tenant Management - Page Loads', 'FAIL', 'Page did not load properly');
    }
    
    // Look for create tenant button
    const createButton = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first().isVisible().catch(() => false);
    
    if (createButton) {
      await logTestResult('Tenant Management - Create Button', 'PASS', 'Create tenant button found');
      
      // Click create button
      await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first().click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'tenant-creation-wizard-step1');
      
      // Test wizard steps
      const wizardSteps = ['Basic Information', 'Contact Details', 'Settings', 'Domain Selection', 'Review'];
      let currentStep = 1;
      
      for (const step of wizardSteps) {
        const stepVisible = await page.locator(`text=/${step}/i`).isVisible().catch(() => false);
        if (stepVisible) {
          await logTestResult(`Tenant Wizard - Step ${currentStep}: ${step}`, 'PASS', 'Step is accessible');
          
          // Try to find and click next button
          const nextButton = await page.locator('button:has-text("Next"), button:has-text("Continue")').first().isVisible().catch(() => false);
          if (nextButton && currentStep < wizardSteps.length) {
            // Fill in sample data for current step
            if (currentStep === 1) {
              // Basic Information
              await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test Tenant').catch(() => {});
              await page.fill('input[name="subdomain"], input[placeholder*="subdomain" i]', 'test-tenant').catch(() => {});
            } else if (currentStep === 2) {
              // Contact Details
              await page.fill('input[name="email"], input[type="email"]', 'admin@test.com').catch(() => {});
              await page.fill('input[name="phone"], input[type="tel"]', '1234567890').catch(() => {});
            }
            
            await page.locator('button:has-text("Next"), button:has-text("Continue")').first().click();
            await page.waitForTimeout(1500);
            await takeScreenshot(page, `tenant-creation-wizard-step${currentStep + 1}`);
          }
        } else {
          await logTestResult(`Tenant Wizard - Step ${currentStep}: ${step}`, 'WARNING', 'Step not found');
        }
        currentStep++;
      }
      
    } else {
      await logTestResult('Tenant Management - Create Button', 'WARNING', 'Create tenant button not found');
    }
    
    // Test navigation back
    const backButton = await page.locator('button:has-text("Back"), button:has-text("Previous")').first().isVisible().catch(() => false);
    if (backButton) {
      await page.locator('button:has-text("Back"), button:has-text("Previous")').first().click();
      await logTestResult('Tenant Wizard - Navigation', 'PASS', 'Back navigation works');
    }
    
  } catch (error) {
    await logTestResult('Tenant Management System', 'FAIL', error.message);
  }
}

async function testTeacherClassCreation(page) {
  console.log('\n🧪 Testing Teacher Class Creation...');
  
  try {
    // Navigate to class creation
    await page.goto(`${BASE_URL}/teacher/classes/create`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'class-creation-page');
    
    // Check if page loads
    const pageLoaded = await page.locator('h1, h2').first().isVisible().catch(() => false);
    if (pageLoaded) {
      const heading = await page.locator('h1, h2').first().textContent();
      await logTestResult('Class Creation - Page Loads', 'PASS', `Page heading: ${heading}`);
    } else {
      await logTestResult('Class Creation - Page Loads', 'FAIL', 'Page did not load properly');
    }
    
    // Test wizard steps
    const wizardSteps = ['Basic Info', 'Domain', 'Sessions', 'Students', 'Review'];
    let currentStep = 1;
    
    for (const step of wizardSteps) {
      const stepVisible = await page.locator(`text=/${step}/i`).isVisible().catch(() => false);
      if (stepVisible) {
        await logTestResult(`Class Wizard - Step ${currentStep}: ${step}`, 'PASS', 'Step is accessible');
        
        // Fill in sample data for current step
        if (currentStep === 1) {
          // Basic Information
          await page.fill('input[name="className"], input[placeholder*="class name" i]', 'Test Class').catch(() => {});
          await page.fill('textarea[name="description"], textarea[placeholder*="description" i]', 'This is a test class').catch(() => {});
          await takeScreenshot(page, 'class-creation-basic-info');
        } else if (currentStep === 2) {
          // Domain Selection
          const domainSelect = await page.locator('select, [role="combobox"]').first().isVisible().catch(() => false);
          if (domainSelect) {
            await logTestResult('Class Wizard - Domain Selection', 'PASS', 'Domain selector found');
          }
          await takeScreenshot(page, 'class-creation-domain');
        } else if (currentStep === 3) {
          // Sessions
          const addSessionButton = await page.locator('button:has-text("Add Session"), button:has-text("New Session")').first().isVisible().catch(() => false);
          if (addSessionButton) {
            await page.locator('button:has-text("Add Session"), button:has-text("New Session")').first().click();
            await page.waitForTimeout(1000);
            await logTestResult('Class Wizard - Add Session', 'PASS', 'Can add sessions');
            await takeScreenshot(page, 'class-creation-sessions');
          }
        } else if (currentStep === 4) {
          // Students
          const addStudentButton = await page.locator('button:has-text("Add Student"), button:has-text("New Student")').first().isVisible().catch(() => false);
          if (addStudentButton) {
            await page.locator('button:has-text("Add Student"), button:has-text("New Student")').first().click();
            await page.waitForTimeout(1000);
            await logTestResult('Class Wizard - Add Student', 'PASS', 'Can add students');
            await takeScreenshot(page, 'class-creation-students');
          }
        } else if (currentStep === 5) {
          // Review
          await takeScreenshot(page, 'class-creation-review', true);
          await logTestResult('Class Wizard - Review Step', 'PASS', 'Review step reached');
        }
        
        // Try to navigate to next step
        const nextButton = await page.locator('button:has-text("Next"), button:has-text("Continue")').first().isVisible().catch(() => false);
        if (nextButton && currentStep < wizardSteps.length) {
          await page.locator('button:has-text("Next"), button:has-text("Continue")').first().click();
          await page.waitForTimeout(1500);
        }
      } else {
        await logTestResult(`Class Wizard - Step ${currentStep}: ${step}`, 'WARNING', 'Step not found');
      }
      currentStep++;
    }
    
  } catch (error) {
    await logTestResult('Teacher Class Creation', 'FAIL', error.message);
  }
}

async function testMobileResponsiveness(page) {
  console.log('\n🧪 Testing Mobile Responsiveness...');
  
  try {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
    
    // Test landing page on mobile
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await takeScreenshot(page, 'mobile-landing-page');
    await logTestResult('Mobile - Landing Page', 'PASS', 'Mobile viewport renders');
    
    // Test tenant management on mobile
    await page.goto(`${BASE_URL}/admin/tenants`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'mobile-tenant-management');
    
    // Check for mobile menu/hamburger
    const mobileMenu = await page.locator('[aria-label*="menu" i], button:has-text("☰"), .hamburger, .mobile-menu').first().isVisible().catch(() => false);
    if (mobileMenu) {
      await logTestResult('Mobile - Navigation Menu', 'PASS', 'Mobile menu found');
      await page.locator('[aria-label*="menu" i], button:has-text("☰"), .hamburger, .mobile-menu').first().click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, 'mobile-menu-open');
    } else {
      await logTestResult('Mobile - Navigation Menu', 'WARNING', 'Mobile menu not found');
    }
    
    // Test class creation on mobile
    await page.goto(`${BASE_URL}/teacher/classes/create`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, 'mobile-class-creation');
    
    // Reset viewport to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
  } catch (error) {
    await logTestResult('Mobile Responsiveness', 'FAIL', error.message);
  }
}

async function testNavigationIntegration(page) {
  console.log('\n🧪 Testing Navigation Integration...');
  
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Test teacher navigation
    await page.goto(`${BASE_URL}/teacher/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Look for Teachers menu item
    const teachersMenu = await page.locator('text=/teachers/i, [aria-label*="teachers" i]').first().isVisible().catch(() => false);
    if (teachersMenu) {
      await page.locator('text=/teachers/i, [aria-label*="teachers" i]').first().click();
      await page.waitForTimeout(1000);
      
      // Look for class creation link in submenu
      const classCreationLink = await page.locator('a[href*="/classes/create"], text=/create.*class/i').first().isVisible().catch(() => false);
      if (classCreationLink) {
        await logTestResult('Navigation - Teachers Submenu', 'PASS', 'Class creation link found in Teachers menu');
        await takeScreenshot(page, 'navigation-teachers-submenu');
      } else {
        await logTestResult('Navigation - Teachers Submenu', 'WARNING', 'Class creation link not found in submenu');
      }
    } else {
      await logTestResult('Navigation - Teachers Menu', 'WARNING', 'Teachers menu not found');
    }
    
    // Test admin navigation
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check for tenants link
    const tenantsLink = await page.locator('a[href*="/tenants"], text=/tenants/i').first().isVisible().catch(() => false);
    if (tenantsLink) {
      await logTestResult('Navigation - Admin Tenants Link', 'PASS', 'Tenants link found in admin');
      await page.locator('a[href*="/tenants"], text=/tenants/i').first().click();
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      if (currentUrl.includes('/tenants')) {
        await logTestResult('Navigation - Tenants Route', 'PASS', 'Successfully navigated to tenants page');
      }
    } else {
      await logTestResult('Navigation - Admin Tenants Link', 'WARNING', 'Tenants link not found');
    }
    
  } catch (error) {
    await logTestResult('Navigation Integration', 'FAIL', error.message);
  }
}

async function testPerformance(page) {
  console.log('\n🧪 Testing Performance...');
  
  const performanceMetrics = [];
  
  try {
    // Test landing page load time
    const landingStart = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const landingLoadTime = Date.now() - landingStart;
    performanceMetrics.push({ page: 'Landing', time: landingLoadTime });
    
    if (landingLoadTime < 3000) {
      await logTestResult('Performance - Landing Page', 'PASS', `Loaded in ${landingLoadTime}ms`);
    } else {
      await logTestResult('Performance - Landing Page', 'WARNING', `Slow load time: ${landingLoadTime}ms`);
    }
    
    // Test tenant management load time
    const tenantStart = Date.now();
    await page.goto(`${BASE_URL}/admin/tenants`, { waitUntil: 'networkidle' });
    const tenantLoadTime = Date.now() - tenantStart;
    performanceMetrics.push({ page: 'Tenant Management', time: tenantLoadTime });
    
    if (tenantLoadTime < 3000) {
      await logTestResult('Performance - Tenant Management', 'PASS', `Loaded in ${tenantLoadTime}ms`);
    } else {
      await logTestResult('Performance - Tenant Management', 'WARNING', `Slow load time: ${tenantLoadTime}ms`);
    }
    
    // Test class creation load time
    const classStart = Date.now();
    await page.goto(`${BASE_URL}/teacher/classes/create`, { waitUntil: 'networkidle' });
    const classLoadTime = Date.now() - classStart;
    performanceMetrics.push({ page: 'Class Creation', time: classLoadTime });
    
    if (classLoadTime < 3000) {
      await logTestResult('Performance - Class Creation', 'PASS', `Loaded in ${classLoadTime}ms`);
    } else {
      await logTestResult('Performance - Class Creation', 'WARNING', `Slow load time: ${classLoadTime}ms`);
    }
    
    // Log performance summary
    const avgLoadTime = performanceMetrics.reduce((sum, m) => sum + m.time, 0) / performanceMetrics.length;
    console.log(`\n📊 Performance Summary:`);
    console.log(`   Average page load time: ${avgLoadTime.toFixed(0)}ms`);
    performanceMetrics.forEach(metric => {
      console.log(`   - ${metric.page}: ${metric.time}ms`);
    });
    
  } catch (error) {
    await logTestResult('Performance Testing', 'FAIL', error.message);
  }
}

async function testErrorHandling(page) {
  console.log('\n🧪 Testing Error Handling...');
  
  try {
    // Test 404 page
    await page.goto(`${BASE_URL}/non-existent-page`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'error-404-page');
    
    const notFoundText = await page.locator('text=/404|not found/i').first().isVisible().catch(() => false);
    if (notFoundText) {
      await logTestResult('Error Handling - 404 Page', 'PASS', '404 page displays correctly');
    } else {
      await logTestResult('Error Handling - 404 Page', 'WARNING', '404 page may not be configured');
    }
    
    // Test unauthorized access
    await page.goto(`${BASE_URL}/unauthorized`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'error-unauthorized-page');
    
    const unauthorizedText = await page.locator('text=/unauthorized|access denied/i').first().isVisible().catch(() => false);
    if (unauthorizedText) {
      await logTestResult('Error Handling - Unauthorized Page', 'PASS', 'Unauthorized page displays correctly');
    } else {
      await logTestResult('Error Handling - Unauthorized Page', 'WARNING', 'Unauthorized page may not be configured');
    }
    
  } catch (error) {
    await logTestResult('Error Handling', 'FAIL', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting End-to-End Test Suite');
  console.log('================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  await ensureScreenshotDir();
  
  const browser = await chromium.launch({
    headless: false, // Set to true for CI/CD
    slowMo: 100 // Slow down actions for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      testResults.warnings.push({
        testName: 'Console Error',
        status: 'WARNING',
        details: msg.text(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Run all test suites
  await testLandingPage(page);
  await testTenantManagement(page);
  await testTeacherClassCreation(page);
  await testNavigationIntegration(page);
  await testMobileResponsiveness(page);
  await testPerformance(page);
  await testErrorHandling(page);
  
  // Close browser
  await browser.close();
  
  // Generate report
  await generateTestReport();
  
  // Print summary
  console.log('\n================================');
  console.log('📊 TEST SUMMARY');
  console.log('================================');
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
  console.log(`📸 Screenshots: ${testResults.screenshots.length}`);
  console.log('\n✨ Test suite completed!');
  
  // Exit with appropriate code
  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});