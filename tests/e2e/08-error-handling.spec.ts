import { test, expect } from '@playwright/test';
import { waitForPageLoad, takeScreenshot } from './helpers';

test.describe('Error Handling', () => {
  test('ERR-1: Network error handling', async ({ page, context }) => {
    // Simulate offline
    await context.setOffline(true);
    
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Try to navigate
    await page.locator('a:has-text("Get Your Free Assessment")').first().click();
    
    // Should handle gracefully
    await page.waitForTimeout(2000);
    
    // Restore online
    await context.setOffline(false);
  });

  test('ERR-2: 404 error handling', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await waitForPageLoad(page);
    
    // Should show 404 page or redirect
    await takeScreenshot(page, 'error-404');
  });

  test('ERR-3: Form submission error', async ({ page }) => {
    await page.goto('/assessment/review');
    await waitForPageLoad(page);
    
    // Try to submit with invalid data
    const submitButton = page.locator('button:has-text("Create Account")').first();
    if (await submitButton.isVisible()) {
      // Intercept and fail the request
      await page.route('**/api/assessment/submit', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' }),
        });
      });
      
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]:nth-of-type(1)', 'password');
      await page.fill('input[type="password"]:nth-of-type(2)', 'password');
      await page.fill('input[name="fullName"]', 'Test User');
      
      await submitButton.click();
      
      // Should show error message
      await expect(page.locator('text=/error|unable|failed/i').first()).toBeVisible({ timeout: 5000 });
      await takeScreenshot(page, 'error-form-submission');
    }
  });

  test('ERR-4: Authentication error', async ({ page }) => {
    await page.goto('/login');
    await waitForPageLoad(page);
    
    // Try to login with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.locator('button:has-text("Login")').first().click();
    
    // Should show error message
    await expect(page.locator('text=/invalid|incorrect|error/i').first()).toBeVisible({ timeout: 5000 });
    await takeScreenshot(page, 'error-authentication');
  });

  test('ERR-5: Unauthorized access', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard/parent');
    await waitForPageLoad(page);
    
    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });
});

