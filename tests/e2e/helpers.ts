import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Helper functions for E2E tests
 */

// Use consistent test parent account
const TEST_PARENT_EMAIL = 'test-parent-e2e@example.com';
const TEST_PARENT_PASSWORD = 'TestPassword123!';

export const TEST_USER = {
  parent: {
    email: TEST_PARENT_EMAIL,
    password: TEST_PARENT_PASSWORD,
    fullName: 'Test Parent E2E',
  },
  physician: {
    email: 'physician@gmail.com',
    password: 'Welcome@12',
    fullName: 'Dr. Test Physician',
  },
};

export const TEST_CHILD = {
  name: 'Test Child',
  dateOfBirth: '2023-06-15', // ~18 months old
  focusArea: 'Typically Developing',
};

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page, timeout: number = 30000) {
  await page.waitForLoadState('domcontentloaded', { timeout });
  // Use 'load' instead of 'networkidle' for faster tests, but allow longer timeout
  await page.waitForLoadState('load', { timeout });
  // Give extra time for dynamic content
  await page.waitForTimeout(1000);
}

/**
 * Fill assessment form
 * Note: Uses Radix UI Select, not native HTML select
 */
export async function fillAssessmentForm(page: Page, child = TEST_CHILD) {
  // Wait for form to be ready
  await page.waitForSelector('input, button, [role="combobox"]', { timeout: 15000 });
  
  // Fill child name
  const nameInput = page.locator('input[name="childName"], input[placeholder*="name" i], input[type="text"]').first();
  await nameInput.waitFor({ state: 'visible', timeout: 10000 });
  await nameInput.fill(child.name);
  
  // Fill date of birth
  const dateInput = page.locator('input[type="date"], input[name="dateOfBirth"]').first();
  await dateInput.waitFor({ state: 'visible', timeout: 10000 });
  await dateInput.fill(child.dateOfBirth);
  
  // Handle Radix UI Select (not native select)
  // Click the SelectTrigger to open the dropdown
  const selectTrigger = page.locator('button[role="combobox"], [role="combobox"]').first();
  if (await selectTrigger.isVisible({ timeout: 10000 }).catch(() => false)) {
    await selectTrigger.click();
    await page.waitForTimeout(500); // Wait for dropdown to open
    
    // Wait for SelectContent to appear
    await page.waitForSelector('[role="option"], [data-radix-select-item]', { timeout: 5000 });
    
    // Click the option that matches the focus area (case-insensitive)
    const optionText = new RegExp(child.focusArea.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const option = page.locator(`[role="option"]:has-text("${child.focusArea}"), [data-radix-select-item]:has-text("${child.focusArea}")`).first();
    
    if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
      await option.click();
    } else {
      // Fallback: try to find by text content
      const allOptions = page.locator('[role="option"]');
      const count = await allOptions.count();
      for (let i = 0; i < count; i++) {
        const text = await allOptions.nth(i).textContent();
        if (text && new RegExp(child.focusArea, 'i').test(text)) {
          await allOptions.nth(i).click();
          break;
        }
      }
    }
    
    await page.waitForTimeout(500); // Wait for selection to register
  } else {
    // Fallback: try native select if it exists
    const nativeSelect = page.locator('select[name="focusArea"], select').first();
    if (await nativeSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nativeSelect.selectOption({ label: child.focusArea });
    }
  }
  
  // Wait a bit for form to process
  await page.waitForTimeout(500);
}

/**
 * Answer assessment questions
 */
export async function answerAssessmentQuestions(page: Page, count: number = 10) {
  for (let i = 0; i < count; i++) {
    // Wait for question to load - be more patient
    await page.waitForSelector('input[type="radio"], button:has-text("Next")', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1000); // Extra wait for content
    
    // Select first available response option
    const responseOption = page.locator('input[type="radio"]').first();
    if (await responseOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await responseOption.check({ timeout: 5000 });
      await page.waitForTimeout(300); // Wait for selection
    }
    
    // Click Next button (or Complete Assessment on last question)
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Complete Assessment"), button[type="submit"]').first();
    if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nextButton.click({ timeout: 5000 });
      await page.waitForTimeout(1000); // Wait for transition - longer for API calls
    } else {
      // If no next button, we might be done
      break;
    }
  }
}

