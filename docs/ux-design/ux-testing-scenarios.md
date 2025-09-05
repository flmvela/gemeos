# UX Testing Scenarios & Validation Guide

## Class Creation Wizard - Comprehensive Testing Protocol

### Overview
This document provides detailed testing scenarios to validate the UX design implementation of the Teacher Class Creation Wizard. Each scenario includes acceptance criteria, test steps, and expected outcomes aligned with WCAG 2.1 AA standards.

---

## 1. AUTOMATED UX TESTING SUITE

### 1.1 Core User Journey Tests

```typescript
// Test: Complete wizard flow with minimal input
describe('Happy Path - Quick Class Creation', () => {
  test('Teacher creates class with minimal configuration', async ({ page }) => {
    // Navigate to wizard
    await page.goto('/teacher/classes/create');
    
    // Step 1: Domain auto-selection (single domain teacher)
    await expect(page.getByText('Class Configuration')).toBeVisible();
    
    // Step 2: Enter minimal required fields
    await page.getByLabel('Class Name').fill('Beginner Piano Monday');
    await page.getByLabel('Difficulty Level').selectOption('1');
    await page.getByLabel('Weekly').check();
    
    // Add one schedule
    await page.getByLabel('Day').selectOption('1'); // Monday
    await page.getByLabel('Start Time').fill('15:30');
    await page.getByLabel('End Time').fill('16:30');
    
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Step 3: Skip students (optional)
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Step 4: Review
    await expect(page.getByText('Beginner Piano Monday')).toBeVisible();
    await expect(page.getByText('Weekly')).toBeVisible();
    await expect(page.getByText('Monday, 3:30 PM - 4:30 PM')).toBeVisible();
    
    await page.getByRole('button', { name: 'Create Class' }).click();
    
    // Step 5: Success
    await expect(page.getByText('Class Created Successfully!')).toBeVisible();
    await expect(page.getByText(/CLS-\d{4}-\d{4}/)).toBeVisible();
  });
});
```

### 1.2 Progressive Disclosure Validation

```typescript
describe('Progressive Disclosure', () => {
  test('Shows only relevant fields based on frequency selection', async ({ page }) => {
    await page.goto('/teacher/classes/create?step=2');
    
    // Weekly selection shows single schedule
    await page.getByLabel('Weekly').check();
    await expect(page.getByText('Select recurring day and time')).toBeVisible();
    
    // Monthly selection shows date picker
    await page.getByLabel('Monthly').check();
    await expect(page.getByText('Select specific date each month')).toBeVisible();
    await expect(page.getByLabel('Day of Month')).toBeVisible();
  });
  
  test('Reveals student messaging options only when students added', async ({ page }) => {
    await page.goto('/teacher/classes/create?step=3');
    
    // No messaging options when no students
    await expect(page.getByText('Student Messaging')).not.toBeVisible();
    
    // Add a student
    await page.getByLabel('Name').fill('Test Student');
    await page.getByLabel('Email').fill('student@test.com');
    await page.getByRole('button', { name: 'Add Student' }).click();
    
    // Messaging options appear
    await expect(page.getByText('Student Messaging')).toBeVisible();
    await expect(page.getByLabel('Allow students to message each other')).toBeVisible();
  });
});
```

---

## 2. ACCESSIBILITY TESTING SCENARIOS

### 2.1 Keyboard Navigation Test

```typescript
describe('Keyboard Accessibility', () => {
  test('Complete wizard using only keyboard', async ({ page }) => {
    await page.goto('/teacher/classes/create');
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    await expect(page.getByRole('radio').first()).toBeFocused();
    
    // Select domain with Space
    await page.keyboard.press('Space');
    
    // Tab to Continue button
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
    }
    await expect(page.getByRole('button', { name: 'Continue' })).toBeFocused();
    
    // Activate with Enter
    await page.keyboard.press('Enter');
    
    // Verify focus moves to first field of next step
    await expect(page.getByLabel('Class Name')).toBeFocused();
  });
  
  test('Escape key handling', async ({ page }) => {
    await page.goto('/teacher/classes/create?step=2');
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Verify confirmation dialog
    await expect(page.getByText('You have unsaved changes')).toBeVisible();
    
    // Tab to "Save Draft" option
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Verify draft saved indicator
    await expect(page.getByText('Draft saved')).toBeVisible();
  });
});
```

### 2.2 Screen Reader Compatibility

```typescript
describe('Screen Reader Announcements', () => {
  test('Progress updates are announced', async ({ page }) => {
    await page.goto('/teacher/classes/create');
    
    // Check ARIA attributes
    const progressBar = page.getByRole('progressbar');
    await expect(progressBar).toHaveAttribute('aria-valuenow', '1');
    await expect(progressBar).toHaveAttribute('aria-valuemax', '5');
    await expect(progressBar).toHaveAttribute('aria-label', 'Step 1 of 5: Domain Selection');
    
    // Move to next step
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Verify announcement update
    await expect(progressBar).toHaveAttribute('aria-valuenow', '2');
    await expect(progressBar).toHaveAttribute('aria-label', 'Step 2 of 5: Class Configuration');
  });
  
  test('Form validation errors are announced', async ({ page }) => {
    await page.goto('/teacher/classes/create?step=2');
    
    // Submit without required fields
    await page.getByRole('button', { name: 'Continue' }).click();
    
    // Check error announcement
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
    await expect(errorAlert).toContainText('Class name is required');
    
    // Verify field marked as invalid
    const nameInput = page.getByLabel('Class Name');
    await expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    await expect(nameInput).toHaveAttribute('aria-describedby', /error/);
  });
});
```

### 2.3 Focus Management

```typescript
describe('Focus Management', () => {
  test('Focus trap within wizard', async ({ page }) => {
    await page.goto('/teacher/classes/create');
    
    // Tab through all elements
    const focusableElements = await page.locator('[tabindex]:not([tabindex="-1"]), a, button, input, select, textarea').count();
    
    // Tab to last element
    for (let i = 0; i < focusableElements; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Next tab should wrap to first element
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('data-first-focusable', 'true');
  });
  
  test('Focus restoration on modal close', async ({ page }) => {
    await page.goto('/teacher/classes/create?step=3');
    
    const addButton = page.getByRole('button', { name: 'Add Student' });
    await addButton.click();
    
    // Focus should be in modal
    await expect(page.getByLabel('Student Name')).toBeFocused();
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Focus should return to trigger
    await expect(addButton).toBeFocused();
  });
});
```

---

## 3. RESPONSIVE DESIGN TESTING

### 3.1 Mobile Viewport Tests

```typescript
describe('Mobile Responsiveness', () => {
  test('Mobile layout at 375px width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/teacher/classes/create');
    
    // Verify mobile-specific elements
    await expect(page.locator('.progress-mobile')).toBeVisible();
    await expect(page.locator('.button-group-mobile')).toBeVisible();
    
    // Verify single column layout
    const formGrid = page.locator('.form-grid');
    await expect(formGrid).toHaveCSS('grid-template-columns', '1fr');
    
    // Verify touch target sizes
    const buttons = page.getByRole('button');
    for (const button of await buttons.all()) {
      const box = await button.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
  
  test('Swipe navigation on mobile', async ({ page, context }) => {
    await context.grantPermissions(['pointer']);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/teacher/classes/create?step=2');
    
    // Swipe left to go forward
    await page.locator('.wizard-content').dragTo(
      page.locator('.wizard-content'),
      { sourcePosition: { x: 300, y: 200 }, targetPosition: { x: 50, y: 200 } }
    );
    
    await expect(page.getByText('Add Students')).toBeVisible();
    
    // Swipe right to go back
    await page.locator('.wizard-content').dragTo(
      page.locator('.wizard-content'),
      { sourcePosition: { x: 50, y: 200 }, targetPosition: { x: 300, y: 200 } }
    );
    
    await expect(page.getByText('Class Configuration')).toBeVisible();
  });
});
```

### 3.2 Tablet Viewport Tests

```typescript
describe('Tablet Responsiveness', () => {
  test('Tablet layout at 768px width', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/teacher/classes/create');
    
    // Verify tablet-specific layout
    await expect(page.locator('.wizard-container-tablet')).toBeVisible();
    
    // Verify mixed column layout
    const formGrid = page.locator('.form-grid-tablet');
    await expect(formGrid).toHaveCSS('grid-template-columns', '1fr 1fr');
    
    // Some fields should span full width
    const fullWidthFields = page.locator('.form-group-full-tablet');
    await expect(fullWidthFields.first()).toHaveCSS('grid-column', '1 / -1');
  });
});
```

### 3.3 Desktop Viewport Tests

```typescript
describe('Desktop Responsiveness', () => {
  test('Desktop layout at 1280px width', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/teacher/classes/create');
    
    // Verify desktop layout with context panel
    await expect(page.locator('.wizard-layout-desktop')).toBeVisible();
    await expect(page.locator('.context-panel-desktop')).toBeVisible();
    
    // Verify optimal column layout
    const formGrid = page.locator('.form-grid-desktop');
    await expect(formGrid).toHaveCSS('display', 'grid');
    
    // Navigation buttons should be right-aligned
    const buttonGroup = page.locator('.button-group-desktop');
    await expect(buttonGroup).toHaveCSS('justify-content', 'flex-end');
  });
});
```

---

## 4. ERROR HANDLING & VALIDATION TESTING