/**
 * Create parent account via signup
 */
export async function createParentAccount(page: Page, user = TEST_USER.parent) {
  await page.fill('input[type="email"], input[name="email"]', user.email);
  await page.fill('input[type="password"]:nth-of-type(1)', user.password);
  await page.fill('input[type="password"]:nth-of-type(2), input[name*="confirm" i]', user.password);
  await page.fill('input[name="fullName"], input[placeholder*="name" i]', user.fullName);
  
  const submitButton = page.locator('button:has-text("Create Account"), button:has-text("Submit")');
  await submitButton.click();
  
  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard\/parent/, { timeout: 10000 });
}

/**
 * Create parent account if it doesn't exist
 */
export async function ensureParentAccount(page: Page, user = TEST_USER.parent) {
  // Try to login first
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForPageLoad(page, 30000);
  
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button:has-text("Login"), button[type="submit"]');
  
  // Wait longer to see if login succeeds
  await page.waitForTimeout(5000);
  
  // If still on login page, account doesn't exist - create it
  if (page.url().includes('/login')) {
    // Try to sign up instead
    const signUpLink = page.locator('text=/sign up|create account/i').first();
    if (await signUpLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signUpLink.click();
      await page.waitForTimeout(2000);
    }
    
    // Fill signup form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[type="password"]:nth-of-type(1), input[name="password"]', user.password);
    await page.fill('input[type="password"]:nth-of-type(2), input[name*="confirm" i]', user.password);
    await page.fill('input[name="fullName"], input[placeholder*="name" i]', user.fullName);
    
    await page.click('button:has-text("Sign Up"), button:has-text("Create Account"), button[type="submit"]');
    // Wait longer for account creation
    await page.waitForTimeout(5000);
    await page.waitForURL(/\/dashboard\/parent/, { timeout: 30000 }).catch(() => {});
  }
}

/**
 * Login as parent (creates account if needed)
 */
export async function loginAsParent(page: Page, user = TEST_USER.parent) {
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForPageLoad(page, 30000);
  
  // Wait for form
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  
  // Try login first
  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  
  await emailInput.fill(user.email);
  await passwordInput.fill(user.password);
  
  const loginButton = page.locator('button:has-text("Login"), button[type="submit"]').first();
  await loginButton.click();
  
  // Wait for redirect or error - longer timeout for auth
  await page.waitForTimeout(3000);
  
  // If still on login, try to create account
  if (page.url().includes('/login')) {
    // Check for error message
    const errorMsg = await page.locator('text=/invalid|incorrect|not found/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (errorMsg) {
      // Account doesn't exist, create it via signup
      await ensureParentAccount(page, user);
    } else {
      // Wait a bit more - might be slow redirect
      await page.waitForTimeout(2000);
    }
  }
  
  // Wait for redirect to dashboard - longer timeout
  await page.waitForURL(/\/dashboard\/parent/, { timeout: 30000 }).catch(() => {
    // If redirect fails, check if we're logged in
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      console.log('Login/signup completed, but redirect may have failed');
    }
  });
  
  // Final wait for dashboard to load
  await page.waitForTimeout(2000);
}

/**
 * Login as physician
 */