### 4.1 Field Validation Tests

```typescript
describe('Form Validation', () => {
  test('Real-time validation feedback', async ({ page }) => {
    await page.goto('/teacher/classes/create?step=2');
    
    const nameInput = page.getByLabel('Class Name');
    
    // Type invalid characters
    await nameInput.fill('Class@#$%');
    await nameInput.blur();
    
    // Check error appears
    await expect(page.getByText('Class name contains invalid characters')).toBeVisible();
    
    // Correct the input
    await nameInput.clear();
    await nameInput.fill('Valid Class Name');
    await nameInput.blur();
    
    // Error should disappear
    await expect(page.getByText('Class name contains invalid characters')).not.toBeVisible();
    
    // Success indicator should appear
    await expect(page.locator('.field-valid-indicator')).toBeVisible();
  });
  
  test('Email validation and duplicate detection', async ({ page }) => {
    await page.goto('/teacher/classes/create?step=3');
    
    // Add first student
    await page.getByLabel('Name').fill('John Doe');
    await page.getByLabel('Email').fill('john@example.com');
    await page.getByRole('button', { name: 'Add Student' }).click();
    
    // Try to add duplicate email
    await page.getByLabel('Name').fill('Jane Doe');
    await page.getByLabel('Email').fill('john@example.com');
    
    // Check duplicate warning appears immediately
    await expect(page.getByText('This email is already in the student list')).toBeVisible();
    
    // Add button should be disabled
    await expect(page.getByRole('button', { name: 'Add Student' })).toBeDisabled();
  });
});
```

### 4.2 Network Error Handling

```typescript
describe('Network Resilience', () => {
  test('Handles network failure gracefully', async ({ page, context }) => {
    await page.goto('/teacher/classes/create?step=4');
    
    // Simulate network failure
    await context.setOffline(true);
    
    // Try to submit
    await page.getByRole('button', { name: 'Create Class' }).click();
    
    // Check error message
    await expect(page.getByText('Unable to connect')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Draft' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
    
    // Save draft
    await page.getByRole('button', { name: 'Save Draft' }).click();
    await expect(page.getByText('Draft saved locally')).toBeVisible();
    
    // Restore network
    await context.setOffline(false);
    
    // Retry submission
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.getByText('Class Created Successfully!')).toBeVisible();
  });
});
```

---

## 5. PERFORMANCE TESTING

### 5.1 Load Time Metrics

```typescript
describe('Performance Metrics', () => {
  test('Initial load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/teacher/classes/create');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // First Contentful Paint should be under 1.5s
    expect(loadTime).toBeLessThan(1500);
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return {
        FCP: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        LCP: performance.getEntriesByType('largest-contentful-paint').pop()?.startTime,
        CLS: performance.getEntriesByType('layout-shift').reduce((sum, entry) => sum + entry.value, 0)
      };
    });
    
    expect(metrics.FCP).toBeLessThan(1500);
    expect(metrics.LCP).toBeLessThan(2500);
    expect(metrics.CLS).toBeLessThan(0.1);
  });
  
  test('Step transition performance', async ({ page }) => {
    await page.goto('/teacher/classes/create?step=1');
    
    const startTime = Date.now();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForSelector('[data-step="2"]');
    const transitionTime = Date.now() - startTime;
    
    // Step transitions should be under 300ms
    expect(transitionTime).toBeLessThan(300);
  });
});
```

### 5.2 Memory Management

```typescript
describe('Memory Efficiency', () => {
  test('No memory leaks during extended use', async ({ page }) => {
    await page.goto('/teacher/classes/create');
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize;
    });
    
    // Navigate through wizard multiple times
    for (let i = 0; i < 10; i++) {
      // Go through all steps
      for (let step = 1; step <= 4; step++) {
        await page.goto(`/teacher/classes/create?step=${step}`);
        await page.waitForTimeout(100);
      }
    }
    
    // Force garbage collection
    await page.evaluate(() => {
      if ((window as any).gc) (window as any).gc();
    });
    
    // Check final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize;
    });
    
    // Memory increase should be minimal (less than 10MB)
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});
```

---

## 6. USER EXPERIENCE VALIDATION

### 6.1 Cognitive Load Testing

```typescript
describe('Cognitive Load Management', () => {
  test('Progressive disclosure reduces initial complexity', async ({ page }) => {
    await page.goto('/teacher/classes/create?step=2');
    
    // Count initially visible fields
    const visibleFields = await page.locator('input:visible, select:visible').count();
    
    // Should show only essential fields initially
    expect(visibleFields).toBeLessThanOrEqual(5);
    
    // Select frequency to reveal more options
    await page.getByLabel('Weekly').check();
    
    // More fields should appear
    const expandedFields = await page.locator('input:visible, select:visible').count();
    expect(expandedFields).toBeGreaterThan(visibleFields);
  });
  
  test('Clear visual hierarchy', async ({ page }) => {
    await page.goto('/teacher/classes/create');
    
    // Primary actions should be visually prominent
    const continueButton = page.getByRole('button', { name: 'Continue' });
    const backgroundColor = await continueButton.evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );
    
    // Should use primary color
    expect(backgroundColor).toMatch(/rgb\(59, 130, 246/); // Primary blue
    
    // Secondary actions should be less prominent
    const cancelButton = page.getByRole('button', { name: 'Cancel' });
    const cancelBackground = await cancelButton.evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );
    
    // Should use secondary/ghost styling
    expect(cancelBackground).not.toEqual(backgroundColor);
  });
});
```

### 6.2 Error Recovery Testing

```typescript
describe('Error Recovery', () => {
  test('Draft recovery after session timeout', async ({ page, context }) => {
    await page.goto('/teacher/classes/create?step=2');
    
    // Fill in data
    await page.getByLabel('Class Name').fill('Test Class');
    await page.getByLabel('Weekly').check();
    
    // Simulate session timeout
    await page.evaluate(() => {
      localStorage.setItem('class-wizard-draft', JSON.stringify({
        timestamp: new Date().toISOString(),
        data: {
          classConfig: { name: 'Test Class', frequency: 'weekly' }
        }
      }));
    });
    
    // Reload page
    await page.reload();
    
    // Should show recovery prompt
    await expect(page.getByText('Restore your previous work?')).toBeVisible();
    
    // Restore draft
    await page.getByRole('button', { name: 'Restore' }).click();
    
    // Data should be restored
    await expect(page.getByLabel('Class Name')).toHaveValue('Test Class');
    await expect(page.getByLabel('Weekly')).toBeChecked();
  });
});
```

---

## 7. MANUAL TESTING CHECKLIST

### Visual Design Review
- [ ] Typography hierarchy is clear and consistent
- [ ] Color contrast meets WCAG AA standards (4.5:1 for normal text)
- [ ] Interactive elements have visible focus states
- [ ] Loading states provide clear feedback
- [ ] Error states are visually distinct but not alarming
- [ ] Success states provide positive reinforcement
- [ ] Icons enhance understanding without being required

### Interaction Patterns
- [ ] All interactions feel responsive (<100ms feedback)
- [ ] Animations are smooth and purposeful
- [ ] Transitions between steps feel natural
- [ ] Touch targets are appropriately sized (44x44px minimum)
- [ ] Hover states provide additional context
- [ ] Disabled states are clearly communicated
- [ ] Progress is always visible and accurate

### Content & Messaging
- [ ] Instructions are clear and concise
- [ ] Error messages are helpful and actionable
- [ ] Success messages confirm what happened
- [ ] Help text provides useful context
- [ ] Labels accurately describe fields
- [ ] Placeholder text provides format examples
- [ ] Required field indicators are consistent

### Cross-Browser Testing
- [ ] Chrome (latest): Full functionality
- [ ] Firefox (latest): Full functionality  
- [ ] Safari (latest): Full functionality
- [ ] Edge (latest): Full functionality
- [ ] Mobile Safari: Touch optimized
- [ ] Chrome Mobile: Touch optimized

### Accessibility Audit
- [ ] Keyboard navigation works completely
- [ ] Screen reader announces all content
- [ ] Focus order is logical
- [ ] Color is not the only indicator
- [ ] Motion can be reduced
- [ ] Text can be zoomed to 200%
- [ ] Page works without JavaScript

---

## 8. TEST EXECUTION COMMANDS

```bash
# Run all UX tests
npm run test:ux

# Run specific test suites
npm run test:ux:accessibility
npm run test:ux:responsive
npm run test:ux:performance
npm run test:ux:validation

# Run tests in different viewports
npm run test:ux:mobile
npm run test:ux:tablet
npm run test:ux:desktop

# Generate visual regression report
npm run test:visual

# Run lighthouse audit
npm run audit:lighthouse

# Check WCAG compliance
npm run audit:a11y
```

---

## TESTING PRIORITIES

### P0 - Critical (Must Pass)
1. Complete wizard flow works
2. Data persists correctly
3. Validation prevents invalid data
4. Success creates class in database
5. Mobile layout is usable

### P1 - Important (Should Pass)
1. Keyboard navigation complete
2. Screen reader compatible
3. Error recovery works
4. Performance metrics met
5. Responsive at all breakpoints

### P2 - Nice to Have (Could Pass)
1. Animations are smooth
2. Offline mode works
3. Advanced keyboard shortcuts
4. Context-sensitive help
5. Bulk operations optimized