export async function loginAsPhysician(page: Page, user = TEST_USER.physician) {
  // Correct route: /physician/login (not /dashboard/physician/login)
  await page.goto('/physician/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForPageLoad(page, 30000);
  
  // Wait for form - the form uses id="email" and id="password"
  await page.waitForSelector('#email, input[type="email"], input[name="email"]', { timeout: 20000 });
  await page.waitForTimeout(1000); // Extra wait for form to render
  
  const emailInput = page.locator('#email, input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('#password, input[type="password"], input[name="password"]').first();
  
  // Wait for inputs to be visible
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  
  await emailInput.fill(user.email);
  await passwordInput.fill(user.password);
  
  const loginButton = page.locator('button:has-text("Access Review Dashboard"), button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]').first();
  await expect(loginButton).toBeVisible({ timeout: 10000 });
  await loginButton.click();
  
  // Wait for redirect - longer timeout for auth
  await page.waitForURL(/\/dashboard\/physician/, { timeout: 30000 });
  await page.waitForTimeout(2000); // Extra wait for dashboard to load
}

/**
 * Wait for element with retry
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options: { timeout?: number; state?: 'visible' | 'attached' | 'detached' | 'hidden' } = {}
) {
  const { timeout = 20000, state = 'visible' } = options; // Increased default timeout
  await page.waitForSelector(selector, { state, timeout });
}

/**
 * Wait for API response
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  options: { timeout?: number } = {}
) {
  const { timeout = 60000 } = options; // Increased default to 60s for slow APIs
  await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = `tests/e2e/screenshots/${name}-${timestamp}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

/**
 * Validate PDF download
 */
export async function validatePDFDownload(
  page: Page,
  downloadButtonLocator: any,
  options: { minSize?: number; maxSize?: number } = {}
) {
  const { minSize = 10000, maxSize = 10 * 1024 * 1024 } = options; // Default: 10KB - 10MB
  
  const downloadsDir = path.join(__dirname, '../downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }
  
  // Longer timeout for PDF generation/download
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }), // 60s for PDF generation
    downloadButtonLocator.click(),
  ]);
  
  const filename = download.suggestedFilename();
  expect(filename).toMatch(/\.pdf$/i);
  
  const filePath = path.join(downloadsDir, filename);
  await download.saveAs(filePath);
  
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;
  
  expect(fileSize).toBeGreaterThan(minSize);
  expect(fileSize).toBeLessThan(maxSize);
  
  return { filePath, fileSize, filename };
}

/**
 * Wait for storybook to load
 */
export async function waitForStorybookLoad(page: Page) {
  // Wait for storybook viewer to open - longer timeout for data loading
  await waitForElement(page, '[role="dialog"], .storybook-viewer, [data-testid="storybook-viewer"]', {
    timeout: 30000,
  });
  
  // Wait for first page content to load
  await page.waitForTimeout(2000);
  
  // Wait for images/content
  await page.waitForSelector('img, text=/page|milestone/i', { timeout: 15000 }).catch(() => {});
}

/**
 * Navigate storybook pages
 */
export async function navigateStorybook(page: Page, direction: 'next' | 'previous', count: number = 1) {
  for (let i = 0; i < count; i++) {
    const button = direction === 'next' 
      ? page.locator('button:has-text("Next"), button[aria-label*="next" i]').first()
      : page.locator('button:has-text("Previous"), button[aria-label*="previous" i]').first();
    
    if (await button.isVisible({ timeout: 5000 }).catch(() => false)) {
      await button.click({ timeout: 5000 });
      await page.waitForTimeout(1500); // Longer wait for content to load
    }
  }
}

/**
 * Wait for AI processing to complete
 */
export async function waitForAIProcessing(page: Page, timeout: number = 300000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    // Check for completion indicators
    const isComplete = await page.locator('text=/approved|completed|ready/i').isVisible().catch(() => false);
    const isFailed = await page.locator('text=/failed|error/i').isVisible().catch(() => false);
    
    if (isComplete) {
      return true;
    }
    
    if (isFailed) {
      throw new Error('AI processing failed');
    }
    
    // Check progress
    const progress = await page.locator('[role="progressbar"], .progress-bar, [aria-valuenow]').first();
    if (await progress.isVisible()) {
      const value = await progress.getAttribute('aria-valuenow');
      if (value === '100') {
        return true;
      }
    }
    
    await page.waitForTimeout(2000); // Poll every 2 seconds
  }
  
  throw new Error('AI processing timeout');
}

/**
 * Clean up test data (if needed)
 */
export async function cleanupTestData(page: Page) {
  // This would typically call an API to clean up test data
  // For now, we'll just log
  console.log('Test data cleanup would happen here');
}

